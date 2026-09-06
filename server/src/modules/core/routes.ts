import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import nodemailer from 'nodemailer';
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

/**
 * Checks whether initial setup is required (i.e. zero users exist in the system).
 */
router.get('/auth/setup-status', async (_req: Request, res: Response) => {
  try {
    const userCount = await prisma.user.count();
    return res.json({
      setupRequired: userCount === 0,
      userCount,
    });
  } catch (err) {
    console.error('Fehler bei setup-status:', err);
    return res.status(500).json({ error: 'Fehler beim Prüfen des Systemstatus.' });
  }
});

/**
 * Creates the initial administrator/betreuer account.
 * Only accessible if zero users currently exist in the database.
 */
router.post('/auth/setup', async (req: Request, res: Response) => {
  try {
    const userCount = await prisma.user.count();
    if (userCount > 0) {
      return res.status(403).json({
        error: 'Die Ersteinrichtung wurde bereits abgeschlossen. Bitte regulär einloggen.',
      });
    }

    const { username, name, email, password } = req.body;

    if (!username || !username.trim()) {
      return res.status(400).json({ error: 'Bitte einen Benutzernamen angeben.' });
    }
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Bitte den vollständigen Namen angeben.' });
    }
    if (!email || !email.trim() || !email.includes('@') || !email.includes('.')) {
      return res.status(400).json({ error: 'Bitte eine gültige Firmen-E-Mail-Adresse angeben.' });
    }
    if (!password || password.length < 6) {
      return res.status(400).json({ error: 'Das Passwort muss mindestens 6 Zeichen lang sein.' });
    }

    const normalizedUsername = username.toLowerCase().trim();
    const normalizedEmail = email.toLowerCase().trim();
    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        username: normalizedUsername,
        name: name.trim(),
        email: normalizedEmail,
        passwordHash,
        role: 'BETREUER', // Betreuer is always Admin
        avatarColor: '#0284c7',
      },
    });

    const token = generateToken(
      {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role as UserRole,
        locationId: user.locationId,
      },
      true
    );

    return res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        name: user.name,
        role: user.role,
        locationId: user.locationId,
        locationName: null,
        avatarColor: user.avatarColor,
      },
      message: 'Administrator-Konto erfolgreich eingerichtet!',
    });
  } catch (err: any) {
    console.error('Fehler bei Ersteinrichtung:', err);
    return res.status(500).json({ error: err.message || 'Fehler bei der Ersteinrichtung.' });
  }
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
        email: user.email,
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
        email: user.email,
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
        users: {
          select: {
            id: true,
            name: true,
            username: true,
            role: true,
            avatarColor: true,
            email: true,
          },
          orderBy: { name: 'asc' },
        },
      },
      orderBy: { name: 'asc' },
    });

    const formatted = locations.map((loc) => {
      const residents = loc.users.filter((u) => u.role === 'BEWOHNER');
      return {
        id: loc.id,
        name: loc.name,
        address: loc.address,
        defaultSupermarketId: loc.defaultSupermarketId,
        defaultSupermarketName: loc.defaultSupermarket?.name || null,
        defaultServings: loc.defaultServings,
        cookingDays: loc.cookingDays || '1,2,3,4,5,6,7',
        residentCount: residents.length,
        residents: residents.map((r) => ({
          id: r.id,
          name: r.name,
          username: r.username,
          avatarColor: r.avatarColor,
          email: r.email,
        })),
      };
    });

    return res.json(formatted);
  } catch (err) {
    console.error('Fehler beim Laden der Standorte:', err);
    return res.status(500).json({ error: 'Fehler beim Laden der Standorte.' });
  }
});

