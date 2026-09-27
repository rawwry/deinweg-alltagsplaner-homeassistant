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
    assignedResidentIds: null,
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
      assignedResidents: allResidents.filter((r) => r.role !== 'HAUSHALTSKRAFT'),
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

// Calculate ISO year and ISO week number accurately
function getISOWeekAndYear(d: Date): { year: number; week: number } {
  const target = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNr = target.getUTCDay() || 7;
  target.setUTCDate(target.getUTCDate() + 4 - dayNr);
  const yearStart = new Date(Date.UTC(target.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((target.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return { year: target.getUTCFullYear(), week: weekNo };
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
        where: { locationId, role: { in: ['BEWOHNER', 'HAUSHALTSKRAFT'] }, isActive: true },
        select: {
          id: true,
          name: true,
          username: true,
          avatarColor: true,
          avatarUrl: true,
          role: true,
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
    console.error('Fehler beim Laden der Aufgaben:', err);
    return res.status(500).json({ error: 'Fehler beim Laden der Aufgaben.' });
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
    console.error('Fehler beim Erstellen der Aufgabe:', err);
    return res.status(500).json({ error: 'Fehler beim Erstellen der Aufgabe.' });
  }
});

// 3. Update template
router.put('/templates/:id', requireAuth, requireRole('ADMIN', 'BETREUER'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, description, icon, sortOrder, isActive, assignedResidentIds } = req.body;

    const existing = await prisma.choreTemplate.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Aufgabe nicht gefunden.' });
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
    console.error('Fehler beim Aktualisieren der Aufgabe:', err);
    return res.status(500).json({ error: 'Fehler beim Aktualisieren der Aufgabe.' });
  }
});

// 4. Delete template (soft delete via isActive = false)
router.delete('/templates/:id', requireAuth, requireRole('ADMIN', 'BETREUER'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const existing = await prisma.choreTemplate.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Aufgabe nicht gefunden.' });
    }

    await prisma.choreTemplate.update({
      where: { id },
      data: { isActive: false },
    });

    return res.json({ success: true });
  } catch (err) {
    console.error('Fehler beim Deaktivieren der Aufgabe:', err);
    return res.status(500).json({ error: 'Fehler beim Deaktivieren der Aufgabe.' });
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

    // Active templates, residents, explicit assignments and recurring assignments for location
    const [templates, locationResidents, assignments, recurringAssignments] = await Promise.all([
      prisma.choreTemplate.findMany({
        where: { locationId, isActive: true },
        orderBy: [{ sortOrder: 'asc' }, { title: 'asc' }],
      }),
      prisma.user.findMany({
        where: { locationId, role: { in: ['BEWOHNER', 'HAUSHALTSKRAFT'] }, isActive: true },
        select: {
          id: true,
          name: true,
          username: true,
          avatarColor: true,
          avatarUrl: true,
          role: true,
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
      prisma.choreRecurringAssignment.findMany({
        where: { locationId, isActive: true },
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

    const allEnrichedAssignments: any[] = [];

    // 1. Enrich explicit assignments stored in DB
    for (const assign of assignments) {
      let resolved = resolveResidents(
        assign.assignedResidentIds,
        assign.residentId,
        locationResidents
      );

      // If assignment has no explicit setting (assignedResidentIds === null), inherit template default
      if (assign.assignedResidentIds === null && assign.template?.assignedResidentIds) {
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

      const hasRecurringRule = recurringAssignments.some(
        (r) => r.templateId === assign.templateId && r.dayOfWeek === assign.dayOfWeek
      );

      allEnrichedAssignments.push({
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
        isRecurring: hasRecurringRule,
      });
    }

    // 2. Synthesize virtual assignments from recurring rules where no explicit assignment exists for that date
    for (const day of days) {
      for (const tmpl of templates) {
        const hasExplicit = allEnrichedAssignments.some(
          (a) => a.templateId === tmpl.id && a.date === day.date
        );

        if (!hasExplicit) {
          const recMatch = recurringAssignments.find(
            (r) => r.templateId === tmpl.id && r.dayOfWeek === day.dayOfWeek
          );

          if (recMatch) {
            const resolved = resolveResidents(
              recMatch.assignedResidentIds,
              recMatch.residentId,
              locationResidents
            );
            const completion = resolveResidentCompletion(
              resolved.assignedResidents,
              resolved.isAllResidents,
              null,
              false,
              req.user?.id
            );

            allEnrichedAssignments.push({
              id: null,
              virtualId: `rec_${recMatch.id}_${day.date}`,
              locationId,
              templateId: tmpl.id,
              date: day.date,
              year,
              weekNumber,
              dayOfWeek: day.dayOfWeek,
              residentId: recMatch.residentId,
              assignedResidentIds: recMatch.assignedResidentIds,
              completedResidentIds: null,
              isCompleted: false,
              completedAt: null,
              completedById: null,
              notes: null,
              template: {
                id: tmpl.id,
                title: tmpl.title,
                icon: tmpl.icon,
                description: tmpl.description,
                assignedResidentIds: tmpl.assignedResidentIds,
              },
              resident: resolved.assignedResidents[0] || null,
              isAllResidents: resolved.isAllResidents,
              assignedResidents: resolved.assignedResidents,
              assignedResidentIdsList: resolved.residentIds,
              completedResidents: [],
              pendingResidents: resolved.assignedResidents,
              totalAssignedCount: resolved.assignedResidents.length,
              completedCount: 0,
              isCompletedForMe: false,
              isRecurring: true,
              isVirtualRecurring: true,
            });
          }
        }
      }
    }

    return res.json({
      locationId,
      year,
      weekNumber,
      days,
      templates: enrichedTemplates,
      assignments: allEnrichedAssignments,
    });
  } catch (err) {
    console.error('Fehler beim Laden des Aufgabenplans:', err);
    return res.status(500).json({ error: 'Fehler beim Laden des Aufgabenplans.' });
  }
});

// 6. Assign resident(s) to a task on a specific day (with optional weekly recurrence)
router.post('/assign', requireAuth, requireRole('ADMIN', 'BETREUER'), async (req: Request, res: Response) => {
  try {
    const locationId = resolveLocationId(req);
    const { templateId, date, year, weekNumber, dayOfWeek, residentId, assignedResidentIds, isRecurring } = req.body;

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

    const assignedResidentIdsStr = JSON.stringify(ids);
    const primaryResidentId = ids.includes('ALL') || ids.length === 0 ? null : ids[0];

    // Handle recurring assignment update if requested
    if (isRecurring !== undefined) {
      if (isRecurring === true && ids.length > 0) {
        await prisma.choreRecurringAssignment.upsert({
          where: {
            locationId_templateId_dayOfWeek: {
              locationId,
              templateId,
              dayOfWeek: Number(dayOfWeek),
            },
          },
          update: {
            residentId: primaryResidentId,
            assignedResidentIds: assignedResidentIdsStr,
            isActive: true,
          },
          create: {
            locationId,
            templateId,
            dayOfWeek: Number(dayOfWeek),
            residentId: primaryResidentId,
            assignedResidentIds: assignedResidentIdsStr,
            isActive: true,
          },
        });
      } else if (isRecurring === false || ids.length === 0) {
        await prisma.choreRecurringAssignment.deleteMany({
          where: {
            locationId,
            templateId,
            dayOfWeek: Number(dayOfWeek),
          },
        });
      }
    }

    // Upsert assignment for this date
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

    return res.json({ success: true, assignment, isRecurring: Boolean(isRecurring) });
  } catch (err) {
    console.error('Fehler beim Zuweisen der Aufgabe:', err);
    return res.status(500).json({ error: 'Fehler beim Zuweisen der Aufgabe.' });
  }
});

// Remove chore assignment completely from a day
router.post('/remove-from-day', requireAuth, requireRole('ADMIN', 'BETREUER'), async (req: Request, res: Response) => {
  try {
    const locationId = resolveLocationId(req);
    const { templateId, date, dayOfWeek, deleteRecurring } = req.body;

    if (!templateId || !date) {
      return res.status(400).json({ error: 'templateId und date erforderlich.' });
    }

    // 1. Delete explicit assignment for this date
    await prisma.choreAssignment.deleteMany({
      where: {
        locationId,
        templateId,
        date,
      },
    });

    // 2. If dayOfWeek provided, delete recurring assignment as well
    if (dayOfWeek !== undefined && deleteRecurring !== false) {
      await prisma.choreRecurringAssignment.deleteMany({
        where: {
          locationId,
          templateId,
          dayOfWeek: Number(dayOfWeek),
        },
      });
    }

    return res.json({ success: true });
  } catch (err) {
    console.error('Fehler beim Entfernen der Aufgabe vom Tag:', err);
    return res.status(500).json({ error: 'Fehler beim Entfernen der Aufgabe vom Tag.' });
  }
});

// ==================== RECURRING CHORES MANAGEMENT ====================

// List all recurring assignments for location
router.get('/recurring', requireAuth, async (req: Request, res: Response) => {
  try {
    const locationId = resolveLocationId(req);
    const [recurring, templates, locationResidents] = await Promise.all([
      prisma.choreRecurringAssignment.findMany({
        where: { locationId, isActive: true },
        orderBy: [{ dayOfWeek: 'asc' }, { createdAt: 'asc' }],
      }),
      prisma.choreTemplate.findMany({
        where: { locationId, isActive: true },
        orderBy: [{ sortOrder: 'asc' }, { title: 'asc' }],
      }),
      prisma.user.findMany({
        where: { locationId, role: { in: ['BEWOHNER', 'HAUSHALTSKRAFT'] }, isActive: true },
        select: { id: true, name: true, username: true, avatarColor: true, avatarUrl: true, role: true },
      }),
    ]);

    const enriched = recurring.map((rec) => {
      const tmpl = templates.find((t) => t.id === rec.templateId);
      const resolved = resolveResidents(rec.assignedResidentIds, rec.residentId, locationResidents);
      return {
        ...rec,
        template: tmpl || null,
        isAllResidents: resolved.isAllResidents,
        assignedResidents: resolved.assignedResidents,
        assignedResidentIdsList: resolved.residentIds,
      };
    });

    return res.json(enriched);
  } catch (err) {
    console.error('Fehler beim Laden der Dauer-Einteilungen:', err);
    return res.status(500).json({ error: 'Fehler beim Laden der Dauer-Einteilungen.' });
  }
});

// Save current week's assignments as recurring schedule for location
router.post('/save-week-as-recurring', requireAuth, requireRole('ADMIN', 'BETREUER'), async (req: Request, res: Response) => {
  try {
    const locationId = resolveLocationId(req);
    const { year, weekNumber } = req.body;
    if (!year || !weekNumber) {
      return res.status(400).json({ error: 'Jahr und Kalenderwoche erforderlich.' });
    }

    const monday = getMondayOfISOWeek(Number(year), Number(weekNumber));
    const datesWithDayOfWeek: { date: string; dayOfWeek: number }[] = [];
    for (let i = 0; i < 7; i++) {
      const cur = new Date(monday);
      cur.setUTCDate(monday.getUTCDate() + i);
      datesWithDayOfWeek.push({
        date: formatDate(cur),
        dayOfWeek: i + 1,
      });
    }

    const assignments = await prisma.choreAssignment.findMany({
      where: {
        locationId,
        date: { in: datesWithDayOfWeek.map((d) => d.date) },
      },
    });

    let savedCount = 0;
    for (const item of datesWithDayOfWeek) {
      const dayAssigns = assignments.filter((a) => a.date === item.date);
      for (const a of dayAssigns) {
        const ids = parseResidentIds(a.assignedResidentIds);
        if (ids.length > 0) {
          const primaryId = ids.includes('ALL') || ids.length === 0 ? null : ids[0];
          await prisma.choreRecurringAssignment.upsert({
            where: {
              locationId_templateId_dayOfWeek: {
                locationId,
                templateId: a.templateId,
                dayOfWeek: item.dayOfWeek,
              },
            },
            update: {
              residentId: primaryId,
              assignedResidentIds: a.assignedResidentIds,
              isActive: true,
            },
            create: {
              locationId,
              templateId: a.templateId,
              dayOfWeek: item.dayOfWeek,
              residentId: primaryId,
              assignedResidentIds: a.assignedResidentIds,
              isActive: true,
            },
          });
          savedCount++;
        } else {
          // If explicitly unassigned in this week, remove recurring rule
          await prisma.choreRecurringAssignment.deleteMany({
            where: {
              locationId,
              templateId: a.templateId,
              dayOfWeek: item.dayOfWeek,
            },
          });
        }
      }
    }

    return res.json({
      success: true,
      count: savedCount,
      message: `${savedCount} Aufgaben wurden als wöchentlich wiederkehrender Dauerplan gespeichert.`,
    });
  } catch (err) {
    console.error('Fehler beim Speichern des Dauerplans:', err);
    return res.status(500).json({ error: 'Fehler beim Speichern des Dauerplans.' });
  }
});

// Copy assignments from source week into following weeks
router.post('/copy-week', requireAuth, requireRole('ADMIN', 'BETREUER'), async (req: Request, res: Response) => {
  try {
    const locationId = resolveLocationId(req);
    const { sourceYear, sourceWeekNumber, targetWeeksCount = 4 } = req.body;
    if (!sourceYear || !sourceWeekNumber) {
      return res.status(400).json({ error: 'Quellwoche erforderlich.' });
    }

    const sMonday = getMondayOfISOWeek(Number(sourceYear), Number(sourceWeekNumber));
    const sourceDates: { date: string; dayOfWeek: number }[] = [];
    for (let i = 0; i < 7; i++) {
      const cur = new Date(sMonday);
      cur.setUTCDate(sMonday.getUTCDate() + i);
      sourceDates.push({ date: formatDate(cur), dayOfWeek: i + 1 });
    }

    const sourceAssignments = await prisma.choreAssignment.findMany({
      where: {
        locationId,
        date: { in: sourceDates.map((d) => d.date) },
      },
    });

    let totalCreated = 0;
    const weeksToCopy = Math.min(Math.max(Number(targetWeeksCount) || 1, 1), 26);

    for (let w = 1; w <= weeksToCopy; w++) {
      let tWeek = Number(sourceWeekNumber) + w;
      let tYear = Number(sourceYear);
      if (tWeek > 52) {
        tYear += Math.floor((tWeek - 1) / 52);
        tWeek = ((tWeek - 1) % 52) + 1;
      }

      const tMonday = getMondayOfISOWeek(tYear, tWeek);
      for (let i = 0; i < 7; i++) {
        const cur = new Date(tMonday);
        cur.setUTCDate(tMonday.getUTCDate() + i);
        const tDate = formatDate(cur);
        const dayOfWeek = i + 1;

        const sMatch = sourceAssignments.filter(
          (a) => a.dayOfWeek === dayOfWeek || a.date === sourceDates[i].date
        );

        for (const assign of sMatch) {
          const ids = parseResidentIds(assign.assignedResidentIds);
          if (ids.length > 0) {
            await prisma.choreAssignment.upsert({
              where: {
                locationId_templateId_date: {
                  locationId,
                  templateId: assign.templateId,
                  date: tDate,
                },
              },
              update: {
                residentId: assign.residentId,
                assignedResidentIds: assign.assignedResidentIds,
                year: tYear,
                weekNumber: tWeek,
                dayOfWeek,
              },
              create: {
                locationId,
                templateId: assign.templateId,
                date: tDate,
                year: tYear,
                weekNumber: tWeek,
                dayOfWeek,
                residentId: assign.residentId,
                assignedResidentIds: assign.assignedResidentIds,
                isCompleted: false,
              },
            });
            totalCreated++;
          }
        }
      }
    }

    return res.json({
      success: true,
      weeksCopied: weeksToCopy,
      assignmentsCopied: totalCreated,
      message: `Plan erfolgreich auf die nächsten ${weeksToCopy} Wochen übertragen (${totalCreated} Zuweisungen erstellt).`,
    });
  } catch (err) {
    console.error('Fehler beim Kopieren der Woche:', err);
    return res.status(500).json({ error: 'Fehler beim Kopieren des Wochenplans.' });
  }
});

// Delete a recurring assignment rule
router.delete('/recurring/:id', requireAuth, requireRole('ADMIN', 'BETREUER'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.choreRecurringAssignment.delete({ where: { id } });
    return res.json({ success: true });
  } catch (err) {
    console.error('Fehler beim Löschen der Dauer-Einteilung:', err);
    return res.status(500).json({ error: 'Fehler beim Löschen der Dauer-Einteilung.' });
  }
});

// 7. Toggle completion status of an assignment (Staff & Residents)
router.post('/toggle-complete', requireAuth, async (req: Request, res: Response) => {
  try {
    const locationId = resolveLocationId(req);
    const { assignmentId, templateId, date, year, weekNumber, dayOfWeek, residentId } = req.body;

    // Determine who is toggling: resident/housekeeping toggles their own ID; staff can toggle a specific resident or entire chore
    const togglingResidentId = (req.user?.role === 'BEWOHNER' || req.user?.role === 'HAUSHALTSKRAFT') ? req.user.id : (residentId || null);

    // Support toggling cooking tasks (chefkoch_...)
    if (templateId && String(templateId).startsWith('chefkoch_')) {
      const dayId = String(templateId).replace('chefkoch_', '');
      let day = await prisma.mealPlanDay.findUnique({
        where: { id: dayId },
        include: { mealPlan: true },
      });

      if (!day) {
        // Fallback: search by date and location
        const targetLocId = resolveLocationId(req);
        const targetDate = date ? new Date(date) : new Date();
        const { year: curYear, week: curWeek } = getISOWeekAndYear(targetDate);
        const dow = targetDate.getDay() === 0 ? 7 : targetDate.getDay();
        const plan = await prisma.mealPlan.findUnique({
          where: {
            locationId_year_weekNumber: {
              locationId: targetLocId,
              year: curYear,
              weekNumber: curWeek,
            },
          },
          include: {
            days: { where: { dayOfWeek: dow } },
          },
        });
        day = plan?.days?.[0] as any;
      }

      if (day) {
        const nextCompleted = !day.isCompleted;
        const updated = await prisma.mealPlanDay.update({
          where: { id: day.id },
          data: {
            isCompleted: nextCompleted,
            completedAt: nextCompleted ? new Date() : null,
            completedById: nextCompleted ? req.user?.id : null,
          },
        });
        return res.json({
          success: true,
          assignment: {
            id: updated.id,
            templateId,
            isCompleted: updated.isCompleted,
            isCompletedForMe: updated.isCompleted,
            completedAt: updated.completedAt,
            completedCount: updated.isCompleted ? 1 : 0,
            totalAssignedCount: 1,
          },
        });
      }
    }

    let targetAssignment = null;

    if (assignmentId && !String(assignmentId).startsWith('rec_')) {
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

    // Determine day of week if needed for recurring rule lookup
    let calcDayOfWeek = Number(dayOfWeek) || 1;
    if (date && date.includes('-')) {
      const [dYear, dMonth, dDay] = date.split('-').map(Number);
      const parsedDate = new Date(Date.UTC(dYear, (dMonth || 1) - 1, dDay || 1));
      calcDayOfWeek = parsedDate.getUTCDay() === 0 ? 7 : parsedDate.getUTCDay();
    }

    const [template, locationResidents, recurringRule] = await Promise.all([
      effectiveTemplateId
        ? prisma.choreTemplate.findUnique({ where: { id: effectiveTemplateId } })
        : null,
      prisma.user.findMany({
        where: { locationId: targetLocId, role: { in: ['BEWOHNER', 'HAUSHALTSKRAFT'] }, isActive: true },
        select: { id: true, name: true, username: true, avatarColor: true, avatarUrl: true, role: true },
      }),
      !targetAssignment && effectiveTemplateId
        ? prisma.choreRecurringAssignment.findFirst({
            where: {
              locationId: targetLocId,
              templateId: effectiveTemplateId,
              dayOfWeek: calcDayOfWeek,
              isActive: true,
            },
          })
        : null,
    ]);

    const effectiveAssignedRaw = (targetAssignment?.assignedResidentIds !== null && targetAssignment?.assignedResidentIds !== undefined)
      ? targetAssignment.assignedResidentIds
      : (recurringRule?.assignedResidentIds || template?.assignedResidentIds || null);

    const effectiveResidentId = targetAssignment?.residentId || recurringRule?.residentId || null;

    let resolved = resolveResidents(
      effectiveAssignedRaw,
      effectiveResidentId,
      locationResidents
    );

    if (resolved.residentIds.length === 0 && template?.assignedResidentIds) {
      resolved = resolveResidents(
        template.assignedResidentIds,
        effectiveResidentId,
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
      if (date && date.includes('-')) {
        const [dYear, dMonth, dDay] = date.split('-').map(Number);
        const parsedDate = new Date(Date.UTC(dYear, (dMonth || 1) - 1, dDay || 1));
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
    const todayDate = (req.query.date as string) || formatDate(now);
    const todayDayOfWeek = req.query.dayOfWeek ? Number(req.query.dayOfWeek) : (now.getDay() === 0 ? 7 : now.getDay());
    const { year: currentYear, week: currentWeek } = getISOWeekAndYear(now);

    const [templates, locationResidents, assignments, recurringAssignments, currentMealPlan] = await Promise.all([
      prisma.choreTemplate.findMany({
        where: { locationId, isActive: true },
        orderBy: [{ sortOrder: 'asc' }, { title: 'asc' }],
      }),
      prisma.user.findMany({
        where: {
          OR: [
            { locationId, role: { in: ['BEWOHNER', 'HAUSHALTSKRAFT'] }, isActive: true },
            ...(req.user?.id ? [{ id: req.user.id }] : []),
          ],
        },
        select: {
          id: true,
          name: true,
          username: true,
          avatarColor: true,
          avatarUrl: true,
          role: true,
        },
      }),
      prisma.choreAssignment.findMany({
        where: {
          locationId,
          OR: [
            { date: todayDate },
            { year: currentYear, weekNumber: currentWeek, dayOfWeek: todayDayOfWeek },
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
      prisma.choreRecurringAssignment.findMany({
        where: { locationId, dayOfWeek: todayDayOfWeek, isActive: true },
      }),
      prisma.mealPlan.findUnique({
        where: {
          locationId_year_weekNumber: {
            locationId,
            year: currentYear,
            weekNumber: currentWeek,
          },
        },
        include: {
          days: {
            where: { dayOfWeek: todayDayOfWeek },
            include: { recipe: true },
          },
        },
      }),
    ]);

    // Only include templates that are actually scheduled for today:
    // 1. Has an explicit assignment in DB for today
    // 2. Has an active recurring assignment rule for today
    // 3. Or template has non-empty default assigned resident IDs
    const scheduledTemplates = templates.filter((tmpl) => {
      const match = assignments.find((a) => a.templateId === tmpl.id);
      const recurring = recurringAssignments.find((r) => r.templateId === tmpl.id);
      const hasTemplateDefault = !!tmpl.assignedResidentIds && parseResidentIds(tmpl.assignedResidentIds).length > 0;
      return !!match || !!recurring || hasTemplateDefault;
    });

    // Map each scheduled template to today's assignment status
    const todayItems = scheduledTemplates.map((tmpl) => {
      const match = assignments.find((a) => a.templateId === tmpl.id);
      const recurring = recurringAssignments.find((r) => r.templateId === tmpl.id);

      let effectiveAssignedRaw = match?.assignedResidentIds;
      let effectiveResidentId = match?.residentId;

      if (!match || match.assignedResidentIds === null) {
        if (recurring) {
          effectiveAssignedRaw = recurring.assignedResidentIds;
          effectiveResidentId = recurring.residentId;
        } else if (tmpl.assignedResidentIds) {
          effectiveAssignedRaw = tmpl.assignedResidentIds;
        }
      }

      let resolved = resolveResidents(
        effectiveAssignedRaw,
        effectiveResidentId,
        locationResidents
      );

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
        residentId: effectiveResidentId || resolved.residentIds[0] || null,
        assignedResidents: resolved.assignedResidents,
        assignedResidentIdsList: resolved.residentIds,
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
        isRecurring: Boolean(recurring),
      };
    });

    // Check if there is an assigned cook for today
    const todayMealDay = currentMealPlan?.days?.[0];
    if (todayMealDay && todayMealDay.cookUserId) {
      let cookUser = locationResidents.find((u) => u.id === todayMealDay.cookUserId);
      if (!cookUser) {
        cookUser = (await prisma.user.findUnique({
          where: { id: todayMealDay.cookUserId },
          select: {
            id: true,
            name: true,
            username: true,
            avatarColor: true,
            avatarUrl: true,
            role: true,
          },
        })) as any;
      }

      if (cookUser) {
        const dishTitle = todayMealDay.recipe?.title || todayMealDay.customDishTitle || 'Gemeinschaftsessen';
        const isCookHousekeeping = cookUser.role === 'HAUSHALTSKRAFT';
        const isDone = Boolean(todayMealDay.isCompleted);
        const isCookMe = Boolean(req.user?.id && cookUser.id === req.user.id);

        const chefItem = {
          templateId: `chefkoch_${todayMealDay.id}`,
          title: isCookHousekeeping
            ? `Mittagessen zubereiten: ${dishTitle}`
            : `Kochtraining: ${dishTitle}`,
          description: isCookHousekeeping
            ? 'Zuständig für die Zubereitung des Mittagessens.'
            : 'Zuständig für die Zubereitung des Gemeinschaftsessens.',
          icon: '👨‍🍳',
          assignmentId: null,
          mealPlanDayId: todayMealDay.id,
          isChefkoch: true,
          cookRole: cookUser.role,
          resident: cookUser,
          residentId: cookUser.id,
          assignedResidents: [cookUser],
          assignedResidentIdsList: [cookUser.id],
          isAllResidents: false,
          completedResidentIds: isDone ? [cookUser.id] : [],
          completedResidents: isDone ? [cookUser] : [],
          pendingResidents: isDone ? [] : [cookUser],
          totalAssignedCount: 1,
          completedCount: isDone ? 1 : 0,
          isCompleted: isDone,
          isCompletedForMe: isCookMe ? isDone : false,
          completedAt: todayMealDay.completedAt,
          date: todayDate,
          isRecurring: false,
        };

        todayItems.unshift(chefItem);
      }
    }

    const currentUserId = req.user?.id;
    const currentUserRole = req.user?.role;
    const myTasks = currentUserId
      ? todayItems.filter((item) => {
          if (item.isAllResidents && currentUserRole !== 'HAUSHALTSKRAFT') return true;
          if (item.assignedResidentIdsList?.includes(currentUserId)) return true;
          if (item.assignedResidents.some((r: any) => r.id === currentUserId)) return true;
          return item.residentId === currentUserId;
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
