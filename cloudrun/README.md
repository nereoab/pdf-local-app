# Despliegue de PDFBlack Converter en Google Cloud Run

Este microservicio ejecuta **LibreOffice 24 Headless + PyMuPDF + FastAPI** en un contenedor Docker en Google Cloud Run.

---

## Opción A: Despliegue con 1 Comando usando Google Cloud Shell (Recomendada)

1. Abre tu consola de Google Cloud: [https://console.cloud.google.com/](https://console.cloud.google.com/)
2. Abre la terminal **Cloud Shell** (ícono `>_` en la esquina superior derecha).
3. Sube la carpeta `cloudrun` o clona tu repositorio.
4. Ejecuta el comando de despliegue:

```bash
cd cloudrun

gcloud run deploy pdfblack-converter \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --memory 2Gi \
  --cpu 2 \
  --min-instances 0 \
  --max-instances 10
```

5. Al finalizar, Google Cloud te dará una URL pública segura, por ejemplo:
   `https://pdfblack-converter-abcdefg-uc.a.run.app`

6. Copia esa URL en tu archivo `.env.local` de Next.js:
   ```env
   CONVERTER_API_URL="https://pdfblack-converter-abcdefg-uc.a.run.app"
   ```

---

## Opción B: Despliegue desde la Web de Google Cloud Console

1. Entra a **Google Cloud Console** > **Cloud Run** > **Crear Servicio**.
2. Selecciona **"Implementar continuamente desde un repositorio"** o **"Implementar a partir del código fuente"** (`cloudrun/`).
3. En Configuración:
   - **Región:** `us-central1` (o la más cercana).
   - **Autenticación:** Permitir invocaciones no autenticadas.
   - **Memoria:** 2 GiB.
   - **CPU:** 2.
4. Haz clic en **Crear**.
