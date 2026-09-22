import { Router, Request, Response } from 'express';
import { prisma } from '../../db.js';
import { requireAuth } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/rbac.js';
import {
  sendResidentReplyEmail,
  sendResidentDirectNoteEmail,
  sendCaregiverNewNoteEmail,
  sendCaregiverNoteResolvedEmail,
} from '../../utils/mailer.js';

const router = Router();

// GET /api/notes/count-open - Fast counter for notification badges
router.get('/count-open', requireAuth, async (req: Request, res: Response) => {
  try {
    const isStaff = req.user!.role === 'ADMIN' || req.user!.role === 'BETREUER';
    const queryLoc = req.query.locationId as string | undefined;
    const locationId = isStaff ? queryLoc : req.user!.locationId;

    // Auto-archive expired notes before counting
    await prisma.caregiverNote.updateMany({
      where: {
        isArchived: false,
        expiresAt: { lt: new Date() },
      },
      data: {
        isArchived: true,
        status: 'DONE',
      },
    });

    const whereClause: any = {
      isArchived: false,
      status: { not: 'DONE' },
    };
    if (locationId) {
      whereClause.locationId = locationId;
    }

    if (isStaff) {
      whereClause.hiddenBy = {
        none: {
          userId: req.user!.id,
        },
      };
    } else {
      whereClause.OR = [
        { isPrivate: false },
        { residentId: req.user!.id },
        { authorId: req.user!.id },
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

    // Auto-archive expired notes
    await prisma.caregiverNote.updateMany({
      where: {
        isArchived: false,
        expiresAt: { lt: new Date() },
      },
      data: {
        isArchived: true,
        status: 'DONE',
      },
    });

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

    // Residents only see public notes, notes addressed to them, or notes written by them
    if (!isStaff) {
      whereClause.OR = [
        { isPrivate: false },
        { residentId: req.user!.id },
        { authorId: req.user!.id },
      ];
    }

    const notes = await prisma.caregiverNote.findMany({
      where: whereClause,
      include: {
        resident: { select: { id: true, name: true, username: true } },
        author: { select: { id: true, name: true, role: true, avatarColor: true, avatarUrl: true } },
        location: { select: { id: true, name: true } },
        messages: {
          include: {
            author: { select: { id: true, name: true, role: true, avatarColor: true, avatarUrl: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
        hiddenBy: isStaff
          ? {
              where: { userId: req.user!.id },
              select: { userId: true, hiddenAt: true },
            }
          : false,
      },
      orderBy: [
        { isPinned: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    // Resolve caregiver responder names
    const responderIds = notes.map((n) => n.respondedByUserId).filter(Boolean) as string[];
    const responders = responderIds.length > 0
      ? await prisma.user.findMany({ where: { id: { in: responderIds } }, select: { id: true, name: true } })
      : [];
    const responderMap = new Map(responders.map((r) => [r.id, r.name]));

    const formatted = notes.map((n: any) => {
      const isExpired = n.expiresAt ? n.expiresAt.getTime() <= Date.now() : false;
      const isDirectMessage = n.isPrivate && n.author && n.author.role !== 'BEWOHNER';

      let isHiddenForMe = Boolean(n.hiddenBy && n.hiddenBy.length > 0);
      let hiddenAt: string | null = null;
      if (isHiddenForMe && n.hiddenBy[0]) {
        hiddenAt = n.hiddenBy[0].hiddenAt.toISOString();
        // Check if any resident reply was posted AFTER the caregiver hid this note
        const hasNewResidentReply = (n.messages || []).some(
          (m: any) => m.author?.role === 'BEWOHNER' && new Date(m.createdAt) > n.hiddenBy[0].hiddenAt
        );
        if (hasNewResidentReply) {
          isHiddenForMe = false;
          // Asynchronously clear obsolete hidden record
          prisma.caregiverNoteHidden.deleteMany({
            where: { noteId: n.id, userId: req.user!.id },
          }).catch((err) => console.error('Fehler beim automatischen Einblenden:', err));
        }
      }

      return {
        id: n.id,
        locationId: n.locationId,
        locationName: n.location.name,
        authorId: n.authorId || (n.resident ? n.resident.id : null),
        authorName: n.author ? n.author.name : (n.resident ? n.resident.name : 'Unbekannt'),
        authorRole: n.author ? n.author.role : 'BEWOHNER',
        authorAvatarColor: n.author?.avatarColor || null,
        authorAvatarUrl: n.author?.avatarUrl || null,
        residentId: n.residentId,
        residentName: n.resident.name,
        title: n.title,
        content: n.content,
        category: n.category || 'ALLGEMEIN',
        isPinned: Boolean(n.isPinned),
        expiresAt: n.expiresAt?.toISOString() || null,
        isExpired,
        isDirectMessage,
        isHiddenForMe,
        hiddenAt,
        status: n.status,
        isArchived: n.isArchived,
        isPrivate: n.isPrivate,
        hasUnreadResponse: n.hasUnreadResponse,
        caregiverResponse: n.caregiverResponse,
        respondedAt: n.respondedAt?.toISOString() || null,
        respondedByName: n.respondedByUserId ? responderMap.get(n.respondedByUserId) || 'Betreuer' : null,
        resolvedAt: n.resolvedAt?.toISOString() || null,
        createdAt: n.createdAt.toISOString(),
        messages: n.messages?.map((m: any) => ({
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
      };
    });

    formatted.sort((a, b) => {
      const pA = a.category === 'ANKUENDIGUNG' ? 2 : a.isPinned ? 1 : 0;
      const pB = b.category === 'ANKUENDIGUNG' ? 2 : b.isPinned ? 1 : 0;
      if (pA !== pB) return pB - pA;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return res.json(formatted);
  } catch (err) {
    console.error('Fehler beim Laden der Notizen:', err);
    return res.status(500).json({ error: 'Fehler beim Laden der Notizen.' });
  }
});

router.post('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const { title, content, locationId, residentId, isPrivate, category, isPinned, expiresAt } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: 'Titel und Inhalt sind erforderlich.' });
    }

    const locId = locationId || req.user!.locationId;
    const isStaff = req.user!.role === 'ADMIN' || req.user!.role === 'BETREUER';

    if (req.user!.role === 'BEWOHNER' && locId !== req.user!.locationId) {
      return res.status(403).json({ error: 'Zugriff verweigert.' });
    }

    // Target resident:
    // If caregiver writes a private direct note to a resident: targetResidentId is the selected residentId
    // If resident writes a private ticket: target is the resident (residentId: req.user!.id)
    // If public note: residentId is req.user!.id
    const targetResidentId = (isStaff && isPrivate && residentId) ? residentId : req.user!.id;

    const validCategories = ['ALLGEMEIN', 'ANKUENDIGUNG', 'HINWEIS'];
    // Residents can ONLY write Mitteilungen ('ALLGEMEIN')
    const noteCategory = isStaff
      ? (validCategories.includes(category) ? category : (category === 'DRINGEND' ? 'ANKUENDIGUNG' : 'ALLGEMEIN'))
      : 'ALLGEMEIN';

    const note = await prisma.caregiverNote.create({
      data: {
        locationId: locId,
        authorId: req.user!.id,
        residentId: targetResidentId,
        title: title.trim(),
        content: content.trim(),
        category: noteCategory,
        isPinned: isStaff ? Boolean(isPinned) : false,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        isPrivate: Boolean(isPrivate),
        hasUnreadResponse: false,
        caregiverResponse: null, // DO NOT DUPLICATE NOTE CONTENT AS RESPONSE
        status: 'OPEN',
        isArchived: false,
      },
      include: {
        resident: { select: { id: true, name: true, email: true } },
        author: { select: { id: true, name: true, role: true, avatarColor: true, avatarUrl: true } },
        location: { select: { name: true } },
      },
    });

    // If private: notify caregivers if resident wrote; notify resident if caregiver wrote
    if (note.isPrivate) {
      if (req.user!.role === 'BEWOHNER') {
        sendCaregiverNewNoteEmail({
          locationId: note.locationId,
          locationName: note.location.name,
          authorName: note.author?.name || note.resident.name,
          noteTitle: note.title,
          noteContent: note.content,
          isPrivate: true,
        }).catch((err: any) => console.error('[Mailer] Fehler beim Senden an Betreuer:', err));
      } else {
        // Caregiver directly wrote to resident -> alert resident on dashboard & email
        // Set hasUnreadResponse: true so resident sees unread alert, but caregiverResponse remains null!
        await prisma.caregiverNote.update({
          where: { id: note.id },
          data: {
            hasUnreadResponse: true,
            respondedByUserId: req.user!.id,
            caregiverResponse: null, // NEVER DUPLICATE NOTE CONTENT
          },
        });

        if (note.resident?.email) {
          sendResidentDirectNoteEmail({
            residentEmail: note.resident.email,
            residentName: note.resident.name,
            noteTitle: note.title,
            authorName: req.user!.name,
            noteContent: note.content,
            locationName: note.location.name,
          }).catch((err: any) => console.error('[Mailer] Fehler beim Senden an Bewohner:', err));
        }
      }
    }

    return res.json({
      id: note.id,
      locationId: note.locationId,
      locationName: note.location.name,
      authorId: note.authorId,
      authorName: note.author?.name || req.user!.name,
      authorRole: note.author?.role || req.user!.role,
      authorAvatarColor: note.author?.avatarColor || null,
      authorAvatarUrl: note.author?.avatarUrl || null,
      residentId: note.residentId,
      residentName: note.resident.name,
      title: note.title,
      content: note.content,
      category: note.category,
      isPinned: note.isPinned,
      expiresAt: note.expiresAt?.toISOString() || null,
      isExpired: false,
      isDirectMessage: note.isPrivate && req.user!.role !== 'BEWOHNER',
      status: note.status,
      isArchived: note.isArchived,
      isPrivate: note.isPrivate,
      hasUnreadResponse: note.isPrivate && isStaff,
      caregiverResponse: null,
      respondedAt: null,
      respondedByName: null,
      resolvedAt: null,
      createdAt: note.createdAt.toISOString(),
      messages: [],
    });
  } catch (err) {
    console.error('Fehler beim Erstellen der Notiz:', err);
    return res.status(500).json({ error: 'Fehler beim Erstellen der Notiz.' });
  }
});

// PUT /api/notes/:id - Edit an authored note (staff only)
router.put('/:id', requireAuth, requireRole('ADMIN', 'BETREUER'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, content, category, isPinned, expiresAt, isPrivate, residentId } = req.body;

    const existing = await prisma.caregiverNote.findUnique({
      where: { id },
      include: {
        resident: { select: { id: true, name: true, email: true } },
        author: { select: { id: true, name: true, role: true, avatarColor: true, avatarUrl: true } },
        location: { select: { name: true } },
      },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Notiz nicht gefunden.' });
    }

    // Permission: Caregiver must be author or admin
    if (req.user!.role !== 'ADMIN' && existing.authorId !== req.user!.id) {
      return res.status(403).json({ error: 'Du kannst nur deine eigenen Beiträge bearbeiten.' });
    }

    const validCategories = ['ALLGEMEIN', 'ANKUENDIGUNG', 'HINWEIS'];
    const safeCategory = validCategories.includes(category) ? category : existing.category;

    const updated = await prisma.caregiverNote.update({
      where: { id },
      data: {
        title: title !== undefined ? title.trim() : existing.title,
        content: content !== undefined ? content.trim() : existing.content,
        category: safeCategory,
        isPinned: isPinned !== undefined ? Boolean(isPinned) : existing.isPinned,
        expiresAt: expiresAt !== undefined ? (expiresAt ? new Date(expiresAt) : null) : existing.expiresAt,
        isPrivate: isPrivate !== undefined ? Boolean(isPrivate) : existing.isPrivate,
        residentId: (isPrivate && residentId) ? residentId : existing.residentId,
      },
      include: {
        resident: { select: { id: true, name: true, email: true } },
        author: { select: { id: true, name: true, role: true, avatarColor: true, avatarUrl: true } },
        location: { select: { name: true } },
        messages: {
          include: {
            author: { select: { id: true, name: true, role: true, avatarColor: true, avatarUrl: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    const isDirect = updated.isPrivate && updated.author?.role !== 'BEWOHNER';

    return res.json({
      id: updated.id,
      locationId: updated.locationId,
      locationName: updated.location.name,
      authorId: updated.authorId,
      authorName: updated.author?.name || null,
      authorRole: updated.author?.role || null,
      authorAvatarColor: updated.author?.avatarColor || null,
      authorAvatarUrl: updated.author?.avatarUrl || null,
      residentId: updated.residentId,
      residentName: updated.resident.name,
      title: updated.title,
      content: updated.content,
      category: updated.category,
      isPinned: updated.isPinned,
      expiresAt: updated.expiresAt?.toISOString() || null,
      isExpired: updated.expiresAt ? new Date(updated.expiresAt).getTime() < Date.now() : false,
      isDirectMessage: isDirect,
      status: updated.status,
      isArchived: updated.isArchived,
      isPrivate: updated.isPrivate,
      hasUnreadResponse: updated.hasUnreadResponse,
      caregiverResponse: updated.caregiverResponse,
      respondedAt: updated.respondedAt?.toISOString() || null,
      respondedByName: null,
      resolvedAt: updated.resolvedAt?.toISOString() || null,
      createdAt: updated.createdAt.toISOString(),
      messages: (updated.messages || []).map((m: any) => ({
        id: m.id,
        noteId: m.noteId,
        authorId: m.authorId,
        authorName: m.author.name,
        authorRole: m.author.role,
        authorAvatarColor: m.author.avatarColor || null,
        authorAvatarUrl: m.author.avatarUrl || null,
        content: m.content,
        createdAt: m.createdAt.toISOString(),
      })),
    });
  } catch (err) {
    console.error('Fehler beim Bearbeiten der Notiz:', err);
    return res.status(500).json({ error: 'Fehler beim Bearbeiten der Notiz.' });
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
          hasUnreadResponse: true,
          respondedByUserId: req.user!.id,
          respondedAt: new Date(),
          status: note.status === 'DONE' ? 'OPEN' : note.status,
        },
      });

      // Automatically unhide note for all caregivers when a resident posts a new reply!
      await prisma.caregiverNoteHidden.deleteMany({
        where: { noteId: id },
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

// POST /api/notes/:id/hide - Hide note for the current staff user
router.post('/:id/hide', requireAuth, async (req: Request, res: Response) => {
  try {
    const isStaff = req.user!.role === 'ADMIN' || req.user!.role === 'BETREUER';
    if (!isStaff) {
      return res.status(403).json({ error: 'Nur Betreuer können Beiträge für sich ausblenden.' });
    }

    const { id } = req.params;
    const userId = req.user!.id;

    const note = await prisma.caregiverNote.findUnique({ where: { id } });
    if (!note) {
      return res.status(404).json({ error: 'Notiz nicht gefunden.' });
    }

    await prisma.caregiverNoteHidden.upsert({
      where: {
        noteId_userId: { noteId: id, userId },
      },
      create: {
        noteId: id,
        userId,
        hiddenAt: new Date(),
      },
      update: {
        hiddenAt: new Date(),
      },
    });

    return res.json({ success: true, hidden: true, noteId: id });
  } catch (err) {
    console.error('Fehler beim Ausblenden der Notiz:', err);
    return res.status(500).json({ error: 'Fehler beim Ausblenden der Notiz.' });
  }
});

// POST /api/notes/:id/unhide - Unhide note for the current staff user
router.post('/:id/unhide', requireAuth, async (req: Request, res: Response) => {
  try {
    const isStaff = req.user!.role === 'ADMIN' || req.user!.role === 'BETREUER';
    if (!isStaff) {
      return res.status(403).json({ error: 'Nur Betreuer können Beiträge einblenden.' });
    }

    const { id } = req.params;
    const userId = req.user!.id;

    await prisma.caregiverNoteHidden.deleteMany({
      where: {
        noteId: id,
        userId,
      },
    });

    return res.json({ success: true, hidden: false, noteId: id });
  } catch (err) {
    console.error('Fehler beim Wieder-Einblenden der Notiz:', err);
    return res.status(500).json({ error: 'Fehler beim Wieder-Einblenden der Notiz.' });
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

    if (req.user!.role === 'BEWOHNER' && note.residentId !== req.user!.id && note.authorId !== req.user!.id) {
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
    const note = await prisma.caregiverNote.findUnique({
      where: { id },
      include: {
        location: { select: { id: true, name: true } },
      },
    });
    if (!note) {
      return res.status(404).json({ error: 'Ticket nicht gefunden.' });
    }

    if (req.user!.role === 'BEWOHNER') {
      if (note.locationId !== req.user!.locationId) {
        return res.status(403).json({ error: 'Zugriff verweigert.' });
      }
      // Important: Residents cannot dismiss or resolve announcements
      if (note.category === 'ANKUENDIGUNG') {
        return res.status(403).json({ error: 'Ankündigungen können nur von Betreuern archiviert oder entfernt werden.' });
      }
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

    // When marked as resolved by a resident:
    // 1. Add audit system message in note thread
    // 2. Notify caregivers of the WG via email
    if (req.user!.role === 'BEWOHNER') {
      await prisma.caregiverNoteMessage.create({
        data: {
          noteId: id,
          authorId: req.user!.id,
          content: `✅ Hat dieses Thema als gelesen bzw. erledigt markiert.`,
        },
      });

      sendCaregiverNoteResolvedEmail({
        locationId: note.locationId,
        locationName: note.location.name,
        residentName: req.user!.name,
        noteTitle: note.title,
        category: note.category,
      }).catch((err) => console.error('[Mailer] Fehler beim Versenden der Betreuer-Erledigt-Benachrichtigung:', err));
    }

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

    if (req.user!.role === 'BEWOHNER') {
      if (note.category === 'ANKUENDIGUNG') {
        return res.status(403).json({ error: 'Ankündigungen können nur von Betreuern geändert werden.' });
      }
      if (note.locationId !== req.user!.locationId) {
        return res.status(403).json({ error: 'Zugriff verweigert.' });
      }
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

    if (req.user!.role === 'BEWOHNER') {
      if (note.category === 'ANKUENDIGUNG') {
        return res.status(403).json({ error: 'Ankündigungen können nur von Betreuern gelöscht werden.' });
      }
      if (note.locationId !== req.user!.locationId || note.authorId !== req.user!.id) {
        return res.status(403).json({ error: 'Zugriff verweigert.' });
      }
    }

    await prisma.caregiverNote.delete({ where: { id } });
    return res.json({ success: true });
  } catch (err) {
    console.error('Fehler beim Löschen der Notiz:', err);
    return res.status(500).json({ error: 'Fehler beim Löschen der Notiz.' });
  }
});

// PATCH /api/notes/:id/pin - Toggle pin status (caregiver/admin only)
router.patch('/:id/pin', requireAuth, requireRole('ADMIN', 'BETREUER'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const note = await prisma.caregiverNote.findUnique({ where: { id } });
    if (!note) {
      return res.status(404).json({ error: 'Notiz nicht gefunden.' });
    }

    const updated = await prisma.caregiverNote.update({
      where: { id },
      data: {
        isPinned: !note.isPinned,
      },
    });

    return res.json({ id: updated.id, isPinned: updated.isPinned });
  } catch (err) {
    console.error('Fehler beim Ändern des Pin-Status:', err);
    return res.status(500).json({ error: 'Fehler beim Ändern des Pin-Status.' });
  }
});

export default router;

