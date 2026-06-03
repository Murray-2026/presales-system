from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import json
import os

router = APIRouter()

DATA_FILE = os.path.join(os.path.dirname(__file__), '../data/proposals.json')

class Proposal(BaseModel):
    id: Optional[str] = None
    title: str
    customer: str
    product: str
    params: Optional[str] = ''
    requirements: Optional[str] = ''
    language: str = '中文'
    status: str = 'draft'
    created_at: Optional[str] = None

def _load_data():
    if not os.path.exists(DATA_FILE):
        return []
    with open(DATA_FILE, 'r', encoding='utf-8') as f:
        return json.load(f)

def _save_data(data):
    os.makedirs(os.path.dirname(DATA_FILE), exist_ok=True)
    with open(DATA_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

@router.get("/proposals")
async def list_proposals():
    return _load_data()

@router.get("/proposals/{proposal_id}")
async def get_proposal(proposal_id: str):
    data = _load_data()
    for item in data:
        if item.get('id') == proposal_id:
            return item
    raise HTTPException(status_code=404, detail="方案未找到")

@router.post("/proposals")
async def create_proposal(proposal: Proposal):
    data = _load_data()
    new_id = str(len(data) + 1)
    new_proposal = proposal.model_dump()
    new_proposal['id'] = new_id
    new_proposal['created_at'] = datetime.now().strftime('%Y-%m-%d')
    data.append(new_proposal)
    _save_data(data)
    return new_proposal

@router.delete("/proposals/{proposal_id}")
async def delete_proposal(proposal_id: str):
    data = _load_data()
    new_data = [item for item in data if item.get('id') != proposal_id]
    if len(new_data) == len(data):
        raise HTTPException(status_code=404, detail="方案未找到")
    _save_data(new_data)
    return {"message": "已删除"}
