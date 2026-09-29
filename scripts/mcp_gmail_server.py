#!/usr/bin/env python3
"""
Gmail IMAP MCP Server for Antigravity IDE ♠️
Permite al agente consultar la bandeja de entrada, buscar correos y leer su contenido
de forma segura mediante el protocolo IMAP con SSL de Google.

Requiere en .env.local o variables de entorno:
GMAIL_USER=tu_correo@gmail.com
GMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx (Contraseña de aplicación de 16 caracteres)
"""

import os
import sys
import json
import imaplib
import email
from email.header import decode_header
from typing import List, Optional
from mcp.server.fastmcp import FastMCP

# Inicializar servidor MCP
mcp = FastMCP("gmail-inbox")

IMAP_SERVER = "imap.gmail.com"
IMAP_PORT = 993

def get_env_credentials():
    # Intentar cargar desde .env.local si existe
    env_local_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env.local")
    creds = {}
    if os.path.exists(env_local_path):
        with open(env_local_path, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    k, v = line.split("=", 1)
                    creds[k.strip()] = v.strip().strip('"').strip("'")
    
    user = os.environ.get("GMAIL_USER") or creds.get("GMAIL_USER")
    password = os.environ.get("GMAIL_APP_PASSWORD") or creds.get("GMAIL_APP_PASSWORD")
    return user, password

def connect_imap():
    user, password = get_env_credentials()
    if not user or not password:
        raise ValueError(
            "Credenciales no configuradas. Agrega GMAIL_USER y GMAIL_APP_PASSWORD en tu archivo .env.local "
            "(Genera la contraseña en https://myaccount.google.com/apppasswords)."
        )
    mail = imaplib.IMAP4_SSL(IMAP_SERVER, IMAP_PORT)
    mail.login(user, password)
    return mail

def decode_mime_header(header_value):
    if not header_value:
        return ""
    decoded_fragments = decode_header(header_value)
    result = []
    for fragment, encoding in decoded_fragments:
        if isinstance(fragment, bytes):
            result.append(fragment.decode(encoding or "utf-8", errors="ignore"))
        else:
            result.append(str(fragment))
    return "".join(result)

def extract_body(msg):
    text_content = ""
    if msg.is_multipart():
        for part in msg.walk():
            content_type = part.get_content_type()
            content_disposition = str(part.get("Content-Disposition"))
            if content_type == "text/plain" and "attachment" not in content_disposition:
                payload = part.get_payload(decode=True)
                if payload:
                    text_content += payload.decode("utf-8", errors="ignore") + "\n"
            elif content_type == "text/html" and not text_content and "attachment" not in content_disposition:
                payload = part.get_payload(decode=True)
                if payload:
                    text_content += payload.decode("utf-8", errors="ignore") + "\n"
    else:
        payload = msg.get_payload(decode=True)
        if payload:
            text_content = payload.decode("utf-8", errors="ignore")
    return text_content.strip()

@mcp.tool()
def list_recent_emails(limit: int = 10, folder: str = "INBOX") -> str:
    """
    Lista los correos más recientes recibidos en la bandeja de entrada.
    
    Args:
        limit: Número de correos a listar (por defecto 10, máx 25).
        folder: Carpeta a consultar (por defecto 'INBOX').
    """
    try:
        mail = connect_imap()
        mail.select(folder)
        _, data = mail.search(None, "ALL")
        mail_ids = data[0].split()
        
        selected_ids = mail_ids[-min(limit, 25):]
        selected_ids.reverse() # Más recientes primero
        
        emails_list = []
        for mid in selected_ids:
            _, msg_data = mail.fetch(mid, "(RFC822.HEADER)")
            for response_part in msg_data:
                if isinstance(response_part, tuple):
                    msg = email.message_from_bytes(response_part[1])
                    emails_list.append({
                        "id": mid.decode("utf-8"),
                        "date": decode_mime_header(msg.get("Date")),
                        "from": decode_mime_header(msg.get("From")),
                        "subject": decode_mime_header(msg.get("Subject"))
                    })
        mail.logout()
        return json.dumps({"status": "success", "count": len(emails_list), "emails": emails_list}, indent=2, ensure_ascii=False)
    except Exception as e:
        return json.dumps({"status": "error", "error": str(e)}, indent=2)

@mcp.tool()
def search_emails(query: str, limit: int = 10) -> str:
    """
    Busca correos en Gmail por palabra clave, remitente o asunto.
    
    Args:
        query: Término de búsqueda (ej. 'AlternativeTo', 'Product Hunt', 'Google Cloud').
        limit: Número máximo de resultados a retornar.
    """
    try:
        mail = connect_imap()
        mail.select("INBOX")
        # Búsqueda en texto completo / asunto / remitente
        search_criterion = f'(OR (SUBJECT "{query}") (FROM "{query}"))'
        _, data = mail.search(None, search_criterion)
        mail_ids = data[0].split()
        
        if not mail_ids:
            # Fallback a búsqueda simple en texto
            _, data = mail.search(None, f'TEXT "{query}"')
            mail_ids = data[0].split()
            
        selected_ids = mail_ids[-min(limit, 25):]
        selected_ids.reverse()
        
        emails_list = []
        for mid in selected_ids:
            _, msg_data = mail.fetch(mid, "(RFC822.HEADER)")
            for response_part in msg_data:
                if isinstance(response_part, tuple):
                    msg = email.message_from_bytes(response_part[1])
                    emails_list.append({
                        "id": mid.decode("utf-8"),
                        "date": decode_mime_header(msg.get("Date")),
                        "from": decode_mime_header(msg.get("From")),
                        "subject": decode_mime_header(msg.get("Subject"))
                    })
        mail.logout()
        return json.dumps({"status": "success", "query": query, "count": len(emails_list), "emails": emails_list}, indent=2, ensure_ascii=False)
    except Exception as e:
        return json.dumps({"status": "error", "error": str(e)}, indent=2)

@mcp.tool()
def get_email_content(email_id: str) -> str:
    """
    Obtiene el contenido completo del correo por su ID.
    
    Args:
        email_id: ID numérico del correo devuelto por list_recent_emails o search_emails.
    """
    try:
        mail = connect_imap()
        mail.select("INBOX")
        _, msg_data = mail.fetch(email_id.encode("utf-8"), "(RFC822)")
        for response_part in msg_data:
            if isinstance(response_part, tuple):
                msg = email.message_from_bytes(response_part[1])
                body = extract_body(msg)
                mail.logout()
                return json.dumps({
                    "status": "success",
                    "id": email_id,
                    "date": decode_mime_header(msg.get("Date")),
                    "from": decode_mime_header(msg.get("From")),
                    "subject": decode_mime_header(msg.get("Subject")),
                    "body": body[:8000] # Limitar a 8000 caracteres para no saturar contexto
                }, indent=2, ensure_ascii=False)
        mail.logout()
        return json.dumps({"status": "error", "message": f"Correo con ID {email_id} no encontrado."}, indent=2)
    except Exception as e:
        return json.dumps({"status": "error", "error": str(e)}, indent=2)

if __name__ == "__main__":
    mcp.run()
