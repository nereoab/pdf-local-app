#!/usr/bin/env python3
"""
SEO Rank Booster & Striking Distance Engine ♠️
Detecta keywords en Primera Página (Top 1-10) y en "Distancia de Tiro" (Posiciones 11-25)
directamente desde Google Search Console API.
"""

import os
import sys
import json
import re
from datetime import datetime, timedelta
from google.oauth2 import service_account
from googleapiclient.discovery import build

CREDENTIALS_FILE = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "gsc-credentials.json")
SITE_URL = "sc-domain:pdf-black.com"

def get_service():
    if not os.path.exists(CREDENTIALS_FILE):
        print(f"❌ Error: Archivo de credenciales no encontrado en {CREDENTIALS_FILE}")
        sys.exit(1)
    creds = service_account.Credentials.from_service_account_file(
        CREDENTIALS_FILE,
        scopes=["https://www.googleapis.com/auth/webmasters.readonly"]
    )
    return build("searchconsole", "v1", credentials=creds, cache_discovery=False)

def main():
    print("♠️ Conectando con Google Search Console API...")
    service = get_service()

    end_date = (datetime.now() - timedelta(days=2)).strftime("%Y-%m-%d")
    start_date = (datetime.now() - timedelta(days=30)).strftime("%Y-%m-%d")

    body = {
        "startDate": start_date,
        "endDate": end_date,
        "dimensions": ["query", "page"],
        "rowLimit": 150,
        "searchType": "web"
    }

    response = service.searchanalytics().query(siteUrl=SITE_URL, body=body).execute()
    rows = response.get("rows", [])
    print(f"✅ Se analizaron {len(rows)} pares de consultas/URLs activas.\n")

    page1 = []
    striking_distance = []
    language_mismatches = []

    spanish_regex = re.compile(r"[áéíóúñ]|como|bajar|quitar|unir|comprimir|editar|convertir|archivo|peso|juzgado|gratis", re.IGNORECASE)

    for row in rows:
        query = row["keys"][0]
        page = row["keys"][1]
        pos = round(row["position"], 1)
        clicks = row["clicks"]
        impressions = row["impressions"]
        ctr = f"{row['ctr'] * 100:.1f}%"

        is_spanish_query = bool(spanish_regex.search(query))
        is_english_url = "/en/" in page

        if is_spanish_query and is_english_url:
            language_mismatches.append({"query": query, "page": page, "pos": pos, "impressions": impressions, "ctr": ctr})

        item = {"query": query, "page": page, "pos": pos, "clicks": clicks, "impressions": impressions, "ctr": ctr}
        if pos <= 10.0:
            page1.append(item)
        elif pos <= 25.0:
            striking_distance.append(item)

    print("==================================================================")
    print("  🎯 KEYWORDS EN PRIMERA PÁGINA (TOP 1-10 DE GOOGLE)")
    print("==================================================================")
    if not page1:
        print("No hay keywords en el Top 10 actualmente.")
    else:
        page1.sort(key=lambda x: x["impressions"], reverse=True)
        for idx, item in enumerate(page1[:12], 1):
            print(f"{idx}. [Pos: {item['pos']}] \"{item['query']}\"")
            print(f"   URL: {item['page']}")
            print(f"   Métricas: {item['impressions']} imp | {item['clicks']} clics | CTR: {item['ctr']}\n")

    print("==================================================================")
    print("  🚀 DISTANCIA DE TIRO: CANDIDATAS A ENTRAR A PÁGINA 1 (POS 11-25)")
    print("==================================================================")
    if not striking_distance:
        print("No hay keywords en el rango 11-25.")
    else:
        striking_distance.sort(key=lambda x: x["impressions"], reverse=True)
        for idx, item in enumerate(striking_distance[:12], 1):
            print(f"{idx}. [Pos: {item['pos']}] \"{item['query']}\"")
            print(f"   URL: {item['page']}")
            print(f"   Métricas: {item['impressions']} imp | {item['clicks']} clics | CTR: {item['ctr']}\n")

    if language_mismatches:
        print("==================================================================")
        print("  ⚠️  ALERTA CRÍTICA: CANIBALIZACIÓN IDIOMÁTICA DETECTADA")
        print("==================================================================")
        print("Google está mostrando páginas /en/ para búsquedas en español:\n")
        for item in language_mismatches[:6]:
            print(f"- Query: \"{item['query']}\" (Posición: {item['pos']})")
            print(f"  URL mostrada: {item['page']}")
            print("  Acción requerida: Forzar hreflang en sitemap y vincular la URL nativa en español.\n")

if __name__ == "__main__":
    main()
