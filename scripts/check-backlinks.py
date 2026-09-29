#!/usr/bin/env python3
"""
Backlink Health & Status Checker for PDFBlack
Verifica el estado HTTP y presencia del enlace hacia pdf-black.com en los registros externos.
"""

import urllib.request
import urllib.error
import re
import json

LINKS = [
    {
        "name": "GitHub (Repo)",
        "url": "https://github.com/nereoab/pdf-local-app",
        "da": 96,
        "type": "About / Repo"
    },
    {
        "name": "Product Hunt (Perfil)",
        "url": "https://www.producthunt.com/@nereo2710",
        "da": 91,
        "type": "Maker Profile"
    },
    {
        "name": "Hashnode (Blog/Perfil)",
        "url": "https://hashnode.com/@pdfblack",
        "da": 86,
        "type": "Engineering Bio"
    },
    {
        "name": "Devpost (Software)",
        "url": "https://devpost.com/software/pdfblack-free-client-side-pdf-tools-suite",
        "da": 82,
        "type": "Project Page"
    },
    {
        "name": "Devpost (Perfil)",
        "url": "https://devpost.com/markusarcangel",
        "da": 82,
        "type": "Maker Profile"
    },
    {
        "name": "Uneed.best (Tool)",
        "url": "https://www.uneed.best/tool/pdfblack",
        "da": 75,
        "type": "Directory Submission"
    },
    {
        "name": "AlternativeTo (Search/Slug)",
        "url": "https://alternativeto.net/software/pdfblack/",
        "da": 85,
        "type": "Directory Listing"
    }
]

headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
}

results = []

for item in LINKS:
    req = urllib.request.Request(item["url"], headers=headers)
    status_info = {
        "name": item["name"],
        "url": item["url"],
        "da": item["da"],
        "status_code": None,
        "has_target_link": False,
        "note": ""
    }
    try:
        with urllib.request.urlopen(req, timeout=12) as response:
            status_info["status_code"] = response.getcode()
            html = response.read().decode("utf-8", errors="ignore")
            # Verificar si contiene pdf-black.com
            if "pdf-black.com" in html:
                status_info["has_target_link"] = True
                status_info["note"] = "🟢 Activo y enlazando a pdf-black.com"
            else:
                status_info["note"] = "🟡 Página responde 200 pero no se detectó enlace directo en HTML estático"
    except urllib.error.HTTPError as e:
        status_info["status_code"] = e.code
        if e.code == 404:
            status_info["note"] = "🔴 404 No encontrado (Posible moderación pendiente o slug privado)"
        elif e.code == 403:
            status_info["note"] = "🛡️ 403 Bloqueado por Cloudflare/Anti-bot (requiere revisión manual)"
        else:
            status_info["note"] = f"⚠️ HTTP {e.code}"
    except Exception as e:
        status_info["note"] = f"❌ Error de conexión: {str(e)[:40]}"

    results.append(status_info)

print(json.dumps(results, indent=2, ensure_ascii=False))
