import { Router, Request, Response } from 'express';
import { prisma } from '../../db.js';
import { requireAuth } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/rbac.js';

const router = Router();

// Helper to determine target location for a request
function resolveLocationId(req: Request): string {
  const queryLoc = (req.query.locationId as string) || (req.body?.locationId as string);
  if (queryLoc && queryLoc.trim()) {
    return queryLoc.trim();
  }
  return req.user?.locationId || 'location-emsdetten';
}

const DEFAULT_CHORE_TEMPLATES = [
  {
    title: 'Küche & Abwasch',
    description: 'Spülmaschine ein-/ausräumen, Herd & Spüle sauber wischen, Arbeitsflächen freihalten.',
    icon: '🍽️',
    assignedResidentIds: null,
  },
  {
    title: 'Zimmerreinigung',
    description: 'Eigenes Zimmer lüften, aufräumen, Boden saugen und Mülleimer leeren.',
    icon: '🧹',
    assignedResidentIds: JSON.stringify(['ALL']),
  },
  {
    title: 'Müll & Recycling',
    description: 'Mülleimer in Küche und Flur prüfen, Gelben Sack/Restmüll rausbringen.',
    icon: '🗑️',
    assignedResidentIds: null,
  },
  {
    title: 'Gemeinschaftsräume',
    description: 'Wohnzimmer und Flur ordentlich halten, lüften und Tisch abwischen.',
    icon: '✨',
    assignedResidentIds: null,
  },
  {
    title: 'Badezimmer',
    description: 'Waschbecken, Ablagen und Spiegel sauber halten, Handtücher wechseln.',
    icon: '🧼',
    assignedResidentIds: null,
  },
];

// Helper to parse resident ID arrays safely
function parseResidentIds(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try {
    let parsed = JSON.parse(raw);
    if (typeof parsed === 'string') {
      try {
        const inner = JSON.parse(parsed);
        if (Array.isArray(inner)) parsed = inner;
        else if (typeof inner === 'string') parsed = [inner];
      } catch {
        parsed = [parsed];
      }
    }
    if (Array.isArray(parsed)) return parsed.map(String).filter(Boolean);
    if (typeof parsed === 'string') return [parsed];
  } catch {
    if (raw.includes(',')) {
      return raw.split(',').map((s) => s.trim()).filter(Boolean);
    }
    return [raw.trim()];
  }
  return [];
}

// Helper to resolve assigned residents given raw IDs, legacy fallback, and location residents
function resolveResidents(
  assignedResidentIdsRaw: string | null | undefined,
  fallbackResidentId: string | null | undefined,
  allResidents: any[]
): { isAllResidents: boolean; residentIds: string[]; assignedResidents: any[] } {
  const ids = parseResidentIds(assignedResidentIdsRaw);
  if (ids.length === 0 && fallbackResidentId) {
    ids.push(fallbackResidentId);
  }

  const isAllResidents = ids.includes('ALL');
  if (isAllResidents) {
    return {
      isAllResidents: true,
      residentIds: ['ALL'],
      assignedResidents: allResidents,
    };
  }

  const assignedResidents = allResidents.filter((r) => ids.includes(r.id));
  return {
    isAllResidents: false,
    residentIds: ids,
    assignedResidents,
  };
}

