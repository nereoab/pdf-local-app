/**
 * Health Check Endpoint
 * 
 * Utilizado por:
 * - Docker HEALTHCHECK (wget spider)
 * - Kubernetes liveness/readiness probes
 * - Load balancers (Vercel, AWS ALB, Nginx)
 * - Monitoreo externo (UptimeRobot, Pingdom, Datadog)
 * 
 * No requiere autenticación. Responde siempre 200 OK si la app está viva.
 */

import { NextResponse } from 'next/server';

export const runtime = 'nodejs';   // Cambiar a 'edge' si despliegas en Vercel Edge
export const dynamic = 'force-dynamic'; // No cachear esta ruta

export async function GET() {
  return NextResponse.json(
    {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: '2.0.0',
      service: 'PDFBlack',
    },
    {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, max-age=0, must-revalidate',
        'X-Health-Check': 'true',
      },
    }
  );
}