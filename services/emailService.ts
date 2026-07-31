/**
 * Servicio de envío de correos electrónicos - PDFBLACK
 *
 * CAPA PREPARADA: Este servicio está listo para ser conectado a un servidor SMTP real
 * cuando se adquiera el dominio corporativo. Actualmente guarda los correos en localStorage
 * y permite visualizarlos en la página /admin/emails.
 *
 * Para activar el envío real:
 * 1. Configurar las variables de entorno en .env.local:
 *    SMTP_HOST=mail.tudominio.com
 *    SMTP_PORT=587
 *    SMTP_USER=no-reply@tudominio.com
 *    SMTP_PASS=tucontraseña
 *    SMTP_FROM_NAME=PDFBLACK
 *    SMTP_FROM_EMAIL=no-reply@tudominio.com
 *
 * 2. Descomentar el código de envío real en sendConfirmationEmail().
 */

export interface EmailData {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export interface EmailLogEntry {
  id: string;
  to: string;
  subject: string;
  text: string;
  status: 'pending' | 'sent' | 'failed';
  createdAt: string;
  sentAt?: string;
  error?: string;
}

/**
 * Construye el HTML del correo de confirmación
 */
export function buildConfirmationEmailHtml(
  email: string,
  password: string,
  isEs: boolean
): string {
  const title = isEs
    ? '¡Bienvenido a PDFBLACK!'
    : 'Welcome to PDFBLACK!';
  const subtitle = isEs
    ? 'Tu cuenta ha sido creada exitosamente'
    : 'Your account has been created successfully';
  const emailLabel = isEs ? 'Correo electrónico' : 'Email';
  const passwordLabel = isEs ? 'Contraseña' : 'Password';
  const footerText = isEs
    ? 'Todas las herramientas son 100% gratuitas y se procesan localmente en tu navegador. No se requiere verificación adicional para usar las herramientas.'
    : 'All tools are 100% free and processed locally in your browser. No additional verification is needed to use the tools.';
  const ctaText = isEs ? 'Ir a PDFBLACK' : 'Go to PDFBLACK';
  const teamText = isEs ? 'El equipo de PDFBLACK' : 'The PDFBLACK Team';

  return `
<!DOCTYPE html>
<html lang="${isEs ? 'es' : 'en'}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background-color:#09090b;font-family:'Segoe UI',system-ui,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#09090b;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background-color:#18181b;border:1px solid rgba(255,255,255,0.1);border-radius:16px;overflow:hidden;">

          <!-- Header -->
          <tr>
            <td style="padding:32px 32px 24px;text-align:center;">
              <div style="display:inline-block;background-color:#ffffff;border-radius:12px;padding:16px;margin-bottom:16px;">
                <span style="font-size:24px;">♠️</span>
              </div>
              <h1 style="color:#ffffff;font-size:22px;font-weight:700;margin:0 0 6px;">${title}</h1>
              <p style="color:#a1a1aa;font-size:14px;margin:0;">${subtitle}</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:0 32px 32px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#09090b;border:1px solid rgba(255,255,255,0.1);border-radius:12px;">
                <tr>
                  <td style="padding:20px;">
                    <p style="color:#ffffff;font-size:15px;font-weight:600;margin:0 0 16px;">
                      ${isEs ? 'Tus datos de acceso:' : 'Your login details:'}
                    </p>

                    <!-- Email row -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:12px;">
                      <tr>
                        <td style="padding:10px 14px;background-color:#27272a;border-radius:8px;">
                          <span style="color:#a1a1aa;font-size:11px;text-transform:uppercase;letter-spacing:1px;display:block;margin-bottom:4px;">${emailLabel}</span>
                          <span style="color:#ffffff;font-size:15px;font-family:monospace;word-break:break-all;">${email}</span>
                        </td>
                      </tr>
                    </table>

                    <!-- Password row -->
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding:10px 14px;background-color:#27272a;border-radius:8px;">
                          <span style="color:#a1a1aa;font-size:11px;text-transform:uppercase;letter-spacing:1px;display:block;margin-bottom:4px;">${passwordLabel}</span>
                          <code style="color:#34d399;font-size:16px;font-family:monospace;letter-spacing:1px;">${password}</code>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- CTA -->
              <div style="text-align:center;margin-top:20px;">
                <a href="https://pdfblack.com" target="_blank" rel="noopener"
                   style="display:inline-block;background-color:#ffffff;color:#000000;padding:12px 28px;border-radius:999px;font-size:14px;font-weight:600;text-decoration:none;">
                  ${ctaText}
                </a>
                <p style="color:#71717a;font-size:12px;margin-top:12px;">
                  ${footerText}
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="border-top:1px solid rgba(255,255,255,0.08);padding:20px 32px;text-align:center;">
              <p style="color:#52525b;font-size:11px;margin:0;">
                PDFBLACK ♠️ &mdash; ${teamText}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Guarda un registro en el log de emails (localStorage)
 */
function logEmail(entry: EmailLogEntry): void {
  if (typeof window === 'undefined') return;
  try {
    const existing = localStorage.getItem('pdfblack-email-log');
    const log: EmailLogEntry[] = existing ? JSON.parse(existing) : [];
    log.unshift(entry);
    // Mantener solo últimos 100 registros
    if (log.length > 100) log.length = 100;
    localStorage.setItem('pdfblack-email-log', JSON.stringify(log));
  } catch {
    // ignorar
  }
}

/**
 * Obtiene el log completo de emails
 */
export function getEmailLog(): EmailLogEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem('pdfblack-email-log');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Limpia el log de emails
 */
export function clearEmailLog(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('pdfblack-email-log');
}

/**
 * Envía el correo de confirmación al usuario.
 * Actualmente guarda en localStorage; cuando se configure SMTP, se enviará realmente.
 */
export async function sendConfirmationEmail(
  email: string,
  password: string,
  isEs: boolean = true
): Promise<{ success: boolean; logId: string; error?: string }> {
  const subject = isEs
    ? 'Bienvenido a PDFBLACK - Tus datos de acceso'
    : 'Welcome to PDFBLACK - Your login details';

  const text = isEs
    ? `¡Bienvenido a PDFBLACK!\n\nTu cuenta ha sido creada exitosamente.\n\nTus datos de acceso:\n  Correo: ${email}\n  Contraseña: ${password}\n\nTodas las herramientas son 100% gratuitas y locales.\nVisita: https://pdfblack.com\n\nEl equipo de PDFBLACK`
    : `Welcome to PDFBLACK!\n\nYour account has been created successfully.\n\nYour login details:\n  Email: ${email}\n  Password: ${password}\n\nAll tools are 100% free and local.\nVisit: https://pdfblack.com\n\nThe PDFBLACK Team`;

  const html = buildConfirmationEmailHtml(email, password, isEs);

  const logEntry: EmailLogEntry = {
    id: crypto.randomUUID?.() || Math.random().toString(36).substring(2, 15),
    to: email,
    subject,
    text,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };

  // ─── ENVÍO REAL (Descomentar cuando se configure SMTP) ───
  /*
  try {
    // Puedes usar fetch() hacia un API endpoint propio o un servicio externo:
    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: email,
        subject,
        text,
        html,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    logEntry.status = 'sent';
    logEntry.sentAt = new Date().toISOString();
  } catch (error: unknown) {
    logEntry.status = 'failed';
    logEntry.error = (error instanceof Error) ? error.message : 'Error desconocido';
  }
  */

  // Por ahora, marcamos como pendiente (se mostrará en /admin/emails)
  logEntry.status = 'pending';

  logEmail(logEntry);

  return {
    success: true,
    logId: logEntry.id,
    ...(logEntry.error ? { error: logEntry.error } : {}),
  };
}

/**
 * Reenvía un email desde el log (prepara el reenvío)
 */
export async function resendEmail(logId: string): Promise<boolean> {
  const log = getEmailLog();
  const entry = log.find((e) => e.id === logId);
  if (!entry) return false;

  // Actualizar estado a pending para reenvío
  entry.status = 'pending';
  entry.sentAt = undefined;
  entry.error = undefined;

  // Guardar log actualizado
  if (typeof window !== 'undefined') {
    localStorage.setItem('pdfblack-email-log', JSON.stringify(log));
  }

  return true;
}