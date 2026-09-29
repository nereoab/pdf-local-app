import subprocess
import json
import sys

def call_gmail_mcp(tool_name: str, args: dict):
    proc = subprocess.Popen(
        ["cmd.exe", "/c", "npx", "-y", "@gongrzhe/server-gmail-autoauth-mcp"],
        cwd=r"C:\Users\Nereo",
        stdin=subprocess.PIPE,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
        encoding="utf-8"
    )

    def send_and_recv(msg):
        proc.stdin.write(json.dumps(msg) + "\n")
        proc.stdin.flush()
        while True:
            line = proc.stdout.readline()
            if not line:
                return None
            line = line.strip()
            if line.startswith("{"):
                try:
                    return json.loads(line)
                except Exception:
                    continue

    # 1. Initialize
    init_req = {
        "jsonrpc": "2.0",
        "id": 1,
        "method": "initialize",
        "params": {
            "protocolVersion": "2024-11-05",
            "capabilities": {},
            "clientInfo": {"name": "gmail-mcp-client", "version": "1.0"}
        }
    }
    send_and_recv(init_req)

    # 2. Initialized
    proc.stdin.write(json.dumps({"jsonrpc": "2.0", "method": "notifications/initialized", "params": {}}) + "\n")
    proc.stdin.flush()

    # 3. Call Tool
    call_req = {
        "jsonrpc": "2.0",
        "id": 2,
        "method": "tools/call",
        "params": {
            "name": tool_name,
            "arguments": args
        }
    }
    res = send_and_recv(call_req)
    proc.terminate()
    return res

if __name__ == "__main__":
    query = sys.argv[1] if len(sys.argv) > 1 else "AlternativeTo OR ProductHunt OR Google"
    max_res = int(sys.argv[2]) if len(sys.argv) > 2 else 5
    print(f"Executing search_emails query: {query}")
    result = call_gmail_mcp("search_emails", {"query": query, "maxResults": max_res})
    print(json.dumps(result, indent=2, ensure_ascii=False))
