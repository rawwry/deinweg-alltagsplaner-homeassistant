import { Router, Request, Response } from 'express';
import { prisma } from '../../db.js';
import { requireAuth } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/rbac.js';

const router = Router();

// GET /api/notes/count-open - Fast counter for notification badges
router.get('/count-open', requireAuth, async (req: Request, res: Response) => {
  try {
    const isStaff = req.user!.role === 'ADMIN' || req.user!.role === 'BETREUER';
    const queryLoc = req.query.locationId as string | undefined;
    const locationId = isStaff ? queryLoc : req.user!.locationId;

    const whereClause: any = {
      isArchived: false,
      status: { not: 'DONE' },
    };
    if (locationId) {
      whereClause.locationId = locationId;
    }

    const count = await prisma.caregiverNote.count({ where: whereClause });
    return res.json({ count });
  } catch (err) {
    console.error('Fehler beim Zählen offener Notizen:', err);
    return res.status(500).json({ error: 'Fehler beim Zählen der Notizen.' });
  }
});

router.get('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const isStaff = req.user!.role === 'ADMIN' || req.user!.role === 'BETREUER';
    const queryLoc = req.query.locationId as string | undefined;
    if (!isStaff && queryLoc && queryLoc !== req.user!.locationId) {
      return res.status(403).json({ error: 'Zugriff auf fremden Standort verweigert.' });
    }
    const locationId = isStaff ? queryLoc : req.user!.locationId;

    const archivedParam = req.query.archived as string | undefined;
    const whereClause: any = {};

    if (locationId) {
      whereClause.locationId = locationId;
    }

    if (archivedParam === 'true') {
      whereClause.isArchived = true;
    } else if (archivedParam !== 'all') {
      whereClause.isArchived = false;
    }

    const notes = await prisma.caregiverNote.findMany({
      where: whereClause,
      include: {
        resident: { select: { id: true, name: true, username: true } },
        location: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Resolve caregiver responder names
    const responderIds = notes.map((n) => n.respondedByUserId).filter(Boolean) as string[];
    const responders = responderIds.length > 0
      ? await prisma.user.findMany({ where: { id: { in: responderIds } }, select: { id: true, name: true } })
      : [];
    const responderMap = new Map(responders.map((r) => [r.id, r.name]));

    const formatted = notes.map((n) => ({
      id: n.id,
      locationId: n.locationId,
      locationName: n.location.name,
      residentId: n.residentId,
      residentName: n.resident.name,
      title: n.title,
      content: n.content,
      status: n.status,
      isArchived: n.isArchived,
      caregiverResponse: n.caregiverResponse,
      respondedAt: n.respondedAt?.toISOString() || null,
      respondedByName: n.respondedByUserId ? responderMap.get(n.respondedByUserId) || 'Betreuer' : null,
      resolvedAt: n.resolvedAt?.toISOString() || null,
      createdAt: n.createdAt.toISOString(),
    }));

    return res.json(formatted);
  } catch (err) {
    console.error('Fehler beim Laden der Notizen:', err);
    return res.status(500).json({ error: 'Fehler beim Laden der Notizen.' });
  }
});

router.post('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const { title, content, locationId, residentId } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: 'Titel und Inhalt sind erforderlich.' });
    }

    const locId = locationId || req.user!.locationId;
    const resId = residentId || req.user!.id;

    if (req.user!.role === 'BEWOHNER' && locId !== req.user!.locationId) {
      return res.status(403).json({ error: 'Zugriff verweigert.' });
    }

    const note = await prisma.caregiverNote.create({
      data: {
        locationId: locId,
        residentId: resId,
        title,
        content,
        status: 'OPEN',
        isArchived: false,
      },
      include: {
        resident: { select: { name: true } },
      },
    });

    return res.json({
      id: note.id,
      locationId: note.locationId,
      residentId: note.residentId,
      residentName: note.resident.name,
      title: note.title,
      content: note.content,
      status: note.status,
      isArchived: note.isArchived,
      caregiverResponse: null,
      respondedAt: null,
      respondedByName: null,
      resolvedAt: null,
      createdAt: note.createdAt.toISOString(),
    });
  } catch (err) {
    console.error('Fehler beim Erstellen der Notiz:', err);
    return res.status(500).json({ error: 'Fehler beim Erstellen der Notiz.' });
  }
});

