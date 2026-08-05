/**
 * API Route: Enviar emails via Resend
 *
 * POST /api/send-email
 * Body: { to, subject, text, html? }
 *
 * Usado por: sendConfirmationEmail (bienvenida), y cualquier otro email del sistema.
 * Requiere: RESEND_API_KEY en variables de entorno.
 */

import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { to, subject, text, html } = body;

    if (!to || !subject) {
      return NextResponse.json(
        { error: 'Los campos "to" y "subject" son obligatorios' },
        { status: 400 },
      );
    }

    const resendApiKey = process.env.RESEND_API_KEY;

    if (!resendApiKey) {
      console.log('[API SEND-EMAIL] RESEND_API_KEY no configurada. Email no enviado:', {
        to,
        subject,
      });
      return NextResponse.json({
        success: true,
        message: 'Email registrado (modo simulación — RESEND_API_KEY no configurada)',
        simulated: true,
      });
    }

    // ─── Envío real con Resend ───
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: 'PDFBlack <no-reply@pdf-black.com>',
        to: [to],
        subject,
        text: text || '',
        html: html || undefined,
      }),
    });

    if (!resendResponse.ok) {
      const errorData = await resendResponse.json().catch(() => ({}));
      console.error('[API SEND-EMAIL] Error de Resend:', errorData);
      return NextResponse.json(
        { error: 'No se pudo enviar el email. Intenta de nuevo más tarde.' },
        { status: 500 },
      );
    }

    const result = await resendResponse.json();
    console.log('[API SEND-EMAIL] Email enviado correctamente:', { to, subject, id: result.id });

    return NextResponse.json({
      success: true,
      message: 'Email enviado correctamente',
      id: result.id,
    });
  } catch (error: unknown) {
    console.error('[API SEND-EMAIL] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error interno del servidor';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
