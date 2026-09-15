import nodemailer from 'nodemailer';
import { prisma } from '../db.js';

interface ResidentReplyNotificationParams {
  residentEmail: string;
  residentName: string;
  noteTitle: string;
  responderName: string;
  replyText: string;
  locationName: string;
}

interface CaregiverNotificationParams {
  locationId: string;
  locationName: string;
  authorName: string;
  noteTitle: string;
  noteContent: string;
  isPrivate?: boolean;
}

const DEFAULT_RESIDENT_SUBJECT = 'Neue Antwort im Flurfunk: {noteTitle}';
const DEFAULT_RESIDENT_BODY = `Hallo {residentName},

{responderName} hat auf deinen Flurfunk-Beitrag geantwortet:

"{replyText}"

Schau gerne im Alltagsplaner vorbei, um mehr zu erfahren.

Viele Grüße,
Dein WG-Team`;

const DEFAULT_CAREGIVER_SUBJECT = 'Neue Flurfunk-Nachricht an Betreuer ({locationName}): {noteTitle}';
const DEFAULT_CAREGIVER_BODY = `Hallo Betreuer-Team,

{authorName} hat eine neue Nachricht im Flurfunk ({locationName}) hinterlassen:

"{noteContent}"

Bitte prüfe die Nachricht im Alltagsplaner.

Viele Grüße,
Dein WG-System`;

function replacePlaceholders(template: string, replacements: Record<string, string>): string {
  let result = template;
  for (const [key, value] of Object.entries(replacements)) {
    result = result.split(`{${key}}`).join(value || '');
  }
  return result;
}

async function getTransporter() {
  const setting = await prisma.smtpSetting.findUnique({ where: { id: 'smtp-default' } });
  if (!setting || !setting.host) {
    return null;
  }

  const transporter = nodemailer.createTransport({
    host: setting.host,
    port: setting.port,
    secure: setting.secure,
    auth: setting.user ? { user: setting.user, pass: setting.password } : undefined,
    connectionTimeout: 8000,
  });

  return { transporter, setting };
}

