import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../../db.js';
import { requireAuth, generateToken } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/rbac.js';
import { APP_VERSION, APP_NAME } from '../../../../shared/version.js';
import { UserRole } from '../../../../shared/types.js';

const router = Router();

// ==================== AUTH & SYSTEM ====================

router.get('/system/info', (_req: Request, res: Response) => {
  res.json({
    name: APP_NAME,
    version: APP_VERSION,
    modules: [
      { id: 'foodplanner', name: 'Essens- & Einkaufsplaner', status: 'ACTIVE' },
      { id: 'notes', name: 'Bewohner-Notizen & Infos', status: 'ACTIVE' },
      { id: 'waste', name: 'Standort-Abfallkalender', status: 'ACTIVE' },
    ],
  });
});

router.post('/auth/login', async (req: Request, res: Response) => {
  try {
    const { username, password, rememberMe } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Bitte Benutzername und Passwort angeben.' });
    }

    const user = await prisma.user.findUnique({
      where: { username: username.toLowerCase().trim() },
      include: { location: true },
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Ungültiger Benutzername oder Passwort.' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Ungültiger Benutzername oder Passwort.' });
    }

    const token = generateToken(
      {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role as UserRole,
        locationId: user.locationId,
      },
      !!rememberMe
    );

    return res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
        locationId: user.locationId,
        locationName: user.location?.name || null,
        avatarColor: user.avatarColor,
      },
    });
  } catch (err) {
    console.error('Login-Fehler:', err);
    return res.status(500).json({ error: 'Interner Serverfehler beim Login.' });
  }
});

router.get('/auth/me', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      include: { location: { include: { defaultSupermarket: true } } },
    });

    if (!user) {
      return res.status(404).json({ error: 'Benutzer nicht gefunden.' });
    }

    return res.json({
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
        locationId: user.locationId,
        locationName: user.location?.name || null,
        location: user.location,
        avatarColor: user.avatarColor,
      },
    });
  } catch (err) {
    console.error('Fehler bei /auth/me:', err);
    return res.status(500).json({ error: 'Fehler beim Laden des Benutzerprofils.' });
  }
});

router.post('/auth/change-password', requireAuth, async (req: Request, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Bitte aktuelles und neues Passwort eingeben.' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Das neue Passwort muss mindestens 6 Zeichen lang sein.' });
    }

    const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
    if (!user) {
      return res.status(404).json({ error: 'Benutzer nicht gefunden.' });
    }

    const match = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!match) {
      return res.status(400).json({ error: 'Das aktuelle Passwort ist nicht korrekt.' });
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: newHash },
    });

    return res.json({ success: true, message: 'Passwort erfolgreich geändert.' });
  } catch (err) {
    console.error('Fehler bei change-password:', err);
    return res.status(500).json({ error: 'Fehler beim Ändern des Passworts.' });
  }
});

// ==================== STANDORTE (LOCATIONS) ====================

router.get('/locations', requireAuth, async (req: Request, res: Response) => {
  try {
    const isStaff = req.user!.role === 'ADMIN' || req.user!.role === 'BETREUER';

    const locations = await prisma.location.findMany({
      where: isStaff ? undefined : { id: req.user!.locationId || 'none' },
      include: {
        defaultSupermarket: true,
        _count: { select: { users: true } },
      },
      orderBy: { name: 'asc' },
    });

    const formatted = locations.map((loc) => ({
      id: loc.id,
      name: loc.name,
      address: loc.address,
      defaultSupermarketId: loc.defaultSupermarketId,
      defaultSupermarketName: loc.defaultSupermarket?.name || null,
      defaultServings: loc.defaultServings,
      residentCount: loc._count.users,
    }));

    return res.json(formatted);
  } catch (err) {
    console.error('Fehler beim Laden der Standorte:', err);
    return res.status(500).json({ error: 'Fehler beim Laden der Standorte.' });
  }
});