// Helper to resolve resident completion breakdown for an assignment
function resolveResidentCompletion(
  assignedResidents: any[],
  isAllResidents: boolean,
  completedResidentIdsRaw: string | null | undefined,
  legacyIsCompleted: boolean,
  currentUserId?: string
) {
  let completedIds = parseResidentIds(completedResidentIdsRaw);

  // Only apply legacy fallback if completedResidentIds was never stored (null or undefined)
  // If completedResidentIdsRaw was explicitly set to "[]" or empty, do NOT resurrect completion!
  const hasExplicitCompletedField = completedResidentIdsRaw !== null && completedResidentIdsRaw !== undefined;
  if (!hasExplicitCompletedField && legacyIsCompleted && assignedResidents.length > 0) {
    completedIds = assignedResidents.map((r) => r.id);
  }

  const completedResidents = assignedResidents.filter((r) => completedIds.includes(r.id));
  const pendingResidents = assignedResidents.filter((r) => !completedIds.includes(r.id));
  const totalAssignedCount = assignedResidents.length;
  const completedCount = completedResidents.length;

  const isFullyCompleted = totalAssignedCount > 0
    ? completedCount >= totalAssignedCount
    : (hasExplicitCompletedField ? completedIds.length > 0 : Boolean(legacyIsCompleted));

  const isCompletedForMe = currentUserId ? completedIds.includes(currentUserId) : false;

  return {
    completedResidentIds: completedIds,
    completedResidents,
    pendingResidents,
    totalAssignedCount,
    completedCount,
    isCompleted: isFullyCompleted,
    isCompletedForMe,
  };
}

// Ensure default templates exist for a given location
async function ensureDefaultTemplates(locationId: string) {
  const count = await prisma.choreTemplate.count({
    where: { locationId },
  });

  if (count === 0) {
    for (let i = 0; i < DEFAULT_CHORE_TEMPLATES.length; i++) {
      const def = DEFAULT_CHORE_TEMPLATES[i];
      await prisma.choreTemplate.create({
        data: {
          locationId,
          title: def.title,
          description: def.description,
          icon: def.icon,
          sortOrder: i,
          isActive: true,
          assignedResidentIds: def.assignedResidentIds,
        },
      });
    }
  } else {
    // If Zimmerreinigung exists without assignedResidentIds, set to ALL as default
    await prisma.choreTemplate.updateMany({
      where: {
        locationId,
        title: 'Zimmerreinigung',
        assignedResidentIds: null,
      },
      data: {
        assignedResidentIds: JSON.stringify(['ALL']),
      },
    });
  }
}

// Calculate Date object for Monday of a given ISO year & weekNumber
function getMondayOfISOWeek(year: number, week: number): Date {
  const simple = new Date(Date.UTC(year, 0, 1 + (week - 1) * 7));
  const dow = simple.getUTCDay();
  const isoMonday = new Date(simple);
  if (dow <= 4) {
    isoMonday.setUTCDate(simple.getUTCDate() - simple.getUTCDay() + 1);
  } else {
    isoMonday.setUTCDate(simple.getUTCDate() + 8 - simple.getUTCDay());
  }
  return isoMonday;
}

// Format Date to YYYY-MM-DD
function formatDate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// ==================== TEMPLATES CRUD ====================

// 1. List templates for location
router.get('/templates', requireAuth, async (req: Request, res: Response) => {
  try {
    const locationId = resolveLocationId(req);
    await ensureDefaultTemplates(locationId);

    const [templates, locationResidents] = await Promise.all([
      prisma.choreTemplate.findMany({
        where: { locationId, isActive: true },
        orderBy: [{ sortOrder: 'asc' }, { title: 'asc' }],
      }),
      prisma.user.findMany({
        where: { locationId, role: 'BEWOHNER', isActive: true },
        select: {
          id: true,
          name: true,
          username: true,
          avatarColor: true,
          avatarUrl: true,
        },
      }),
    ]);

    const enrichedTemplates = templates.map((tmpl) => {
      const resolved = resolveResidents(tmpl.assignedResidentIds, null, locationResidents);
      return {
        ...tmpl,
        isAllResidents: resolved.isAllResidents,
        assignedResidents: resolved.assignedResidents,
        assignedResidentIdsList: resolved.residentIds,
      };
    });

    return res.json(enrichedTemplates);
  } catch (err) {
    console.error('Fehler beim Laden der Aufgaben-Vorlagen:', err);
    return res.status(500).json({ error: 'Fehler beim Laden der Aufgaben-Vorlagen.' });
  }
});