export async function sendResidentReplyEmail(params: ResidentReplyNotificationParams): Promise<boolean> {
  if (!params.residentEmail || !params.residentEmail.trim()) {
    return false;
  }

  try {
    const smtp = await getTransporter();
    if (!smtp) {
      console.log('[Mailer] SMTP nicht konfiguriert - überspringe Bewohner-Benachrichtigung.');
      return false;
    }

    const { transporter, setting } = smtp;

    const replacements = {
      residentName: params.residentName,
      noteTitle: params.noteTitle,
      responderName: params.responderName,
      replyText: params.replyText,
      locationName: params.locationName,
    };

    const subjectTemplate = setting.residentReplyTemplateSubject || DEFAULT_RESIDENT_SUBJECT;
    const bodyTemplate = setting.residentReplyTemplateBody || DEFAULT_RESIDENT_BODY;

    const subject = replacePlaceholders(subjectTemplate, replacements);
    const body = replacePlaceholders(bodyTemplate, replacements);

    const fromAddress = `"${setting.fromName || 'Deine WG: Alltagsplaner'}" <${setting.fromEmail || setting.user}>`;

    await transporter.sendMail({
      from: fromAddress,
      to: params.residentEmail.trim(),
      subject,
      text: body,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 580px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden;">
          <div style="background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%); padding: 24px; color: #ffffff;">
            <span style="font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; background: rgba(255,255,255,0.2); padding: 4px 10px; border-radius: 9999px;">Flurfunk Antwort</span>
            <h2 style="margin: 12px 0 4px 0; font-size: 20px; font-weight: 700; color: #ffffff;">${escapeHtml(params.noteTitle)}</h2>
            <p style="margin: 0; font-size: 14px; opacity: 0.9;">WG: ${escapeHtml(params.locationName)}</p>
          </div>
          <div style="padding: 24px; color: #334155; line-height: 1.6; font-size: 15px;">
            <p style="margin-top: 0;">Hallo <strong>${escapeHtml(params.residentName)}</strong>,</p>
            <p><strong>${escapeHtml(params.responderName)}</strong> hat auf deine Nachricht geantwortet:</p>
            <div style="background: #f8fafc; border-left: 4px solid #0284c7; padding: 14px 16px; border-radius: 0 8px 8px 0; margin: 18px 0; font-style: italic; color: #1e293b;">
              ${escapeHtml(params.replyText).replace(/\n/g, '<br/>')}
            </div>
            <p style="margin-bottom: 0; font-size: 13px; color: #64748b;">Du kannst die vollständige Unterhaltung im Deine WG: Alltagsplaner einsehen.</p>
          </div>
          <div style="background: #f1f5f9; padding: 16px 24px; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; text-align: center;">
            Automatische Benachrichtigung von Deine WG: Alltagsplaner
          </div>
        </div>
      `,
    });

    console.log(`[Mailer] Antwort-Benachrichtigung erfolgreich gesendet an ${params.residentEmail}`);
    return true;
  } catch (err) {
    console.error('[Mailer] Fehler beim Versenden der Bewohner-Benachrichtigung:', err);
    return false;
  }
}

export async function sendCaregiverNewNoteEmail(params: CaregiverNotificationParams): Promise<boolean> {
  try {
    const smtp = await getTransporter();
    if (!smtp) {
      console.log('[Mailer] SMTP nicht konfiguriert - überspringe Betreuer-Benachrichtigung.');
      return false;
    }

    const { transporter, setting } = smtp;

    const caregivers = await prisma.user.findMany({
      where: {
        role: { in: ['BETREUER', 'ADMIN'] },
        isActive: true,
        email: { not: null },
        OR: [
          { locationId: params.locationId },
          { locationId: null },
        ],
      },
      select: {
        email: true,
        name: true,
      },
    });

    const recipientEmails = caregivers
      .map((u: { email: string | null; name: string }) => u.email?.trim())
      .filter((email: string | undefined): email is string => Boolean(email && email.includes('@')));

    if (recipientEmails.length === 0) {
      console.log('[Mailer] Keine Betreuer mit hinterlegter E-Mail-Adresse für Standort gefunden.');
      return false;
    }

    const replacements = {
      authorName: params.authorName,
      noteTitle: params.noteTitle,
      noteContent: params.noteContent,
      locationName: params.locationName,
    };

    const subjectTemplate = setting.caregiverNotificationTemplateSubject || DEFAULT_CAREGIVER_SUBJECT;
    const bodyTemplate = setting.caregiverNotificationTemplateBody || DEFAULT_CAREGIVER_BODY;

    const subject = replacePlaceholders(subjectTemplate, replacements);
    const body = replacePlaceholders(bodyTemplate, replacements);

    const fromAddress = `"${setting.fromName || 'Deine WG: Alltagsplaner'}" <${setting.fromEmail || setting.user}>`;

    await transporter.sendMail({
      from: fromAddress,
      to: recipientEmails.join(', '),
      subject,
      text: body,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 580px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden;">
          <div style="background: linear-gradient(135deg, #4f46e5 0%, #4338ca 100%); padding: 24px; color: #ffffff;">
            <span style="font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; background: rgba(255,255,255,0.2); padding: 4px 10px; border-radius: 9999px;">${params.isPrivate ? '🔒 Private Betreuer-Notiz' : '📢 Neuer Flurfunk-Beitrag'}</span>
            <h2 style="margin: 12px 0 4px 0; font-size: 20px; font-weight: 700; color: #ffffff;">${escapeHtml(params.noteTitle)}</h2>
            <p style="margin: 0; font-size: 14px; opacity: 0.9;">Standort: ${escapeHtml(params.locationName)}</p>
          </div>
          <div style="padding: 24px; color: #334155; line-height: 1.6; font-size: 15px;">
            <p style="margin-top: 0;">Hallo Betreuer-Team,</p>
            <p><strong>${escapeHtml(params.authorName)}</strong> hat eine neue Nachricht hinterlassen:</p>
            <div style="background: #f8fafc; border-left: 4px solid #4f46e5; padding: 14px 16px; border-radius: 0 8px 8px 0; margin: 18px 0; color: #1e293b;">
              ${escapeHtml(params.noteContent).replace(/\n/g, '<br/>')}
            </div>
            <p style="margin-bottom: 0; font-size: 13px; color: #64748b;">Bitte öffne den Deine WG: Alltagsplaner, um auf diese Notiz zu antworten oder sie zu bearbeiten.</p>
          </div>
          <div style="background: #f1f5f9; padding: 16px 24px; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; text-align: center;">
            Automatische Benachrichtigung von Deine WG: Alltagsplaner
          </div>
        </div>
      `,
    });

    console.log(`[Mailer] Betreuer-Benachrichtigung erfolgreich gesendet an ${recipientEmails.length} Empfänger.`);
    return true;
  } catch (err) {
    console.error('[Mailer] Fehler beim Versenden der Betreuer-Benachrichtigung:', err);
    return false;
  }
}

function escapeHtml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
