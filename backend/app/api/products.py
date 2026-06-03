from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
import json
import os

router = APIRouter()

DATA_FILE = os.path.join(os.path.dirname(__file__), '../data/products.json')

products_data = [
    {"id": "1", "name": "无菌检测隔离器", "model": "ISO-1500", "category": "无菌隔离器", "spec": "工作舱1500×800×1800，ISO 5", "base_price": 150000, "status": "active"},
    {"id": "2", "name": "VHP灭菌隔离器", "model": "VHP-1200", "category": "VHP灭菌隔离器", "spec": "工作舱1200×700×1600，VHP灭菌", "base_price": 65000, "status": "active"},
    {"id": "3", "name": "集成式隔离器", "model": "INT-2000", "category": "集成隔离器", "spec": "多功能集成，全自动控制", "base_price": 580000, "status": "active"},
    {"id": "4", "name": "负压隔离器", "model": "NEG-1000", "category": "负压隔离器", "spec": "负压维持，生物安全防护", "base_price": 200000, "status": "active"},
    {"id": "5", "name": "百级层流传递窗", "model": "PB-LF-500", "category": "传递窗", "spec": "百级层流，不锈钢304", "base_price": 25000, "status": "active"},
    {"id": "6", "name": "VHP灭菌传递箱", "model": "PB-VHP-500", "category": "传递窗", "spec": "VHP灭菌，双门互锁", "base_price": 40000, "status": "active"},
]

class ConfigRequest(BaseModel):
    product_id: str
    options: dict

@router.get("/products")
async def list_products():
    return products_data

@router.post("/products/config")
async def calculate_config(req: ConfigRequest):
    product = next((p for p in products_data if p["id"] == req.product_id), None)
    if not product:
        return {"error": "产品未找到"}
    
    base = product["base_price"]
    extras = 0
    for opt_type, opt_value in req.options.items():
        if opt_type == "material":
            extras += 8000 if opt_value == "316L" else 0
        elif opt_type == "control":
            extras += 12000 if opt_value == "plc_remote" else 0
        elif opt_type == "validation":
            extras += 15000 if opt_value == "full" else 0

    return {
        "product": product,
        "base_price": base,
        "extras": extras,
        "total": base + extras,
        "items": [
            {"name": f"主机 {product['name']} ({product['model']})", "qty": 1, "unit_price": base},
        ]
    }