router.post('/locations', requireAuth, requireRole('ADMIN', 'BETREUER'), async (req: Request, res: Response) => {
  try {
    const { name, address, defaultSupermarketId, defaultServings } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Name des Standorts ist erforderlich.' });
    }

    const location = await prisma.location.create({
      data: {
        name,
        address,
        defaultSupermarketId,
        defaultServings: Number(defaultServings) || 6,
      },
    });

    return res.json(location);
  } catch (err) {
    console.error('Fehler beim Anlegen des Standorts:', err);
    return res.status(500).json({ error: 'Fehler beim Erstellen des Standorts.' });
  }
});

router.put('/locations/:id', requireAuth, requireRole('ADMIN', 'BETREUER'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, address, defaultSupermarketId, defaultServings } = req.body;

    const location = await prisma.location.update({
      where: { id },
      data: {
        name,
        address,
        defaultSupermarketId,
        defaultServings: Number(defaultServings) || 6,
      },
      include: { defaultSupermarket: true },
    });

    return res.json(location);
  } catch (err) {
    console.error('Fehler beim Aktualisieren des Standorts:', err);
    return res.status(500).json({ error: 'Fehler beim Aktualisieren des Standorts.' });
  }
});

// ==================== BENUTZERVERWALTUNG (USERS) ====================

router.get('/users', requireAuth, async (req: Request, res: Response) => {
  try {
    const isStaff = req.user!.role === 'ADMIN' || req.user!.role === 'BETREUER';
    const filterLocationId = req.query.locationId as string | undefined;

    const whereClause: any = {};
    if (!isStaff) {
      whereClause.locationId = req.user!.locationId;
      whereClause.isActive = true;
    } else if (filterLocationId) {
      whereClause.locationId = filterLocationId;
    }

    const users = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        locationId: true,
        avatarColor: true,
        isActive: true,
        location: { select: { name: true } },
      },
      orderBy: { name: 'asc' },
    });

    const formatted = users.map((u) => ({
      id: u.id,
      username: u.username,
      name: u.name,
      role: u.role,
      locationId: u.locationId,
      locationName: u.location?.name || null,
      avatarColor: u.avatarColor,
      isActive: u.isActive,
    }));

    return res.json(formatted);
  } catch (err) {
    console.error('Fehler beim Laden der Benutzer:', err);
    return res.status(500).json({ error: 'Fehler beim Laden der Benutzer.' });
  }
});

router.post('/users', requireAuth, requireRole('ADMIN', 'BETREUER'), async (req: Request, res: Response) => {
  try {
    const { username, name, password, role, locationId, avatarColor } = req.body;

    if (!username || !name || !password) {
      return res.status(400).json({ error: 'Benutzername, Name und Passwort sind erforderlich.' });
    }

    const normalizedUsername = username.toLowerCase().trim();
    const existing = await prisma.user.findUnique({ where: { username: normalizedUsername } });
    if (existing) {
      return res.status(400).json({ error: 'Dieser Benutzername ist bereits vergeben.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const newUser = await prisma.user.create({
      data: {
        username: normalizedUsername,
        name,
        passwordHash,
        role: role || 'BEWOHNER',
        locationId: locationId || null,
        avatarColor: avatarColor || '#3b82f6',
      },
      include: { location: true },
    });

    return res.json({
      id: newUser.id,
      username: newUser.username,
      name: newUser.name,
      role: newUser.role,
      locationId: newUser.locationId,
      locationName: newUser.location?.name || null,
      avatarColor: newUser.avatarColor,
    });
  } catch (err) {
    console.error('Fehler beim Anlegen des Benutzers:', err);
    return res.status(500).json({ error: 'Fehler beim Anlegen des Benutzers.' });
  }
});

router.put('/users/:id/reset-password', requireAuth, requireRole('ADMIN', 'BETREUER'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'Das Passwort muss mindestens 6 Zeichen lang sein.' });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id },
      data: { passwordHash },
    });

    return res.json({ success: true, message: 'Passwort erfolgreich zurückgesetzt.' });
  } catch (err) {
    console.error('Fehler beim Zurücksetzen des Passworts:', err);
    return res.status(500).json({ error: 'Fehler beim Zurücksetzen des Passworts.' });
  }
});

export default router;
