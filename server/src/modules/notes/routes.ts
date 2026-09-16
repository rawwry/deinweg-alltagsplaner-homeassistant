import { Router, Request, Response } from 'express';
import { prisma } from '../../db.js';
import { requireAuth } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/rbac.js';
import { sendResidentReplyEmail, sendCaregiverNewNoteEmail } from '../../utils/mailer.js';

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

    if (!isStaff) {
      whereClause.OR = [
        { isPrivate: false },
        { residentId: req.user!.id },
      ];
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

    // Residents only see public notes or their own private notes
    if (!isStaff) {
      whereClause.OR = [
        { isPrivate: false },
        { residentId: req.user!.id },
      ];
    }

    const notes = await prisma.caregiverNote.findMany({
      where: whereClause,
      include: {
        resident: { select: { id: true, name: true, username: true } },
        location: { select: { id: true, name: true } },
        messages: {
          include: {
            author: { select: { id: true, name: true, role: true, avatarColor: true, avatarUrl: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
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
      isPrivate: n.isPrivate,
      hasUnreadResponse: n.hasUnreadResponse,
      caregiverResponse: n.caregiverResponse,
      respondedAt: n.respondedAt?.toISOString() || null,
      respondedByName: n.respondedByUserId ? responderMap.get(n.respondedByUserId) || 'Betreuer' : null,
      resolvedAt: n.resolvedAt?.toISOString() || null,
      createdAt: n.createdAt.toISOString(),
      messages: n.messages?.map((m) => ({
        id: m.id,
        noteId: m.noteId,
        authorId: m.authorId,
        authorName: m.author.name,
        authorRole: m.author.role,
        authorAvatarColor: m.author.avatarColor,
        authorAvatarUrl: m.author.avatarUrl,
        content: m.content,
        createdAt: m.createdAt.toISOString(),
      })) || [],
    }));

    return res.json(formatted);
  } catch (err) {
    console.error('Fehler beim Laden der Notizen:', err);
    return res.status(500).json({ error: 'Fehler beim Laden der Notizen.' });
  }
});

router.post('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const { title, content, locationId, residentId, isPrivate } = req.body;

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
        isPrivate: Boolean(isPrivate),
        hasUnreadResponse: false,
        status: 'OPEN',
        isArchived: false,
      },
      include: {
        resident: { select: { id: true, name: true, email: true } },
        location: { select: { name: true } },
      },
    });

    // If private: notify caregivers if resident wrote; notify resident if caregiver wrote
    if (note.isPrivate) {
      if (req.user!.role === 'BEWOHNER') {
        sendCaregiverNewNoteEmail({
          locationId: note.locationId,
          locationName: note.location.name,
          authorName: note.resident.name,
          noteTitle: note.title,
          noteContent: note.content,
          isPrivate: true,
        }).catch((err: any) => console.error('[Mailer] Fehler beim Senden an Betreuer:', err));
      } else {
        // Caregiver directly wrote to resident -> alert resident on dashboard & email
        await prisma.caregiverNote.update({
          where: { id: note.id },
          data: {
            hasUnreadResponse: true,
            respondedByUserId: req.user!.id,
            caregiverResponse: note.content,
          },
        });
        if (note.resident?.email) {
          sendResidentReplyEmail({
            residentEmail: note.resident.email,
            residentName: note.resident.name,
            noteTitle: note.title,
            responderName: req.user!.name,
            replyText: note.content,
            locationName: note.location.name,
          }).catch((err: any) => console.error('[Mailer] Fehler beim Senden an Bewohner:', err));
        }
      }
    }

    return res.json({
      id: note.id,
      locationId: note.locationId,
      locationName: note.location.name,
      residentId: note.residentId,
      residentName: note.resident.name,
      title: note.title,
      content: note.content,
      status: note.status,
      isArchived: note.isArchived,
      isPrivate: note.isPrivate,
      hasUnreadResponse: note.hasUnreadResponse,
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
        hasUnreadResponse: true,
        status: note.status === 'OPEN' ? 'IN_PROGRESS' : note.status,
      },
      include: {
        resident: { select: { id: true, name: true, email: true } },
        location: { select: { name: true } },
      },
    });

    // Also persist into messages thread
    await prisma.caregiverNoteMessage.create({
      data: {
        noteId: id,
        authorId: req.user!.id,
        content: responseText.trim(),
      },
    });

    // Notify resident via email if email address is configured
    if (updated.resident?.email) {
      sendResidentReplyEmail({
        residentEmail: updated.resident.email,
        residentName: updated.resident.name,
        noteTitle: updated.title,
        responderName: req.user!.name,
        replyText: responseText.trim(),
        locationName: updated.location.name,
      }).catch((err) => console.error('[Mailer] Fehler beim Senden an Bewohner:', err));
    }

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
      isPrivate: updated.isPrivate,
      hasUnreadResponse: updated.hasUnreadResponse,
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

