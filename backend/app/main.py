from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="售前项目管理系统 API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/health")
async def health():
    return {"status": "ok", "message": "售前系统API运行正常"}

# 导入路由
from app.api import proposals, products, projects
app.include_router(proposals.router, prefix="/api")
app.include_router(products.router, prefix="/api")
app.include_router(projects.router, prefix="/api")
