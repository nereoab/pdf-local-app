import os
import base64
import sys
import json

def save_from_file(step_output_file, target_png_path):
    os.makedirs(os.path.dirname(target_png_path), exist_ok=True)
    with open(step_output_file, 'r', encoding='utf-8') as f:
        content = f.read().strip()
    
    if 'data:image/png;base64,' in content:
        b64 = content.split('data:image/png;base64,')[1]
    elif 'base64,' in content:
        b64 = content.split('base64,')[1]
    else:
        b64 = content
        
    b64 = b64.strip('"\' \r\n')
    data = base64.b64decode(b64)
    with open(target_png_path, 'wb') as f:
        f.write(data)
    print(f"SUCCESS: Saved {target_png_path} ({len(data)} bytes)")

if __name__ == '__main__':
    src = sys.argv[1]
    dst = sys.argv[2]
    save_from_file(src, dst)