router.post('/locations', requireAuth, requireRole('ADMIN', 'BETREUER'), async (req: Request, res: Response) => {
  try {
    const { name, address, defaultSupermarketId, defaultServings, cookingDays } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Name des Standorts ist erforderlich.' });
    }

    const location = await prisma.location.create({
      data: {
        name,
        address,
        defaultSupermarketId,
        defaultServings: Number(defaultServings) || 6,
        cookingDays: cookingDays || '1,2,3,4,5,6,7',
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
    const { name, address, defaultSupermarketId, defaultServings, cookingDays } = req.body;

    const location = await prisma.location.update({
      where: { id },
      data: {
        name,
        address,
        defaultSupermarketId,
        defaultServings: defaultServings !== undefined ? (Number(defaultServings) || 6) : undefined,
        cookingDays: cookingDays !== undefined ? cookingDays : undefined,
      },
      include: { defaultSupermarket: true },
    });

    return res.json(location);
  } catch (err) {
    console.error('Fehler beim Aktualisieren des Standorts:', err);
    return res.status(500).json({ error: 'Fehler beim Aktualisieren des Standorts.' });
  }
});

router.delete('/locations/:id', requireAuth, requireRole('ADMIN', 'BETREUER'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userCount = await prisma.user.count({ where: { locationId: id } });
    if (userCount > 0) {
      return res.status(400).json({
        error: `Standort kann nicht gelöscht werden, da noch ${userCount} Benutzer/Bewohner zugewiesen sind.`,
      });
    }

    await prisma.location.delete({ where: { id } });
    return res.json({ success: true, message: 'Standort erfolgreich gelöscht.' });
  } catch (err) {
    console.error('Fehler beim Löschen des Standorts:', err);
    return res.status(500).json({ error: 'Fehler beim Löschen des Standorts.' });
  }
});

router.put('/locations/:id/residents', requireAuth, requireRole('ADMIN', 'BETREUER'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { residentIds } = req.body;

    if (!Array.isArray(residentIds)) {
      return res.status(400).json({ error: 'residentIds muss ein Array sein.' });
    }

    const location = await prisma.location.findUnique({ where: { id } });
    if (!location) {
      return res.status(404).json({ error: 'Standort nicht gefunden.' });
    }

    // 1. Unassign all BEWOHNER currently at this location who are not in residentIds
    await prisma.user.updateMany({
      where: {
        locationId: id,
        id: { notIn: residentIds },
        role: 'BEWOHNER',
      },
      data: {
        locationId: null,
      },
    });

    // 2. Assign selected residents to this location
    if (residentIds.length > 0) {
      await prisma.user.updateMany({
        where: {
          id: { in: residentIds },
          role: 'BEWOHNER',
        },
        data: {
          locationId: id,
        },
      });
    }

    // Return updated location with residents
    const updatedLocation = await prisma.location.findUnique({
      where: { id },
      include: {
        defaultSupermarket: true,
        users: {
          select: {
            id: true,
            name: true,
            username: true,
            role: true,
            avatarColor: true,
            email: true,
          },
          orderBy: { name: 'asc' },
        },
      },
    });

    const residents = updatedLocation?.users.filter((u) => u.role === 'BEWOHNER') || [];
    return res.json({
      id: updatedLocation!.id,
      name: updatedLocation!.name,
      address: updatedLocation!.address,
      defaultSupermarketId: updatedLocation!.defaultSupermarketId,
      defaultSupermarketName: updatedLocation!.defaultSupermarket?.name || null,
      defaultServings: updatedLocation!.defaultServings,
      cookingDays: updatedLocation!.cookingDays || '1,2,3,4,5,6,7',
      residentCount: residents.length,
      residents: residents.map((r) => ({
        id: r.id,
        name: r.name,
        username: r.username,
        avatarColor: r.avatarColor,
        email: r.email,
      })),
    });
  } catch (err: any) {
    console.error('Fehler beim Zuweisen der Bewohner:', err);
    return res.status(500).json({ error: 'Fehler beim Zuweisen der Bewohner.' });
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
        email: true,
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
      email: u.email,
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
    const { username, name, email, password, role, locationId, avatarColor } = req.body;

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
        name: name.trim(),
        email: email ? email.toLowerCase().trim() : null,
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
      email: newUser.email,
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

router.put('/users/:id', requireAuth, requireRole('ADMIN', 'BETREUER'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, email, role, locationId, avatarColor, isActive } = req.body;

    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Benutzer nicht gefunden.' });
    }

    const updated = await prisma.user.update({
      where: { id },
      data: {
        name: name !== undefined ? name.trim() : undefined,
        email: email !== undefined ? (email && email.trim() ? email.toLowerCase().trim() : null) : undefined,
        role: role !== undefined ? role : undefined,
        locationId: locationId !== undefined ? (locationId || null) : undefined,
        avatarColor: avatarColor !== undefined ? avatarColor : undefined,
        isActive: isActive !== undefined ? isActive : undefined,
      },
      include: { location: true },
    });

    return res.json({
      id: updated.id,
      username: updated.username,
      name: updated.name,
      email: updated.email,
      role: updated.role,
      locationId: updated.locationId,
      locationName: updated.location?.name || null,
      avatarColor: updated.avatarColor,
      isActive: updated.isActive,
    });
  } catch (err: any) {
    console.error('Fehler beim Bearbeiten des Benutzers:', err);
    return res.status(500).json({ error: 'Fehler beim Bearbeiten des Benutzers.' });
  }
});

