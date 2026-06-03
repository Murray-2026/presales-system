from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
import json
import os

router = APIRouter()

DATA_FILE = os.path.join(os.path.dirname(__file__), '../data/projects.json')

projects_data = [
    {"id": "1", "name": "无菌隔离器技术方案", "customer": "某生物科技有限公司", "stage": "方案编制", "amount": "150K USD", "engineer": "寇豆码", "updated_at": "2026-06-02"},
    {"id": "2", "name": "VHP传递窗方案", "customer": "某医药公司", "stage": "已报价", "amount": "45K USD", "engineer": "寇豆码", "updated_at": "2026-06-01"},
    {"id": "3", "name": "层流罩需求评估", "customer": "某研究院", "stage": "需求确认", "amount": "待报价", "engineer": "寇豆码", "updated_at": "2026-05-30"},
    {"id": "4", "name": "VHP灭菌方案", "customer": "某制药厂", "stage": "已中标", "amount": "85K USD", "engineer": "寇豆码", "updated_at": "2026-05-28"},
    {"id": "5", "name": "负压隔离器方案", "customer": "某疾控中心", "stage": "技术交流", "amount": "200K USD", "engineer": "寇豆码", "updated_at": "2026-05-25"},
]

@router.get("/projects")
async def list_projects():
    return projects_data

@router.get("/dashboard/stats")
async def get_stats():
    return {
        "total_proposals": 28,
        "total_products": 16,
        "active_projects": 5,
        "won_this_year": 12,
    }
