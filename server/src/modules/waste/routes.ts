import { Router, Request, Response } from 'express';
import { prisma } from '../../db.js';
import { requireAuth } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/rbac.js';
import { WasteType } from '../../../../shared/types.js';

const router = Router();

function mapSummaryToWasteType(summary: string): WasteType {
  const s = summary.toLowerCase();
  if (s.includes('bio') || s.includes('grün') || s.includes('braun')) {
    return 'BIO';
  }
  if (s.includes('papier') || s.includes('blau') || s.includes('pappe')) {
    return 'PAPER';
  }
  if (s.includes('gelb') || s.includes('wertstoff') || s.includes('verpackung')) {
    return 'YELLOW';
  }
  return 'REST';
}

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

    const pickups = await prisma.wastePickup.findMany({
      where: whereClause,
      orderBy: { date: 'asc' },
    });

    const formatted = pickups.map((p) => ({
      id: p.id,
      locationId: p.locationId,
      date: p.date,
      wasteType: p.wasteType as WasteType,
      notes: p.notes,
    }));

    return res.json(formatted);
  } catch (err) {
    console.error('Fehler beim Laden des Abfallkalenders:', err);
    return res.status(500).json({ error: 'Fehler beim Laden des Abfallkalenders.' });
  }
});

router.post('/', requireAuth, requireRole('ADMIN', 'BETREUER'), async (req: Request, res: Response) => {
  try {
    const { locationId, date, wasteType, notes } = req.body;

    if (!locationId || !date || !wasteType) {
      return res.status(400).json({ error: 'locationId, date und wasteType sind erforderlich.' });
    }

    const pickup = await prisma.wastePickup.create({
      data: {
        locationId,
        date,
        wasteType,
        notes,
      },
    });

    return res.json(pickup);
  } catch (err) {
    console.error('Fehler beim Erstellen des Abholtermins:', err);
    return res.status(500).json({ error: 'Fehler beim Erstellen des Abholtermins.' });
  }
});

router.delete('/:id', requireAuth, requireRole('ADMIN', 'BETREUER'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.wastePickup.delete({ where: { id } });
    return res.json({ success: true });
  } catch (err) {
    console.error('Fehler beim Löschen des Termins:', err);
    return res.status(500).json({ error: 'Fehler beim Löschen des Termins.' });
  }
});

/**
 * ICS (iCalendar) Import endpoint
 * Parses text/calendar content and extracts collection dates.
 */
router.post('/import-ics', requireAuth, requireRole('ADMIN', 'BETREUER'), async (req: Request, res: Response) => {
  try {
    const { locationId, icsContent } = req.body;

    if (!locationId || !icsContent) {
      return res.status(400).json({ error: 'locationId und icsContent sind erforderlich.' });
    }

    const lines = icsContent.split(/\r\n|\n|\r/);
    const events: Array<{ date: string; summary: string }> = [];

    let inEvent = false;
    let currentDate = '';
    let currentSummary = '';

    for (const line of lines) {
      if (line.startsWith('BEGIN:VEVENT')) {
        inEvent = true;
        currentDate = '';
        currentSummary = '';
      } else if (line.startsWith('END:VEVENT')) {
        if (inEvent && currentDate && currentSummary) {
          events.push({ date: currentDate, summary: currentSummary });
        }
        inEvent = false;
      } else if (inEvent) {
        if (line.startsWith('DTSTART')) {
          // e.g. DTSTART;VALUE=DATE:20260910 or DTSTART:20260910T060000Z
          const val = line.split(':')[1];
          if (val && val.length >= 8) {
            const y = val.substring(0, 4);
            const m = val.substring(4, 6);
            const d = val.substring(6, 8);
            currentDate = `${y}-${m}-${d}`;
          }
        } else if (line.startsWith('SUMMARY:')) {
          currentSummary = line.substring(8).trim();
        }
      }
    }

    let count = 0;
    for (const ev of events) {
      const type = mapSummaryToWasteType(ev.summary);
      await prisma.wastePickup.create({
        data: {
          locationId,
          date: ev.date,
          wasteType: type,
          notes: ev.summary,
        },
      });
      count++;
    }

    return res.json({
      success: true,
      importedCount: count,
      message: `${count} Abfuhrtermine erfolgreich importiert.`,
    });
  } catch (err) {
    console.error('Fehler beim ICS-Import:', err);
    return res.status(500).json({ error: 'Fehler beim Parsen der ICS-Datei.' });
  }
});

export default router;
