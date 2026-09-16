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
  },
  {
    title: 'Zimmerreinigung',
    description: 'Eigenes Zimmer lüften, aufräumen, Boden saugen und Mülleimer leeren.',
    icon: '🧹',
  },
  {
    title: 'Müll & Recycling',
    description: 'Mülleimer in Küche und Flur prüfen, Gelben Sack/Restmüll rausbringen.',
    icon: '🗑️',
  },
  {
    title: 'Gemeinschaftsräume',
    description: 'Wohnzimmer und Flur ordentlich halten, lüften und Tisch abwischen.',
    icon: '✨',
  },
  {
    title: 'Badezimmer',
    description: 'Waschbecken, Ablagen und Spiegel sauber halten, Handtücher wechseln.',
    icon: '🧼',
  },
];

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

// ==================== TEMPLATES CRUD ====================

// 1. List templates for location
router.get('/templates', requireAuth, async (req: Request, res: Response) => {
  try {
    const locationId = resolveLocationId(req);
    await ensureDefaultTemplates(locationId);

    const templates = await prisma.choreTemplate.findMany({
      where: { locationId, isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { title: 'asc' }],
    });

    return res.json(templates);
  } catch (err) {
    console.error('Fehler beim Laden der Aufgaben-Vorlagen:', err);
    return res.status(500).json({ error: 'Fehler beim Laden der Aufgaben-Vorlagen.' });
  }
});

// 2. Create template
router.post('/templates', requireAuth, requireRole('ADMIN', 'BETREUER'), async (req: Request, res: Response) => {
  try {
    const locationId = resolveLocationId(req);
    const { title, description, icon, sortOrder } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Titel der Aufgabe ist erforderlich.' });
    }

    const currentCount = await prisma.choreTemplate.count({ where: { locationId } });
    const template = await prisma.choreTemplate.create({
      data: {
        locationId,
        title: title.trim(),
        description: description?.trim() || null,
        icon: icon?.trim() || '🧹',
        sortOrder: typeof sortOrder === 'number' ? sortOrder : currentCount,
        isActive: true,
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
    const { title, description, icon, sortOrder, isActive } = req.body;

    const existing = await prisma.choreTemplate.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Aufgaben-Vorlage nicht gefunden.' });
    }

    const updated = await prisma.choreTemplate.update({
      where: { id },
      data: {
        title: title !== undefined ? title.trim() : undefined,
        description: description !== undefined ? description?.trim() || null : undefined,
        icon: icon !== undefined ? icon?.trim() || '🧹' : undefined,
        sortOrder: typeof sortOrder === 'number' ? sortOrder : undefined,
        isActive: typeof isActive === 'boolean' ? isActive : undefined,
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

    return res.json({ success: true, message: 'Aufgaben-Vorlage erfolgreich deaktiviert.' });
  } catch (err) {
    console.error('Fehler beim Löschen der Aufgaben-Vorlage:', err);
    return res.status(500).json({ error: 'Fehler beim Löschen der Aufgaben-Vorlage.' });
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

    // Active templates for location
    const templates = await prisma.choreTemplate.findMany({
      where: { locationId, isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { title: 'asc' }],
    });

    // Assignments for this week
    const assignments = await prisma.choreAssignment.findMany({
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
          },
        },
      },
    });

    return res.json({
      locationId,
      year,
      weekNumber,
      days,
      templates,
      assignments,
    });
  } catch (err) {
    console.error('Fehler beim Laden des Aufgabenplans:', err);
    return res.status(500).json({ error: 'Fehler beim Laden des Aufgabenplans.' });
  }
});

// 6. Assign resident to a task on a specific day
router.post('/assign', requireAuth, requireRole('ADMIN', 'BETREUER'), async (req: Request, res: Response) => {
  try {
    const locationId = resolveLocationId(req);
    const { templateId, date, year, weekNumber, dayOfWeek, residentId } = req.body;

    if (!templateId || !date || !year || !weekNumber || !dayOfWeek) {
      return res.status(400).json({ error: 'Unvollständige Zuweisungsdaten.' });
    }

    // If residentId is null or empty string, unassign
    if (!residentId) {
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
            data: { residentId: null },
            include: { resident: true, template: true },
          });
          return res.json({ success: true, assignment: updated });
        }
      }
      return res.json({ success: true, assignment: null });
    }

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
        residentId,
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
        residentId,
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

// 7. Toggle completion status of an assignment
router.post('/toggle-complete', requireAuth, async (req: Request, res: Response) => {
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

    const templates = await prisma.choreTemplate.findMany({
      where: { locationId, isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { title: 'asc' }],
    });

    const assignments = await prisma.choreAssignment.findMany({
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
          },
        },
      },
    });

    // Map each active template to today's assignment status
    const todayItems = templates.map((tmpl) => {
      const match = assignments.find((a) => a.templateId === tmpl.id);
      return {
        templateId: tmpl.id,
        title: tmpl.title,
        description: tmpl.description,
        icon: tmpl.icon,
        assignmentId: match ? match.id : null,
        resident: match?.resident || null,
        residentId: match?.residentId || null,
        isCompleted: match ? match.isCompleted : false,
        completedAt: match?.completedAt || null,
        date: todayDate,
      };
    });

    const myTasks = req.user
      ? todayItems.filter((item) => item.residentId === req.user?.id)
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