// 2. Create template
router.post('/templates', requireAuth, requireRole('ADMIN', 'BETREUER'), async (req: Request, res: Response) => {
  try {
    const locationId = resolveLocationId(req);
    const { title, description, icon, sortOrder, assignedResidentIds } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Titel der Aufgabe ist erforderlich.' });
    }

    const assignedResidentIdsStr = Array.isArray(assignedResidentIds)
      ? JSON.stringify(assignedResidentIds)
      : typeof assignedResidentIds === 'string'
      ? assignedResidentIds
      : null;

    const currentCount = await prisma.choreTemplate.count({ where: { locationId } });
    const template = await prisma.choreTemplate.create({
      data: {
        locationId,
        title: title.trim(),
        description: description?.trim() || null,
        icon: icon?.trim() || '🧹',
        sortOrder: typeof sortOrder === 'number' ? sortOrder : currentCount,
        isActive: true,
        assignedResidentIds: assignedResidentIdsStr,
      },
    });

    return res.status(201).json(template);
  } catch (err) {
    console.error('Fehler beim Erstellen der Aufgaben-Vorlage:', err);
    return res.status(500).json({ error: 'Fehler beim Erstellen der Aufgaben-Vorlage.' });
  }
});

// 3. Update template
router.put('/templates/:id', requireAuth, requireRole('ADMIN', 'BETREUER'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, description, icon, sortOrder, isActive, assignedResidentIds } = req.body;

    const existing = await prisma.choreTemplate.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Aufgaben-Vorlage nicht gefunden.' });
    }

    let assignedResidentIdsStr: string | null | undefined = undefined;
    if (assignedResidentIds !== undefined) {
      assignedResidentIdsStr = Array.isArray(assignedResidentIds)
        ? JSON.stringify(assignedResidentIds)
        : typeof assignedResidentIds === 'string'
        ? assignedResidentIds
        : null;
    }

    const updated = await prisma.choreTemplate.update({
      where: { id },
      data: {
        title: title !== undefined ? title.trim() : undefined,
        description: description !== undefined ? description?.trim() || null : undefined,
        icon: icon !== undefined ? icon?.trim() || '🧹' : undefined,
        sortOrder: typeof sortOrder === 'number' ? sortOrder : undefined,
        isActive: typeof isActive === 'boolean' ? isActive : undefined,
        assignedResidentIds: assignedResidentIdsStr,
      },
    });

    return res.json(updated);
  } catch (err) {
    console.error('Fehler beim Aktualisieren der Aufgaben-Vorlage:', err);
    return res.status(500).json({ error: 'Fehler beim Aktualisieren der Aufgaben-Vorlage.' });
  }
});

// 4. Delete template (soft delete via isActive = false)
router.delete('/templates/:id', requireAuth, requireRole('ADMIN', 'BETREUER'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const existing = await prisma.choreTemplate.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Aufgaben-Vorlage nicht gefunden.' });
    }

    await prisma.choreTemplate.update({
      where: { id },
      data: { isActive: false },
    });

    return res.json({ success: true });
  } catch (err) {
    console.error('Fehler beim Deaktivieren der Aufgaben-Vorlage:', err);
    return res.status(500).json({ error: 'Fehler beim Deaktivieren der Aufgaben-Vorlage.' });
  }
});

// ==================== WEEKLY PLAN & ASSIGNMENTS ====================

