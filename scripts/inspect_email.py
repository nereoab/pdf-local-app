import sys
import re
from gmail_mcp_client import call_gmail_mcp

msg_id = sys.argv[1]
res = call_gmail_mcp('read_email', {'messageId': msg_id})
text = res.get('result', {}).get('content', [{}])[0].get('text', '')

print("=== EMAIL HEADER & PREVIEW ===")
lines = text.split('\n')
for line in lines[:15]:
    print(line)

print("\n=== EXTRACTED URLS ===")
urls = re.findall(r'https?://[^\s"\'<>]+', text)
for u in set(urls):
    if 'alternativeto.net' in u or 'firebase' in u or 'google' in u:
        print(u)
