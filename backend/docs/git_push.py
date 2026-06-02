"""通过GitHub API批量提交文件 - 使用标准库urllib"""
import urllib.request
import json
import os
import base64

TOKEN = "YOUR_GITHUB_TOKEN_HERE"  # 使用前请替换为实际token
REPO = "Murray-2026/presales-system"

FILES = [
    "backend/app/api/device.py",
    "backend/app/main.py",
    "backend/app/data/proposals.json",
    "backend/app/data/projects.json",
    "frontend/src/App.tsx",
    "frontend/src/pages/DeviceMonitor.tsx",
    "frontend/src/components/AppLayout.tsx",
]

BASE_DIR = r"E:\Workbuddy\presales-system"

def api_call(method, url, data=None):
    req = urllib.request.Request(url, method=method)
    req.add_header("Authorization", f"token {TOKEN}")
    req.add_header("Content-Type", "application/json")
    if data:
        req.data = json.dumps(data).encode()
    try:
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read())
    except urllib.error.HTTPError as e:
        print(f"  HTTP Error {e.code}: {e.read().decode()[:200]}")
        return None

print("Uploading files individually...")

HEAD = api_call("GET", f"https://api.github.com/repos/{REPO}/git/refs/heads/main")
HEAD_SHA = HEAD["object"]["sha"]
print(f"Current HEAD: {HEAD_SHA[:10]}...")

for f in FILES:
    fullpath = os.path.join(BASE_DIR, f)
    if not os.path.exists(fullpath):
        print(f"  SKIP {f}: not found")
        continue
    
    with open(fullpath, "rb") as fp:
        content = base64.b64encode(fp.read()).decode()
    
    path_in_repo = f.replace("\\", "/")
    url = f"https://api.github.com/repos/{REPO}/contents/{path_in_repo}"
    data = {"message": f"update {path_in_repo}", "content": content, "branch": "main"}
    
    result = api_call("PUT", url, data)
    if result:
        print(f"  ✅ {path_in_repo}")
    else:
        print(f"  ❌ {path_in_repo}")

print("Done!")