// 5. Get week plan with all days & assignments
router.get('/week', requireAuth, async (req: Request, res: Response) => {
  try {
    const locationId = resolveLocationId(req);
    await ensureDefaultTemplates(locationId);

    const now = new Date();
    const year = Number(req.query.year) || now.getFullYear();
    const weekNumber = Number(req.query.weekNumber) || 1;

    // Generate dates for Monday to Sunday
    const monday = getMondayOfISOWeek(year, weekNumber);
    const dayNames = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'];
    const days = [];

    for (let i = 0; i < 7; i++) {
      const curDate = new Date(monday);
      curDate.setUTCDate(monday.getUTCDate() + i);
      const dateStr = formatDate(curDate);
      days.push({
        dayOfWeek: i + 1, // 1 = Mo ... 7 = So
        name: dayNames[i],
        date: dateStr,
      });
    }

    // Active templates and residents for location
    const [templates, locationResidents, assignments] = await Promise.all([
      prisma.choreTemplate.findMany({
        where: { locationId, isActive: true },
        orderBy: [{ sortOrder: 'asc' }, { title: 'asc' }],
      }),
      prisma.user.findMany({
        where: { locationId, role: 'BEWOHNER', isActive: true },
        select: {
          id: true,
          name: true,
          username: true,
          avatarColor: true,
          avatarUrl: true,
        },
      }),
      prisma.choreAssignment.findMany({
        where: {
          locationId,
          OR: [
            { year, weekNumber },
            { date: { in: days.map((d) => d.date) } },
          ],
        },
        include: {
          resident: {
            select: {
              id: true,
              name: true,
              username: true,
              avatarColor: true,
              avatarUrl: true,
            },
          },
          template: {
            select: {
              id: true,
              title: true,
              icon: true,
              description: true,
              assignedResidentIds: true,
            },
          },
        },
      }),
    ]);

    // Enrich templates with resolved residents
    const enrichedTemplates = templates.map((tmpl) => {
      const resolved = resolveResidents(tmpl.assignedResidentIds, null, locationResidents);
      return {
        ...tmpl,
        isAllResidents: resolved.isAllResidents,
        assignedResidents: resolved.assignedResidents,
        assignedResidentIdsList: resolved.residentIds,
      };
    });

    // Enrich assignments with resolved residents (inheriting template default if assignment has none set or resolved to empty)
    const enrichedAssignments = assignments.map((assign) => {
      let resolved = resolveResidents(
        assign.assignedResidentIds,
        assign.residentId,
        locationResidents
      );

      // If assignment has no explicit setting (assignedResidentIds === null) or resolved to empty, inherit template default
      if ((assign.assignedResidentIds === null || resolved.residentIds.length === 0) && assign.template?.assignedResidentIds) {
        resolved = resolveResidents(
          assign.template.assignedResidentIds,
          assign.residentId,
          locationResidents
        );
      }

      const completion = resolveResidentCompletion(
        resolved.assignedResidents,
        resolved.isAllResidents,
        assign.completedResidentIds,
        assign.isCompleted,
        req.user?.id
      );

      return {
        ...assign,
        isAllResidents: resolved.isAllResidents,
        assignedResidents: resolved.assignedResidents,
        assignedResidentIdsList: resolved.residentIds,
        completedResidentIds: completion.completedResidentIds,
        completedResidents: completion.completedResidents,
        pendingResidents: completion.pendingResidents,
        totalAssignedCount: completion.totalAssignedCount,
        completedCount: completion.completedCount,
        isCompleted: completion.isCompleted,
        isCompletedForMe: completion.isCompletedForMe,
      };
    });

    return res.json({
      locationId,
      year,
      weekNumber,
      days,
      templates: enrichedTemplates,
      assignments: enrichedAssignments,
    });
  } catch (err) {
    console.error('Fehler beim Laden des Aufgabenplans:', err);
    return res.status(500).json({ error: 'Fehler beim Laden des Aufgabenplans.' });
  }
});

