FROM python:3.11-slim-bookworm

# Evitar prompts interactivos
ENV DEBIAN_FRONTEND=noninteractive

# Instalar LibreOffice Writer, Poppler, utilidades y fuentes universales
RUN apt-get update && apt-get install -y --no-install-recommends \
    libreoffice-writer \
    libreoffice-core \
    libreoffice-common \
    poppler-utils \
    fonts-dejavu \
    fonts-liberation \
    fonts-noto \
    fonts-freefont-ttf \
    curl \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Instalar dependencias Python
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar código del servicio
COPY main.py .

# Puerto para Google Cloud Run (inyección automática de PORT)
ENV PORT=8080
EXPOSE 8080

CMD ["python", "main.py"]
