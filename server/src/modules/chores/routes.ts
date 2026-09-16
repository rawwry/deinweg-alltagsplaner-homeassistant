import { Router, Request, Response } from 'express';
import { prisma } from '../../db.js';
import { requireAuth } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/rbac.js';

const router = Router();

// Helper to determine target location for a request
function resolveLocationId(req: Request): string {
  const queryLoc = (req.query.locationId as string) || (req.body.locationId as string);
  if (req.user?.role === 'BEWOHNER') {
    return req.user.locationId || 'location-emsdetten';
  }
  return queryLoc || req.user?.locationId || 'location-emsdetten';
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
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.map(String);
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
          year,
          weekNumber,
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

    // Enrich assignments with resolved residents (inheriting template default if assignment has none set)
    const enrichedAssignments = assignments.map((assign) => {
      let resolved = resolveResidents(
        assign.assignedResidentIds,
        assign.residentId,
        locationResidents
      );

      // If assignment has no explicit setting (assignedResidentIds === null) and no resident assigned, inherit template default
      if (assign.assignedResidentIds === null && !assign.residentId && assign.template?.assignedResidentIds) {
        resolved = resolveResidents(
          assign.template.assignedResidentIds,
          null,
          locationResidents
        );
      }

      return {
        ...assign,
        isAllResidents: resolved.isAllResidents,
        assignedResidents: resolved.assignedResidents,
        assignedResidentIdsList: resolved.residentIds,
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

// 7. Toggle completion status of an assignment (Staff Only)
router.post('/toggle-complete', requireAuth, requireRole('ADMIN', 'BETREUER'), async (req: Request, res: Response) => {
  try {
    const locationId = resolveLocationId(req);
    const { assignmentId, templateId, date, year, weekNumber, dayOfWeek } = req.body;

    let targetAssignment = null;

    if (assignmentId) {
      targetAssignment = await prisma.choreAssignment.findUnique({
        where: { id: assignmentId },
      });
    } else if (templateId && date) {
      targetAssignment = await prisma.choreAssignment.findUnique({
        where: {
          locationId_templateId_date: {
            locationId,
            templateId,
            date,
          },
        },
      });
    }

    if (!targetAssignment) {
      if (!templateId || !date) {
        return res.status(404).json({ error: 'Aufgabe nicht gefunden.' });
      }

      const assignment = await prisma.choreAssignment.create({
        data: {
          locationId,
          templateId,
          date,
          year: Number(year) || new Date().getFullYear(),
          weekNumber: Number(weekNumber) || 1,
          dayOfWeek: Number(dayOfWeek) || 1,
          residentId: req.user?.role === 'BEWOHNER' ? req.user.id : null,
          isCompleted: true,
          completedAt: new Date(),
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

      return res.json({ success: true, assignment });
    }

    // Toggle status
    const newIsCompleted = !targetAssignment.isCompleted;
    const updated = await prisma.choreAssignment.update({
      where: { id: targetAssignment.id },
      data: {
        isCompleted: newIsCompleted,
        completedAt: newIsCompleted ? new Date() : null,
        completedById: newIsCompleted ? req.user?.id : null,
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

    return res.json({ success: true, assignment: updated });
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

      // Inherit template's assignedResidentIds if assignment has no explicit setting
      if ((!match || (match.assignedResidentIds === null && !match.residentId)) && resolved.residentIds.length === 0 && tmpl.assignedResidentIds) {
        resolved = resolveResidents(tmpl.assignedResidentIds, null, locationResidents);
      }

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
        isCompleted: match ? match.isCompleted : false,
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
    const myCompletedCount = myTasks.filter((t) => t.isCompleted).length;

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
