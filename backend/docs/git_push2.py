"""通过GitHub API批量提交文件 - 处理既有文件更新"""
import urllib.request
import json
import os
import base64

TOKEN = "YOUR_GITHUB_TOKEN_HERE"  # 使用前请替换为实际token
REPO = "Murray-2026/presales-system"

FILES = [
    "backend/app/main.py",
    "frontend/src/App.tsx",
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
        body = e.read().decode()[:300]
        print(f"  HTTP {e.code}: {body}")
        return None

def get_file_sha(path):
    result = api_call("GET", f"https://api.github.com/repos/{REPO}/contents/{path}")
    if result and isinstance(result, dict):
        return result.get("sha")
    return None

for f in FILES:
    fullpath = os.path.join(BASE_DIR, f)
    if not os.path.exists(fullpath):
        print(f"  SKIP {f}: not found")
        continue
    
    path_in_repo = f.replace("\\", "/")
    existing_sha = get_file_sha(path_in_repo)
    
    with open(fullpath, "rb") as fp:
        content = base64.b64encode(fp.read()).decode()
    
    data = {"message": f"update {path_in_repo}", "content": content, "branch": "main"}
    if existing_sha:
        data["sha"] = existing_sha
    
    url = f"https://api.github.com/repos/{REPO}/contents/{path_in_repo}"
    result = api_call("PUT", url, data)
    if result:
        print(f"  ✅ {path_in_repo}")
    else:
        print(f"  ❌ {path_in_repo}")

print("Done!")