router.delete('/users/:id', requireAuth, requireRole('ADMIN', 'BETREUER'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (id === req.user!.id) {
      return res.status(400).json({ error: 'Der eigene Benutzeraccount kann nicht gelöscht werden.' });
    }

    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Benutzer nicht gefunden.' });
    }

    await prisma.user.delete({ where: { id } });
    return res.json({ success: true, message: 'Benutzer erfolgreich gelöscht.' });
  } catch (err: any) {
    console.error('Fehler beim Löschen des Benutzers:', err);
    return res.status(500).json({ error: 'Fehler beim Löschen des Benutzers.' });
  }
});

// ==================== SMTP SERVER CONFIGURATION ====================

router.get('/admin/smtp', requireAuth, requireRole('ADMIN', 'BETREUER'), async (_req: Request, res: Response) => {
  try {
    const setting = await prisma.smtpSetting.findUnique({ where: { id: 'smtp-default' } });
    return res.json({
      host: setting?.host || '',
      port: setting?.port || 587,
      secure: setting?.secure || false,
      user: setting?.user || '',
      hasPassword: !!(setting?.password),
      fromEmail: setting?.fromEmail || '',
      fromName: setting?.fromName || 'Dein Weg Alltagsplaner',
      configured: !!(setting?.host && setting?.fromEmail),
    });
  } catch (err) {
    console.error('Fehler beim Laden der SMTP-Einstellungen:', err);
    return res.status(500).json({ error: 'Fehler beim Laden der SMTP-Einstellungen.' });
  }
});

router.post('/admin/smtp', requireAuth, requireRole('ADMIN', 'BETREUER'), async (req: Request, res: Response) => {
  try {
    const { host, port, secure, user, password, fromEmail, fromName } = req.body;

    const data: any = {
      host: host?.trim() || '',
      port: Number(port) || 587,
      secure: Boolean(secure),
      user: user?.trim() || '',
      fromEmail: fromEmail?.trim() || '',
      fromName: fromName?.trim() || 'Dein Weg Alltagsplaner',
    };

    if (password !== undefined && password !== '') {
      data.password = password;
    }

    const updated = await prisma.smtpSetting.upsert({
      where: { id: 'smtp-default' },
      update: data,
      create: {
        id: 'smtp-default',
        ...data,
        password: password || '',
      },
    });

    return res.json({
      success: true,
      message: 'SMTP-Einstellungen erfolgreich gespeichert.',
      setting: {
        host: updated.host,
        port: updated.port,
        secure: updated.secure,
        user: updated.user,
        hasPassword: !!updated.password,
        fromEmail: updated.fromEmail,
        fromName: updated.fromName,
      },
    });
  } catch (err) {
    console.error('Fehler beim Speichern der SMTP-Einstellungen:', err);
    return res.status(500).json({ error: 'Fehler beim Speichern der SMTP-Einstellungen.' });
  }
});