// 6. Assign resident(s) to a task on a specific day
router.post('/assign', requireAuth, requireRole('ADMIN', 'BETREUER'), async (req: Request, res: Response) => {
  try {
    const locationId = resolveLocationId(req);
    const { templateId, date, year, weekNumber, dayOfWeek, residentId, assignedResidentIds } = req.body;

    if (!templateId || !date || !year || !weekNumber || !dayOfWeek) {
      return res.status(400).json({ error: 'Unvollständige Zuweisungsdaten.' });
    }

    // Determine resident IDs to assign
    let ids: string[] = [];
    if (Array.isArray(assignedResidentIds)) {
      ids = assignedResidentIds.map(String).filter(Boolean);
    } else if (typeof assignedResidentIds === 'string' && assignedResidentIds.trim()) {
      ids = parseResidentIds(assignedResidentIds);
    } else if (residentId) {
      ids = [String(residentId)];
    }

    // If ids is empty, unassign
    if (ids.length === 0) {
      const template = await prisma.choreTemplate.findUnique({ where: { id: templateId } });
      const hasTemplateDefault = !!template?.assignedResidentIds;

      if (hasTemplateDefault) {
        // Store explicit empty array '[]' to override the template's default assignment for this date
        const assignment = await prisma.choreAssignment.upsert({
          where: {
            locationId_templateId_date: {
              locationId,
              templateId,
              date,
            },
          },
          update: {
            residentId: null,
            assignedResidentIds: JSON.stringify([]),
            year: Number(year),
            weekNumber: Number(weekNumber),
            dayOfWeek: Number(dayOfWeek),
          },
          create: {
            locationId,
            templateId,
            date,
            year: Number(year),
            weekNumber: Number(weekNumber),
            dayOfWeek: Number(dayOfWeek),
            residentId: null,
            assignedResidentIds: JSON.stringify([]),
            isCompleted: false,
          },
          include: {
            resident: true,
            template: true,
          },
        });
        return res.json({ success: true, assignment });
      } else {
        const existing = await prisma.choreAssignment.findUnique({
          where: {
            locationId_templateId_date: {
              locationId,
              templateId,
              date,
            },
          },
        });

        if (existing) {
          if (!existing.isCompleted) {
            await prisma.choreAssignment.delete({ where: { id: existing.id } });
            return res.json({ success: true, assignment: null });
          } else {
            const updated = await prisma.choreAssignment.update({
              where: { id: existing.id },
              data: { residentId: null, assignedResidentIds: JSON.stringify([]) },
              include: { resident: true, template: true },
            });
            return res.json({ success: true, assignment: updated });
          }
        }
        return res.json({ success: true, assignment: null });
      }
    }

    const assignedResidentIdsStr = JSON.stringify(ids);
    const primaryResidentId = ids.includes('ALL') || ids.length === 0 ? null : ids[0];

    // Upsert assignment
    const assignment = await prisma.choreAssignment.upsert({
      where: {
        locationId_templateId_date: {
          locationId,
          templateId,
          date,
        },
      },
      update: {
        residentId: primaryResidentId,
        assignedResidentIds: assignedResidentIdsStr,
        year: Number(year),
        weekNumber: Number(weekNumber),
        dayOfWeek: Number(dayOfWeek),
      },
      create: {
        locationId,
        templateId,
        date,
        year: Number(year),
        weekNumber: Number(weekNumber),
        dayOfWeek: Number(dayOfWeek),
        residentId: primaryResidentId,
        assignedResidentIds: assignedResidentIdsStr,
        isCompleted: false,
      },
      include: {
        resident: {
          select: {
            id: true,
            name: true,
            username: true,
            avatarColor: true,
            avatarUrl: true,
          },
        },
        template: {
          select: {
            id: true,
            title: true,
            icon: true,
            description: true,
          },
        },
      },
    });

    return res.json({ success: true, assignment });
  } catch (err) {
    console.error('Fehler beim Zuweisen der Aufgabe:', err);
    return res.status(500).json({ error: 'Fehler beim Zuweisen der Aufgabe.' });
  }
});