// POST /api/notes/:id/messages - Post a follow-up reply in a conversation thread (Resident or Caregiver)
router.post('/:id/messages', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Nachrichtentext ist erforderlich.' });
    }

    const note = await prisma.caregiverNote.findUnique({
      where: { id },
      include: {
        resident: { select: { id: true, name: true, email: true } },
        location: { select: { id: true, name: true } },
      },
    });

    if (!note) {
      return res.status(404).json({ error: 'Notiz nicht gefunden.' });
    }

    const isStaff = req.user!.role === 'ADMIN' || req.user!.role === 'BETREUER';
    if (!isStaff) {
      if (note.locationId !== req.user!.locationId) {
        return res.status(403).json({ error: 'Zugriff verweigert.' });
      }
      if (note.isPrivate && note.residentId !== req.user!.id) {
        return res.status(403).json({ error: 'Zugriff verweigert.' });
      }
    }

    const message = await prisma.caregiverNoteMessage.create({
      data: {
        noteId: id,
        authorId: req.user!.id,
        content: content.trim(),
      },
      include: {
        author: {
          select: { id: true, name: true, role: true, avatarColor: true, avatarUrl: true },
        },
      },
    });

    if (isStaff) {
      await prisma.caregiverNote.update({
        where: { id },
        data: {
          caregiverResponse: content.trim(),
          respondedAt: new Date(),
          respondedByUserId: req.user!.id,
          hasUnreadResponse: true,
          status: note.status === 'OPEN' ? 'IN_PROGRESS' : note.status,
        },
      });

      if (note.resident?.email && note.residentId !== req.user!.id) {
        sendResidentReplyEmail({
          residentEmail: note.resident.email,
          residentName: note.resident.name,
          noteTitle: note.title,
          responderName: req.user!.name,
          replyText: content.trim(),
          locationName: note.location.name,
        }).catch((err) => console.error('[Mailer] Fehler beim Senden an Bewohner:', err));
      }
    } else {
      await prisma.caregiverNote.update({
        where: { id },
        data: {
          hasUnreadResponse: false,
          status: note.status === 'DONE' ? 'OPEN' : note.status,
        },
      });

      if (note.isPrivate) {
        sendCaregiverNewNoteEmail({
          locationId: note.locationId,
          locationName: note.location.name,
          authorName: req.user!.name,
          noteTitle: `Neue Antwort zu: ${note.title}`,
          noteContent: content.trim(),
          isPrivate: true,
        }).catch((err) => console.error('[Mailer] Fehler beim Senden an Betreuer:', err));
      }
    }

    return res.json({
      id: message.id,
      noteId: message.noteId,
      authorId: message.authorId,
      authorName: message.author.name,
      authorRole: message.author.role,
      authorAvatarColor: message.author.avatarColor,
      authorAvatarUrl: message.author.avatarUrl,
      content: message.content,
      createdAt: message.createdAt.toISOString(),
    });
  } catch (err) {
    console.error('Fehler beim Senden der Antwort:', err);
    return res.status(500).json({ error: 'Fehler beim Senden der Antwort.' });
  }
});

// PATCH /api/notes/:id/read - Mark unread response as read
router.patch('/:id/read', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const note = await prisma.caregiverNote.findUnique({ where: { id } });
    if (!note) {
      return res.status(404).json({ error: 'Notiz nicht gefunden.' });
    }

    if (req.user!.role === 'BEWOHNER' && note.residentId !== req.user!.id) {
      return res.status(403).json({ error: 'Zugriff verweigert.' });
    }

    const updated = await prisma.caregiverNote.update({
      where: { id },
      data: {
        hasUnreadResponse: false,
      },
    });

    return res.json({ success: true, id: updated.id, hasUnreadResponse: updated.hasUnreadResponse });
  } catch (err) {
    console.error('Fehler beim Markieren als gelesen:', err);
    return res.status(500).json({ error: 'Fehler beim Markieren als gelesen.' });
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

