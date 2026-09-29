import subprocess
import json
import os

out_dir = r"C:\Users\Nereo\.gemini\antigravity-ide\mcp\gmail"
os.makedirs(out_dir, exist_ok=True)

proc = subprocess.Popen(
    ["cmd.exe", "/c", "npx", "-y", "@gongrzhe/server-gmail-autoauth-mcp"],
    cwd=r"C:\Users\Nereo",
    stdin=subprocess.PIPE,
    stdout=subprocess.PIPE,
    stderr=subprocess.PIPE,
    text=True
)

init_req = {
    "jsonrpc": "2.0",
    "id": 1,
    "method": "initialize",
    "params": {
        "protocolVersion": "2024-11-05",
        "capabilities": {},
        "clientInfo": {"name": "antigravity-setup", "version": "1.0"}
    }
}
proc.stdin.write(json.dumps(init_req) + "\n")
proc.stdin.flush()
init_line = proc.stdout.readline()

proc.stdin.write(json.dumps({"jsonrpc": "2.0", "method": "notifications/initialized", "params": {}}) + "\n")
proc.stdin.flush()

tools_req = {
    "jsonrpc": "2.0",
    "id": 2,
    "method": "tools/list",
    "params": {}
}
proc.stdin.write(json.dumps(tools_req) + "\n")
proc.stdin.flush()

line = proc.stdout.readline()
res = json.loads(line)
tools = res.get("result", {}).get("tools", [])

for t in tools:
    schema = {
        "name": t["name"],
        "description": t.get("description", ""),
        "parameters": t.get("inputSchema", {"type": "object", "properties": {}})
    }
    tool_file = os.path.join(out_dir, f"{t['name']}.json")
    with open(tool_file, "w", encoding="utf-8") as f:
        json.dump(schema, f, indent=2)

print(f"SUCCESS: Exported {len(tools)} tools to {out_dir}")
proc.terminate()
