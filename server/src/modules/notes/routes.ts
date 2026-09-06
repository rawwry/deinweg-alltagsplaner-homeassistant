import { Router, Request, Response } from 'express';
import { prisma } from '../../db.js';
import { requireAuth } from '../../middleware/auth.js';

const router = Router();

router.get('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const isStaff = req.user!.role === 'ADMIN' || req.user!.role === 'BETREUER';
    const queryLoc = req.query.locationId as string | undefined;
    if (!isStaff && queryLoc && queryLoc !== req.user!.locationId) {
      return res.status(403).json({ error: 'Zugriff auf fremden Standort verweigert.' });
    }
    const locationId = isStaff ? queryLoc : req.user!.locationId;

    const whereClause: any = {};
    if (locationId) {
      whereClause.locationId = locationId;
    }

    const notes = await prisma.caregiverNote.findMany({
      where: whereClause,
      include: {
        resident: { select: { id: true, name: true, username: true } },
        location: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const formatted = notes.map((n) => ({
      id: n.id,
      locationId: n.locationId,
      locationName: n.location.name,
      residentId: n.residentId,
      residentName: n.resident.name,
      title: n.title,
      content: n.content,
      status: n.status,
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
      createdAt: note.createdAt.toISOString(),
    });
  } catch (err) {
    console.error('Fehler beim Erstellen der Notiz:', err);
    return res.status(500).json({ error: 'Fehler beim Erstellen der Notiz.' });
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
      data: { status },
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