router.post('/admin/smtp/test', requireAuth, requireRole('ADMIN', 'BETREUER'), async (req: Request, res: Response) => {
  try {
    const { testRecipient, host, port, secure, user, password, fromEmail, fromName } = req.body;

    let smtpHost = host;
    let smtpPort = Number(port);
    let smtpSecure = Boolean(secure);
    let smtpUser = user;
    let smtpPass = password;
    let smtpFromEmail = fromEmail;
    let smtpFromName = fromName;

    if (!smtpHost) {
      const stored = await prisma.smtpSetting.findUnique({ where: { id: 'smtp-default' } });
      if (!stored || !stored.host) {
        return res.status(400).json({ error: 'Bitte zuerst die SMTP-Einstellungen eintragen.' });
      }
      smtpHost = stored.host;
      smtpPort = stored.port;
      smtpSecure = stored.secure;
      smtpUser = stored.user;
      smtpPass = stored.password;
      smtpFromEmail = stored.fromEmail;
      smtpFromName = stored.fromName;
    }

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpSecure,
      auth: smtpUser ? { user: smtpUser, pass: smtpPass } : undefined,
      connectionTimeout: 8000,
    });

    await transporter.verify();

    if (testRecipient && testRecipient.trim()) {
      await transporter.sendMail({
        from: `"${smtpFromName || 'Dein Weg Alltagsplaner'}" <${smtpFromEmail || smtpUser}>`,
        to: testRecipient.trim(),
        subject: '✅ Dein Weg Alltagsplaner: SMTP-Test erfolgreich!',
        text: `Hallo,\n\ndiese Test-E-Mail bestätigt, dass die SMTP-Konfiguration in Ihrem Dein Weg Alltagsplaner erfolgreich funktioniert.\n\nServer: ${smtpHost}:${smtpPort}\nAbsender: ${smtpFromEmail || smtpUser}\nZeitpunkt: ${new Date().toLocaleString('de-DE')}\n\nViele Grüße,\nDein Weg Alltagsplaner Team`,
        html: `<div style="font-family: sans-serif; padding: 20px; color: #1e293b; background-color: #f8fafc; border-radius: 12px;">
          <h2 style="color: #0284c7; margin-top: 0;">✅ Dein Weg Alltagsplaner</h2>
          <p>Diese Test-E-Mail bestätigt, dass die Verbindung zu Ihrem Mailserver erfolgreich hergestellt wurde!</p>
          <table style="border-collapse: collapse; margin-top: 15px; font-size: 13px;">
            <tr><td style="padding: 4px 8px; font-weight: bold; color: #64748b;">SMTP-Server:</td><td style="padding: 4px 8px;">${smtpHost}:${smtpPort}</td></tr>
            <tr><td style="padding: 4px 8px; font-weight: bold; color: #64748b;">Absender:</td><td style="padding: 4px 8px;">${smtpFromEmail || smtpUser}</td></tr>
            <tr><td style="padding: 4px 8px; font-weight: bold; color: #64748b;">Empfänger:</td><td style="padding: 4px 8px;">${testRecipient}</td></tr>
            <tr><td style="padding: 4px 8px; font-weight: bold; color: #64748b;">Datum:</td><td style="padding: 4px 8px;">${new Date().toLocaleString('de-DE')}</td></tr>
          </table>
          <p style="font-size: 12px; color: #94a3b8; margin-top: 25px;">Automatische Benachrichtigung von Dein Weg Alltagsplaner</p>
        </div>`,
      });
    }

    return res.json({
      success: true,
      message: testRecipient
        ? `SMTP-Verbindung erfolgreich verifiziert und Test-Mail an ${testRecipient} gesendet!`
        : 'SMTP-Verbindung zum Server erfolgreich verifiziert!',
    });
  } catch (err: any) {
    console.error('SMTP-Testfehler:', err);
    return res.status(400).json({
      error: `SMTP-Fehler: ${err.message || 'Verbindung zum Mailserver fehlgeschlagen.'}`,
    });
  }
});

export default router;