// 7. Toggle completion status of an assignment (Staff & Residents)
router.post('/toggle-complete', requireAuth, async (req: Request, res: Response) => {
  try {
    const locationId = resolveLocationId(req);
    const { assignmentId, templateId, date, year, weekNumber, dayOfWeek, residentId } = req.body;

    // Determine who is toggling: resident toggles their own ID; staff can toggle a specific resident or entire chore
    const togglingResidentId = req.user?.role === 'BEWOHNER' ? req.user.id : (residentId || null);

    let targetAssignment = null;

    if (assignmentId) {
      targetAssignment = await prisma.choreAssignment.findUnique({
        where: { id: assignmentId },
      });
    }

    if (!targetAssignment && templateId && date) {
      targetAssignment = await prisma.choreAssignment.findFirst({
        where: {
          locationId,
          templateId,
          date,
        },
      });
      // Fallback: match by templateId and date regardless of locationId discrepancy
      if (!targetAssignment) {
        targetAssignment = await prisma.choreAssignment.findFirst({
          where: {
            templateId,
            date,
          },
        });
      }
    }

    const targetLocId = targetAssignment?.locationId || locationId;
    const effectiveTemplateId = targetAssignment?.templateId || templateId;

    const [template, locationResidents] = await Promise.all([
      effectiveTemplateId
        ? prisma.choreTemplate.findUnique({ where: { id: effectiveTemplateId } })
        : null,
      prisma.user.findMany({
        where: { locationId: targetLocId, role: 'BEWOHNER', isActive: true },
        select: { id: true, name: true, username: true, avatarColor: true, avatarUrl: true },
      }),
    ]);

    const effectiveAssignedRaw = (targetAssignment?.assignedResidentIds !== null && targetAssignment?.assignedResidentIds !== undefined)
      ? targetAssignment.assignedResidentIds
      : (template?.assignedResidentIds || null);

    let resolved = resolveResidents(
      effectiveAssignedRaw,
      targetAssignment?.residentId,
      locationResidents
    );

    if (resolved.residentIds.length === 0 && template?.assignedResidentIds) {
      resolved = resolveResidents(
        template.assignedResidentIds,
        targetAssignment?.residentId,
        locationResidents
      );
    }
    const allAssignedIds = resolved.assignedResidents.map((r: any) => r.id);

    if (!targetAssignment) {
      if (!templateId || !date) {
        return res.status(404).json({ error: 'Aufgabe nicht gefunden.' });
      }

      // Calculate year, weekNumber, dayOfWeek accurately from date string YYYY-MM-DD
      let calcYear = new Date().getFullYear();
      let calcWeek = 1;
      let calcDayOfWeek = 1;
      if (date && date.includes('-')) {
        const [dYear, dMonth, dDay] = date.split('-').map(Number);
        const parsedDate = new Date(Date.UTC(dYear, (dMonth || 1) - 1, dDay || 1));
        calcDayOfWeek = parsedDate.getUTCDay() === 0 ? 7 : parsedDate.getUTCDay();
        const calcDateCopy = new Date(Date.UTC(parsedDate.getUTCFullYear(), parsedDate.getUTCMonth(), parsedDate.getUTCDate()));
        calcDateCopy.setUTCDate(calcDateCopy.getUTCDate() + 4 - calcDayOfWeek);
        const calcYearStart = new Date(Date.UTC(calcDateCopy.getUTCFullYear(), 0, 1));
        calcWeek = Math.ceil(((calcDateCopy.getTime() - calcYearStart.getTime()) / 86400000 + 1) / 7);
        calcYear = calcDateCopy.getUTCFullYear();
      }

      const finalYear = Number(year) || calcYear;
      const finalWeekNumber = Number(weekNumber) || calcWeek;
      const finalDayOfWeek = Number(dayOfWeek) || calcDayOfWeek;

      let completedIds: string[] = [];
      let newIsCompleted = false;

      if (togglingResidentId) {
        completedIds = [togglingResidentId];
        newIsCompleted = allAssignedIds.length > 0
          ? allAssignedIds.every((id) => completedIds.includes(id))
          : false;
      } else {
        completedIds = allAssignedIds.length > 0 ? [...allAssignedIds] : [];
        newIsCompleted = allAssignedIds.length > 0;
      }

      const parsedAssigned = parseResidentIds(effectiveAssignedRaw);
      const isAll = parsedAssigned.includes('ALL');
      const primaryResId = !isAll && parsedAssigned.length === 1 ? parsedAssigned[0] : null;

      const assignment = await prisma.choreAssignment.create({
        data: {
          locationId: template?.locationId || targetLocId,
          templateId,
          date,
          year: finalYear,
          weekNumber: finalWeekNumber,
          dayOfWeek: finalDayOfWeek,
          residentId: primaryResId,
          assignedResidentIds: effectiveAssignedRaw,
          completedResidentIds: JSON.stringify(completedIds),
          isCompleted: newIsCompleted,
          completedAt: newIsCompleted ? new Date() : (completedIds.length > 0 ? new Date() : null),
          completedById: req.user?.id,
        },
        include: {
          resident: {
            select: {
              id: true,
              name: true,
              username: true,
              avatarColor: true,
              avatarUrl: true,
            },
          },
          template: {
            select: {
              id: true,
              title: true,
              icon: true,
              description: true,
            },
          },
        },
      });

      const completion = resolveResidentCompletion(
        resolved.assignedResidents,
        resolved.isAllResidents,
        assignment.completedResidentIds,
        assignment.isCompleted,
        req.user?.id
      );

      return res.json({
        success: true,
        assignment: {
          ...assignment,
          ...completion,
        },
      });
    }

    // Existing assignment: Toggle resident or all
    let completedIds = parseResidentIds(targetAssignment.completedResidentIds);
    if (targetAssignment.isCompleted && (targetAssignment.completedResidentIds === null || targetAssignment.completedResidentIds === undefined) && allAssignedIds.length > 0) {
      completedIds = [...allAssignedIds];
    }

    let newIsCompleted = false;

    if (togglingResidentId) {
      if (completedIds.includes(togglingResidentId)) {
        completedIds = completedIds.filter((id) => id !== togglingResidentId);
      } else {
        completedIds.push(togglingResidentId);
      }
      newIsCompleted = allAssignedIds.length > 0
        ? allAssignedIds.every((id) => completedIds.includes(id))
        : false;
    } else {
      if (targetAssignment.isCompleted) {
        completedIds = [];
        newIsCompleted = false;
      } else {
        completedIds = allAssignedIds.length > 0 ? [...allAssignedIds] : [];
        newIsCompleted = allAssignedIds.length > 0;
      }
    }

    // Ensure that if no residents have completed, newIsCompleted is strictly false
    if (completedIds.length === 0) {
      newIsCompleted = false;
    }

    const updated = await prisma.choreAssignment.update({
      where: { id: targetAssignment.id },
      data: {
        completedResidentIds: JSON.stringify(completedIds),
        isCompleted: newIsCompleted,
        completedAt: newIsCompleted ? new Date() : (completedIds.length > 0 ? new Date() : null),
        completedById: req.user?.id,
        assignedResidentIds: targetAssignment.assignedResidentIds || effectiveAssignedRaw,
      },
      include: {
        resident: {
          select: {
            id: true,
            name: true,
            username: true,
            avatarColor: true,
            avatarUrl: true,
          },
        },
        template: {
          select: {
            id: true,
            title: true,
            icon: true,
            description: true,
          },
        },
      },
    });

    const completion = resolveResidentCompletion(
      resolved.assignedResidents,
      resolved.isAllResidents,
      updated.completedResidentIds,
      updated.isCompleted,
      req.user?.id
    );

    return res.json({
      success: true,
      assignment: {
        ...updated,
        ...completion,
      },
    });
  } catch (err) {
    console.error('Fehler beim Ändern des Erledigt-Status:', err);
    return res.status(500).json({ error: 'Fehler beim Ändern des Erledigt-Status.' });
  }
});

