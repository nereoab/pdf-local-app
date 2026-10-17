import { NextResponse } from 'next/server';
import { callGeminiApi } from '@/lib/gemini-converter-service';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const prompt =
      'Hola Gemini 4 Argon, responde en una oración presentándote e indicando tu versión de modelo.';
    const responseText = await callGeminiApi(prompt);

    return NextResponse.json({
      status: 'success',
      activeModel: 'gemini-4-argon',
      engine: 'Google Agent Platform (Enterprise)',
      billingAccount: 'pdfblack-proy (Consumiendo saldo de S/. 882.60 PEN)',
      aiResponse: responseText,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        status: 'error',
        message: error?.message || 'Error al conectar con Gemini',
      },
      { status: 500 },
    );
  }
}