// POST /api/notes/:id/respond - Caregiver writes a response to a resident's ticket
router.post('/:id/respond', requireAuth, requireRole('ADMIN', 'BETREUER'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { response: responseText } = req.body;

    if (!responseText || !responseText.trim()) {
      return res.status(400).json({ error: 'Antworttext ist erforderlich.' });
    }

    const note = await prisma.caregiverNote.findUnique({ where: { id } });
    if (!note) {
      return res.status(404).json({ error: 'Ticket nicht gefunden.' });
    }

    const updated = await prisma.caregiverNote.update({
      where: { id },
      data: {
        caregiverResponse: responseText.trim(),
        respondedAt: new Date(),
        respondedByUserId: req.user!.id,
        status: note.status === 'OPEN' ? 'IN_PROGRESS' : note.status,
      },
      include: {
        resident: { select: { name: true } },
        location: { select: { name: true } },
      },
    });

    return res.json({
      id: updated.id,
      locationId: updated.locationId,
      locationName: updated.location.name,
      residentId: updated.residentId,
      residentName: updated.resident.name,
      title: updated.title,
      content: updated.content,
      status: updated.status,
      isArchived: updated.isArchived,
      caregiverResponse: updated.caregiverResponse,
      respondedAt: updated.respondedAt?.toISOString() || null,
      respondedByName: req.user!.name,
      resolvedAt: updated.resolvedAt?.toISOString() || null,
      createdAt: updated.createdAt.toISOString(),
    });
  } catch (err) {
    console.error('Fehler beim Beantworten des Tickets:', err);
    return res.status(500).json({ error: 'Fehler beim Beantworten des Tickets.' });
  }
});

// PATCH /api/notes/:id/resolve - Mark ticket as resolved and archive it
router.patch('/:id/resolve', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const note = await prisma.caregiverNote.findUnique({ where: { id } });
    if (!note) {
      return res.status(404).json({ error: 'Ticket nicht gefunden.' });
    }

    if (req.user!.role === 'BEWOHNER' && note.locationId !== req.user!.locationId) {
      return res.status(403).json({ error: 'Zugriff verweigert.' });
    }

    const updated = await prisma.caregiverNote.update({
      where: { id },
      data: {
        status: 'DONE',
        isArchived: true,
        resolvedAt: new Date(),
        resolvedByUserId: req.user!.id,
      },
    });

    return res.json(updated);
  } catch (err) {
    console.error('Fehler beim Lösen des Tickets:', err);
    return res.status(500).json({ error: 'Fehler beim Lösen des Tickets.' });
  }
});

// PATCH /api/notes/:id/reopen - Reopen an archived ticket
router.patch('/:id/reopen', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const note = await prisma.caregiverNote.findUnique({ where: { id } });
    if (!note) {
      return res.status(404).json({ error: 'Ticket nicht gefunden.' });
    }

    if (req.user!.role === 'BEWOHNER' && note.locationId !== req.user!.locationId) {
      return res.status(403).json({ error: 'Zugriff verweigert.' });
    }

    const updated = await prisma.caregiverNote.update({
      where: { id },
      data: {
        status: 'OPEN',
        isArchived: false,
        resolvedAt: null,
        resolvedByUserId: null,
      },
    });

    return res.json(updated);
  } catch (err) {
    console.error('Fehler beim Wiedereröffnen des Tickets:', err);
    return res.status(500).json({ error: 'Fehler beim Wiedereröffnen des Tickets.' });
  }
});

router.patch('/:id/status', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['OPEN', 'IN_PROGRESS', 'DONE'].includes(status)) {
      return res.status(400).json({ error: 'Ungültiger Status.' });
    }

    const note = await prisma.caregiverNote.findUnique({ where: { id } });
    if (!note) {
      return res.status(404).json({ error: 'Notiz nicht gefunden.' });
    }

    if (req.user!.role === 'BEWOHNER' && note.locationId !== req.user!.locationId) {
      return res.status(403).json({ error: 'Zugriff verweigert.' });
    }

    const updated = await prisma.caregiverNote.update({
      where: { id },
      data: {
        status,
        isArchived: status === 'DONE',
        resolvedAt: status === 'DONE' ? new Date() : null,
      },
    });

    return res.json(updated);
  } catch (err) {
    console.error('Fehler beim Aktualisieren des Notiz-Status:', err);
    return res.status(500).json({ error: 'Fehler beim Aktualisieren des Status.' });
  }
});

router.delete('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const note = await prisma.caregiverNote.findUnique({ where: { id } });
    if (!note) {
      return res.status(404).json({ error: 'Notiz nicht gefunden.' });
    }

    if (req.user!.role === 'BEWOHNER' && (note.locationId !== req.user!.locationId || note.residentId !== req.user!.id)) {
      return res.status(403).json({ error: 'Zugriff verweigert.' });
    }

    await prisma.caregiverNote.delete({ where: { id } });
    return res.json({ success: true });
  } catch (err) {
    console.error('Fehler beim Löschen der Notiz:', err);
    return res.status(500).json({ error: 'Fehler beim Löschen der Notiz.' });
  }
});

export default router;

