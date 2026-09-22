---
name: project-memory
description: Recuperación instantánea del historial de conversaciones, decisiones técnicas, backlinks, analítica y tareas previas de PDFBlack.
---

# Project Memory Skill para PDFBlack ♠️

Esta skill permite a los agentes recuperar al instante el contexto, decisiones técnicas, registros y tareas realizadas en cualquiera de las más de 50 sesiones anteriores del proyecto PDFBlack.

## Recursos de Memoria Disponibles

1. **Regla de Contexto Permanente:**
   - Ubicación: `.agents/rules/project-history-and-memory.md`
   - Se inyecta automáticamente en la memoria del modelo al iniciar cualquier conversación. Contiene la bitácora de backlinks, infraestructura (Firebase, GA4, GSC) y los hitos más recientes.

2. **Índice Maestro Histórico Completo:**
   - Ubicación: `.agents/PROJECT_MEMORY_INDEX.md`
   - Contiene la tabla completa de todas las sesiones ordenadas por áreas temáticas (SEO, Conversión, Edición, Optimización, Infraestructura).

3. **Buscador Rápido de Historial (CLI):**
   - Ejecución: `node scripts/search-history.mjs "<termino_o_concepto>"`
   - Permite buscar en milisegundos a través de todos los reportes y bitácoras de conversaciones almacenadas en el disco local (`C:\Users\Nereo\.gemini\antigravity-ide\brain\`).

4. **Actualizador del Índice:**
   - Ejecución: `node scripts/build-project-memory-index.mjs`
   - Escanea las sesiones del sistema y sincroniza el índice maestro automáticamente.

## Cuándo usar esta Skill
- Cuando el usuario pregunte por trabajos realizados en días o semanas anteriores ("¿qué hicimos ayer?", "¿dónde registramos los backlinks?", "¿cómo implementamos el conversor a Word?").
- Antes de implementar cambios estructurales para no contradecir decisiones previas.
