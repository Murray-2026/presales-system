"""
URS解析与分析 API路由
"""
import os
import tempfile
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from pydantic import BaseModel
from typing import Optional

from app.services.urs_parser import parse_urs_file
from app.services.urs_analyzer import URSAnalyzer
from app.services.proposal_generator import generate_proposal

router = APIRouter()
analyzer = URSAnalyzer()


class URSTextRequest(BaseModel):
    text: str
    customer: Optional[str] = ""
    language: Optional[str] = "中文"


@router.post("/urs/analyze-text")
async def analyze_urs_text(req: URSTextRequest):
    """分析文本形式的URS"""
    if not req.text.strip():
        raise HTTPException(status_code=400, detail="URS内容不能为空")
    
    # 分析
    analysis = analyzer.analyze(req.text)
    
    # 生成方案
    proposal = generate_proposal(analysis, customer=req.customer, language=req.language)
    
    return {
        "analysis": analysis,
        "proposal": proposal,
    }


@router.post("/urs/analyze-file")
async def analyze_urs_file(
    file: UploadFile = File(...),
    customer: Optional[str] = Form(""),
    language: Optional[str] = Form("中文"),
):
    """分析文档形式的URS（DOCX/PDF/TXT）"""
    
    # 保存上传文件
    suffix = os.path.splitext(file.filename or "urs.txt")[1].lower()
    if suffix not in ['.docx', '.pdf', '.txt']:
        raise HTTPException(status_code=400, 
            detail=f"不支持的文件格式: {suffix}，支持: DOCX, PDF, TXT")
    
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        content = await file.read()
        tmp.write(content)
        tmp_path = tmp.name
    
    try:
        # 解析文档
        text = parse_urs_file(tmp_path)
        
        # 分析
        analysis = analyzer.analyze(text)
        
        # 生成方案
        proposal = generate_proposal(analysis, customer=customer, language=language)
        
        return {
            "filename": file.filename,
            "extracted_text_length": len(text),
            "text_preview": text[:500],
            "analysis": analysis,
            "proposal": proposal,
        }
    finally:
        os.unlink(tmp_path)
