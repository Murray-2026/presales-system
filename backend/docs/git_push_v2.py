"""
通过GitHub API (git data endpoints) 推送本地未推送的提交
处理多个未推送提交，保持提交历史完整
"""
import urllib.request
import json
import os
import base64
import subprocess
import sys

TOKEN = "YOUR_GITHUB_TOKEN_HERE"  # 使用前请替换为实际token
REPO = "Murray-2026/presales-system"
BASE_DIR = r"E:\Workbuddy\presales-system"

def api_call(method, url, data=None):
    """调用GitHub REST API"""
    req = urllib.request.Request(url, method=method)
    req.add_header("Authorization", f"token {TOKEN}")
    req.add_header("Content-Type", "application/json")
    req.add_header("Accept", "application/vnd.github.v3+json")
    if data:
        req.data = json.dumps(data).encode()
    try:
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read())
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        print(f"  HTTP {e.code}: {body[:300]}")
        return None

def get_unpushed_commits():
    """获取未推送的commit列表"""
    result = subprocess.run(
        'git log origin/main..HEAD --oneline --reverse',
        cwd=BASE_DIR, capture_output=True, shell=True
    )
    raw = result.stdout.decode("utf-8", errors="replace").strip()
    commits = []
    for line in raw.split("\n"):
        if line.strip():
            parts = line.split(" ", 1)
            commits.append({"sha": parts[0], "message": parts[1] if len(parts) > 1 else ""})
    return commits

def get_commit_diff(commit_sha):
    """获取commit中新增/修改的文件列表"""
    result = subprocess.run(
        f'git diff-tree --no-commit-id -r --name-status -M {commit_sha}',
        cwd=BASE_DIR, capture_output=True, shell=True
    )
    raw = result.stdout.decode("utf-8", errors="replace").strip()
    files = []
    for line in raw.split("\n"):
        if line.strip():
            parts = line.split("\t")
            files.append({"status": parts[0], "path": parts[1]})
    return files

def get_file_content_and_mode(filepath):
    """获取文件的base64内容和git文件模式"""
    result = subprocess.run(
        f'git ls-files --stage "{filepath}"',
        cwd=BASE_DIR, capture_output=True, shell=True
    )
    raw = result.stdout.decode("utf-8", errors="replace").strip()
    mode = "100644"
    if raw:
        mode = raw.split(" ")[0]

    fullpath = os.path.join(BASE_DIR, filepath)
    if not os.path.exists(fullpath):
        return None, mode
    
    with open(fullpath, "rb") as f:
        content = base64.b64encode(f.read()).decode()
    return content, mode

def create_blob(content_b64):
    """创建Git blob对象"""
    data = {"content": content_b64, "encoding": "base64"}
    result = api_call("POST", f"https://api.github.com/repos/{REPO}/git/blobs", data)
    return result["sha"] if result else None

def push_commit(commit_sha, parent_sha, file_changes):
    """使用Git Data API推送一个commit"""
    print(f"\nProcessing commit {commit_sha[:10]}...")
    
    # 1. 为每个变更文件创建 blob
    blobs = []
    for change in file_changes:
        if change["status"] == "D":
            # 删除的文件不需要创建blob，但需要在tree中标记
            blobs.append({"path": change["path"], "mode": "100644", "type": "blob", "sha": None})
            print(f"  DELETE {change['path']}")
        else:
            content_b64, mode = get_file_content_and_mode(change["path"])
            if content_b64 is None:
                print(f"  SKIP {change['path']}: not found")
                continue
            blob_sha = create_blob(content_b64)
            if blob_sha:
                blobs.append({"path": change["path"], "mode": mode, "type": "blob", "sha": blob_sha})
                print(f"  ADD {change['path']} ({blob_sha[:10]}...)")
            else:
                print(f"  FAIL {change['path']}: blob creation failed")
                return False

    # 2. 如果s没有文件变更，跳过
    if not blobs:
        print("  No file changes to push")
        return True

    # 3. 获取基础tree
    base_commit = api_call("GET", f"https://api.github.com/repos/{REPO}/git/commits/{parent_sha}")
    if not base_commit:
        print(f"  FAIL: could not get base commit {parent_sha[:10]}")
        return False
    base_tree_sha = base_commit["tree"]["sha"]

    # 4. 创建新tree
    tree_data = {"base_tree": base_tree_sha, "tree": blobs}
    new_tree = api_call("POST", f"https://api.github.com/repos/{REPO}/git/trees", tree_data)
    if not new_tree:
        print(f"  FAIL: tree creation failed")
        return False
    print(f"  Tree: {new_tree['sha'][:10]}...")

    # 5. 获取commit信息（作者、提交者）
    result = subprocess.run(
        f'git show --no-patch --format="%an|%ae|%cn|%ce|%s" {commit_sha}',
        cwd=BASE_DIR, capture_output=True, shell=True
    )
    raw = result.stdout.decode("utf-8", errors="replace").strip()
    parts = raw.split("|")
    author_name = parts[0] if len(parts) > 0 else "Kou"
    author_email = parts[1] if len(parts) > 1 else "murray.work@example.com"
    committer_name = parts[2] if len(parts) > 2 else author_name
    committer_email = parts[3] if len(parts) > 3 else author_email
    message = parts[4] if len(parts) > 4 else ""

    # 6. 创建commit
    commit_data = {
        "message": message,
        "tree": new_tree["sha"],
        "parents": [parent_sha],
        "author": {"name": author_name, "email": author_email, "date": "2026-06-02T16:00:00+08:00"},
        "committer": {"name": committer_name, "email": committer_email, "date": "2026-06-02T16:00:00+08:00"},
    }
    new_commit = api_call("POST", f"https://api.github.com/repos/{REPO}/git/commits", commit_data)
    if not new_commit:
        print(f"  FAIL: commit creation failed")
        return False
    print(f"  Commit: {new_commit['sha'][:10]}...")

    # 7. 更新ref
    ref_data = {"sha": new_commit["sha"], "force": False}
    result = api_call("PATCH", f"https://api.github.com/repos/{REPO}/git/refs/heads/main", ref_data)
    if result:
        print(f"  ✅ Ref updated to {new_commit['sha'][:10]}!")
        return new_commit["sha"]
    else:
        print(f"  ❌ Ref update failed")
        return False

def main():
    os.chdir(BASE_DIR)
    
    # 检查未推送的commit
    commits = get_unpushed_commits()
    if not commits:
        print("No unpushed commits found.")
        return
    
    print(f"Found {len(commits)} unpushed commit(s):")
    for c in commits:
        print(f"  {c['sha'][:10]} - {c['message'][:60]}")
    
    # 获取当前origin/main的HEAD
    head = api_call("GET", f"https://api.github.com/repos/{REPO}/git/refs/heads/main")
    if not head:
        print("Failed to get remote HEAD")
        return
    
    current_sha = head["object"]["sha"]
    print(f"\nRemote HEAD: {current_sha[:10]}...")
    
    # 逐个推送commit
    for commit in commits:
        # 获取commit的变更文件
        files = get_commit_diff(commit["sha"])
        if not files:
            print(f"\nCommit {commit['sha'][:10]} has no file changes, skipping")
            continue
        
        result = push_commit(commit["sha"], current_sha, files)
        if result:
            current_sha = result
        else:
            print(f"\n❌ Failed to push commit {commit['sha'][:10]}")
            break
    
    print("\nDone!")

if __name__ == "__main__":
    main()
