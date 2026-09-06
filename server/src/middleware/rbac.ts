import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../../../shared/types.js';

export function requireRole(...allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Nicht authentifiziert' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Zugriff verweigert: Unzureichende Berechtigungen für diese Aktion.',
      });
    }

    next();
  };
}

/**
 * Ensures that residents only access data belonging to their assigned location.
 * Admins and Betreuer have cross-location access.
 */
export function enforceLocationAccess(
  getLocationIdFromReq: (req: Request) => string | undefined | null
) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Nicht authentifiziert' });
    }

    // Admins and Betreuers can access all locations
    if (req.user.role === 'ADMIN' || req.user.role === 'BETREUER') {
      return next();
    }

    // Resident check: Must match user's assigned locationId
    const targetLocationId = getLocationIdFromReq(req);
    if (!targetLocationId || targetLocationId !== req.user.locationId) {
      return res.status(403).json({
        error: 'Zugriff verweigert: Sie haben nur Zugriff auf Ihren eigenen Standort.',
      });
    }

    next();
  };
}