// ==================== DASHBOARD TODAY'S CHORES ====================

// 8. Get today's chores for dashboard
router.get('/today', requireAuth, async (req: Request, res: Response) => {
  try {
    const locationId = resolveLocationId(req);
    await ensureDefaultTemplates(locationId);

    const now = new Date();
    const todayDate = formatDate(now);

    const [templates, locationResidents, assignments] = await Promise.all([
      prisma.choreTemplate.findMany({
        where: { locationId, isActive: true },
        orderBy: [{ sortOrder: 'asc' }, { title: 'asc' }],
      }),
      prisma.user.findMany({
        where: { locationId, role: 'BEWOHNER', isActive: true },
        select: {
          id: true,
          name: true,
          username: true,
          avatarColor: true,
          avatarUrl: true,
        },
      }),
      prisma.choreAssignment.findMany({
        where: {
          locationId,
          date: todayDate,
        },
        include: {
          resident: {
            select: {
              id: true,
              name: true,
              username: true,
              avatarColor: true,
              avatarUrl: true,
            },
          },
          template: {
            select: {
              id: true,
              title: true,
              icon: true,
              description: true,
              assignedResidentIds: true,
            },
          },
        },
      }),
    ]);

    // Map each active template to today's assignment status
    const todayItems = templates.map((tmpl) => {
      const match = assignments.find((a) => a.templateId === tmpl.id);
      let resolved = resolveResidents(
        match?.assignedResidentIds,
        match?.residentId,
        locationResidents
      );

      // Inherit template's assignedResidentIds if assignment has no explicit setting or resolved to empty
      if ((!match || match.assignedResidentIds === null || resolved.residentIds.length === 0) && tmpl.assignedResidentIds) {
        resolved = resolveResidents(tmpl.assignedResidentIds, match?.residentId, locationResidents);
      }

      const completion = resolveResidentCompletion(
        resolved.assignedResidents,
        resolved.isAllResidents,
        match?.completedResidentIds,
        match ? match.isCompleted : false,
        req.user?.id
      );

      return {
        templateId: tmpl.id,
        title: tmpl.title,
        description: tmpl.description,
        icon: tmpl.icon,
        assignmentId: match ? match.id : null,
        resident: match?.resident || resolved.assignedResidents[0] || null,
        residentId: match?.residentId || resolved.residentIds[0] || null,
        assignedResidents: resolved.assignedResidents,
        isAllResidents: resolved.isAllResidents,
        completedResidentIds: completion.completedResidentIds,
        completedResidents: completion.completedResidents,
        pendingResidents: completion.pendingResidents,
        totalAssignedCount: completion.totalAssignedCount,
        completedCount: completion.completedCount,
        isCompleted: completion.isCompleted,
        isCompletedForMe: completion.isCompletedForMe,
        completedAt: match?.completedAt || null,
        date: todayDate,
      };
    });

    const myTasks = req.user
      ? todayItems.filter((item) => {
          if (item.isAllResidents) return true;
          if (item.assignedResidents.some((r: any) => r.id === req.user?.id)) return true;
          return item.residentId === req.user?.id;
        })
      : [];

    const totalCount = todayItems.length;
    const completedCount = todayItems.filter((t) => t.isCompleted).length;
    const myTotalCount = myTasks.length;
    const myCompletedCount = myTasks.filter((t) => t.isCompletedForMe).length;

    return res.json({
      date: todayDate,
      locationId,
      todayItems,
      myTasks,
      totalCount,
      completedCount,
      myTotalCount,
      myCompletedCount,
    });
  } catch (err) {
    console.error('Fehler beim Laden der heutigen Aufgaben:', err);
    return res.status(500).json({ error: 'Fehler beim Laden der heutigen Aufgaben.' });
  }
});

export default router;
