require('dotenv').config();
const express     = require('express');
const path        = require('path');
const compression = require('compression');

/* googleapis is optional — calendar features disable gracefully if not installed */
let google = null;
try { ({ google } = require('googleapis')); } catch (_) {
  console.warn('googleapis not installed — Google Calendar integration disabled');
}

/* ── Google Calendar helpers ───────────────────── */
const CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID || 'primary';
const MADRID_TZ   = 'Europe/Madrid';
const ALL_SLOTS   = ['09:00','10:00','11:00','12:00','16:00','17:00','18:00'];

function getGoogleAuth() {
  if (!google) return null;
  const key = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (!key) return null;
  try {
    const creds = JSON.parse(key);
    return new google.auth.JWT({
      email:  creds.client_email,
      key:    creds.private_key,
      scopes: ['https://www.googleapis.com/auth/calendar'],
    });
  } catch { return null; }
}

/* Converts a Madrid-local datetime string to a UTC ISO string (handles DST). */
function madridToUTC(dateStr, timeStr) {
  const naive    = new Date(`${dateStr}T${timeStr}:00Z`);
  const svUTC    = naive.toLocaleString('sv-SE', { timeZone: 'UTC' });
  const svMadrid = naive.toLocaleString('sv-SE', { timeZone: MADRID_TZ });
  const diff     = new Date(svMadrid.replace(' ','T')+'Z') - new Date(svUTC.replace(' ','T')+'Z');
  return new Date(naive.getTime() - diff).toISOString();
}

const app = express();

/* Security & SEO: hide server identity */
app.disable('x-powered-by');

/* Gzip compression for all responses */
app.use(compression());

/* Redirect HTTP → HTTPS (works behind reverse proxies like Railway / Render / Vercel) */
app.use((req, res, next) => {
  if (req.headers['x-forwarded-proto'] === 'http') {
    return res.redirect(301, `https://${req.hostname}${req.url}`);
  }
  next();
});

/* Redirect www → non-www (canonical domain consolidation) */
app.use((req, res, next) => {
  if (req.hostname && req.hostname.startsWith('www.')) {
    const host = req.hostname.slice(4);
    return res.redirect(301, `https://${host}${req.url}`);
  }
  next();
});

app.use(express.json());
app.use(express.static(__dirname));

/* Redirect /website and /website/ to / */
app.get(['/website', '/website/'], (_req, res) => res.redirect(301, '/'));

/* ── GET /api/availability?date=YYYY-MM-DD ───────
   Returns which time slots are already taken in Google Calendar. */
app.get('/api/availability', async (req, res) => {
  const { date } = req.query;
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({ error: 'Fecha inválida' });
  }

  const auth = getGoogleAuth();
  if (!auth) return res.json({ busySlots: [] });

  try {
    const calendar = google.calendar({ version: 'v3', auth }); // google is non-null here (getGoogleAuth returned non-null)
    const timeMin  = madridToUTC(date, '00:00');
    const timeMax  = madridToUTC(date, '23:59');

    const { data } = await calendar.freebusy.query({
      requestBody: {
        timeMin,
        timeMax,
        timeZone: MADRID_TZ,
        items: [{ id: CALENDAR_ID }],
      },
    });

    const busy = data.calendars[CALENDAR_ID]?.busy || [];

    const busySlots = ALL_SLOTS.filter(slot => {
      const slotStart = new Date(madridToUTC(date, slot));
      const slotEnd   = new Date(slotStart.getTime() + 60 * 60 * 1000);
      return busy.some(b => {
        const bs = new Date(b.start);
        const be = new Date(b.end);
        return slotStart < be && slotEnd > bs;
      });
    });

    res.json({ busySlots });
  } catch (err) {
    console.error('Google Calendar freebusy error:', err.message);
    res.json({ busySlots: [] });
  }
});

/* ── POST /api/booking ──────────────────────────── */
app.post('/api/booking', async (req, res) => {
  const { nombre, email, fecha, dateISO, hora, concepto, info } = req.body;

  if (!nombre || !email || !fecha || !hora || !concepto) {
    return res.status(400).json({ error: 'Campos requeridos faltantes' });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'RESEND_API_KEY no configurada' });
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM_EMAIL || 'Skyaweb <onboarding@resend.dev>',
        to: [process.env.RESEND_TO_EMAIL || 'contacto@skyaweb.com'],
        reply_to: email,
        subject: `Nueva reserva: ${concepto} — ${nombre} (${fecha} ${hora})`,
        html: `
          <h2 style="font-family:sans-serif;color:#1a1a2e">Nueva solicitud de reunión</h2>
          <table style="border-collapse:collapse;width:100%;font-family:sans-serif;font-size:15px">
            <tr><td style="padding:10px 12px;font-weight:bold;background:#f0f0f0;width:140px">Nombre</td><td style="padding:10px 12px">${nombre}</td></tr>
            <tr><td style="padding:10px 12px;font-weight:bold">Email</td><td style="padding:10px 12px"><a href="mailto:${email}">${email}</a></td></tr>
            <tr><td style="padding:10px 12px;font-weight:bold;background:#f0f0f0">Fecha</td><td style="padding:10px 12px">${fecha}</td></tr>
            <tr><td style="padding:10px 12px;font-weight:bold">Hora</td><td style="padding:10px 12px">${hora}</td></tr>
            <tr><td style="padding:10px 12px;font-weight:bold;background:#f0f0f0">Concepto</td><td style="padding:10px 12px">${concepto}</td></tr>
            <tr><td style="padding:10px 12px;font-weight:bold">Más información</td><td style="padding:10px 12px">${info || '—'}</td></tr>
          </table>
          <p style="margin-top:24px;font-family:sans-serif;font-size:12px;color:#999">Enviado desde skyaweb.com</p>
        `,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('Resend API error:', err);
      return res.status(500).json({ error: 'Error al enviar el correo' });
    }

    /* Create Google Calendar event if credentials are available */
    if (dateISO && hora) {
      const auth = getGoogleAuth();
      if (auth) {
        try {
          const [hh, mm] = hora.split(':').map(Number);
          const endTime  = String(hh + 1).padStart(2, '0') + ':' + String(mm).padStart(2, '0');
          const calendar = google.calendar({ version: 'v3', auth });
          await calendar.events.insert({
            calendarId: CALENDAR_ID,
            requestBody: {
              summary:     `Reunión Skyaweb: ${concepto} — ${nombre}`,
              description: `Email: ${email}\nMás info: ${info || '—'}`,
              start: { dateTime: `${dateISO}T${hora}:00`,    timeZone: MADRID_TZ },
              end:   { dateTime: `${dateISO}T${endTime}:00`, timeZone: MADRID_TZ },
              attendees: [{ email }],
            },
          });
        } catch (calErr) {
          console.error('Google Calendar event error:', calErr.message);
          /* Non-fatal — email already sent */
        }
      }
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Fetch error:', err);
    res.status(500).json({ error: 'Error de red al enviar el correo' });
  }
});

