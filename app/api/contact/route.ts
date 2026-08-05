import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { nombre, email, mensaje } = body;

    if (!nombre || !email || !mensaje) {
      return NextResponse.json({ error: 'Todos los campos son obligatorios' }, { status: 400 });
    }

    const resendApiKey = process.env.RESEND_API_KEY;
    const recipientEmail = process.env.CONTACT_EMAIL || 'contacto@pdf-black.com';

    if (resendApiKey) {
      // Envío real con la API de Resend
      const resendResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${resendApiKey}`,
        },
        body: JSON.stringify({
          from: 'PDFBlack Contacto <contacto@pdf-black.com>',
          to: [recipientEmail],
          reply_to: email,
          subject: `💬 Nuevo mensaje de contacto de ${nombre}`,
          html: `
            <div style="font-family: sans-serif; background-color: #09090b; color: #ffffff; padding: 24px; border-radius: 12px;">
              <h2 style="color: #ffffff; border-bottom: 1px solid #333; padding-bottom: 12px;">Nuevo Mensaje de Contacto - PDFBlack</h2>
              <p><strong>Nombre:</strong> ${nombre}</p>
              <p><strong>Email del Remitente:</strong> ${email}</p>
              <div style="background-color: #18181b; padding: 16px; border-radius: 8px; border: 1px solid #27272a; margin-top: 16px;">
                <p style="margin: 0; white-space: pre-wrap; color: #e4e4e7;">${mensaje}</p>
              </div>
              <p style="font-size: 12px; color: #71717a; margin-top: 24px;">Este correo fue enviado automáticamente desde la página de contacto de pdf-black.com</p>
            </div>
          `,
        }),
      });

      if (!resendResponse.ok) {
        const errorData = await resendResponse.json();
        console.error('Error de Resend API:', errorData);
        return NextResponse.json(
          { error: 'No se pudo enviar el correo en este momento.' },
          { status: 500 },
        );
      }

      return NextResponse.json({ success: true, message: 'Mensaje enviado correctamente' });
    }

    // Log para desarrollo mientras se ingresa la API Key de Resend
    console.log('[API CONTACT] Nuevo mensaje recibido:', {
      nombre,
      email,
      mensaje,
      recipientEmail,
    });

    return NextResponse.json({
      success: true,
      message: 'Mensaje recibido correctamente. (Modo registro activado para pdf-black.com)',
    });
  } catch (error: unknown) {
    console.error('Error en /api/contact:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error interno del servidor';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