app.post('/api/contact', async (req, res) => {
  const { nombre, empresa, email, telefono, interes, mensaje } = req.body;

  if (!nombre || !email || !interes) {
    return res.status(400).json({ error: 'Campos requeridos faltantes' });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'RESEND_API_KEY no configurada' });
  }

  const interesLabels = {
    'agente-ia':      'Agente de IA para captar clientes',
    'web-conversion': 'Web de alta conversión',
    'automatizacion': 'Automatización de marketing',
    'todo':           'Todo lo anterior',
    'otro':           'Duda específica',
  };

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM_EMAIL || 'Skyaweb <onboarding@resend.dev>',
        to: [process.env.RESEND_TO_EMAIL || 'contacto@skyaweb.com'],
        reply_to: email,
        subject: `Nuevo contacto: ${interesLabels[interes] || interes} — ${nombre}`,
        html: `
          <h2 style="font-family:sans-serif;color:#1a1a2e">Nuevo mensaje de contacto</h2>
          <table style="border-collapse:collapse;width:100%;font-family:sans-serif;font-size:15px">
            <tr><td style="padding:10px 12px;font-weight:bold;background:#f0f0f0;width:120px">Nombre</td><td style="padding:10px 12px">${nombre}</td></tr>
            <tr><td style="padding:10px 12px;font-weight:bold">Empresa</td><td style="padding:10px 12px">${empresa || '—'}</td></tr>
            <tr><td style="padding:10px 12px;font-weight:bold;background:#f0f0f0">Email</td><td style="padding:10px 12px"><a href="mailto:${email}">${email}</a></td></tr>
            <tr><td style="padding:10px 12px;font-weight:bold">Teléfono</td><td style="padding:10px 12px">${telefono || '—'}</td></tr>
            <tr><td style="padding:10px 12px;font-weight:bold;background:#f0f0f0">Interés</td><td style="padding:10px 12px">${interesLabels[interes] || interes}</td></tr>
            <tr><td style="padding:10px 12px;font-weight:bold">Mensaje</td><td style="padding:10px 12px">${mensaje || '—'}</td></tr>
          </table>
          <p style="margin-top:24px;font-family:sans-serif;font-size:12px;color:#999">Enviado desde skyaweb.com</p>
        `,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('Resend API error:', err);
      return res.status(500).json({ error: 'Error al enviar el correo' });
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Fetch error:', err);
    res.status(500).json({ error: 'Error de red al enviar el correo' });
  }
});

/* ── Clean URLs: /page serves page.html; /page.html redirects 301 to /page */
const pages = ['agentes-ia', 'webs-conversion', 'automatizacion', 'casos-exito'];
pages.forEach(page => {
  app.get(`/${page}.html`, (_req, res) => res.redirect(301, `/${page}`));
  app.get(`/${page}`, (_req, res) => res.sendFile(path.join(__dirname, `${page}.html`)));
});

/* ── New service & local pages ───────────────────── */
const extraPages = [
  { url: '/seo',                     file: 'seo.html' },
  { url: '/sobre-nosotros',          file: 'sobre-nosotros.html' },
  { url: '/zaragoza/agencia-seo',    file: 'zaragoza-agencia-seo.html' },
  { url: '/zaragoza/desarrollo-web', file: 'zaragoza-desarrollo-web.html' },
  { url: '/zaragoza/agencia-ia',     file: 'zaragoza-agencia-ia.html' },
  { url: '/valencia/agencia-seo',    file: 'valencia-agencia-seo.html' },
];
extraPages.forEach(({ url, file }) => {
  app.get(`${url}.html`, (_req, res) => res.redirect(301, url));
  app.get(url, (_req, res) => res.sendFile(path.join(__dirname, file)));
});

/* Fallback: serve index.html for unmatched GETs (client-side hash routing) */
app.get('*', (_req, res) => res.sendFile(path.join(__dirname, 'index.html')));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Skyaweb running on port ${PORT}`));
