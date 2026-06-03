"""
设备监控API路由
"""
from fastapi import APIRouter
from typing import Optional
import random
import math
from datetime import datetime

router = APIRouter()

# 模拟设备状态
device_state = {
    "connected": True,
    "device_name": "隔离器缩比模型 v1.0",
    "ip": "192.168.1.100",
    "uptime_seconds": 9300,
    "sensors": {
        "temperature": 24.5,
        "humidity": 45.0,
        "pressure": -15.0,
        "door_state": "closed",
        "sterilizing": False,
    },
    "logs": [
        {"time": "14:32:15", "event": "开门操作", "result": "success"},
        {"time": "14:30:00", "event": "温湿度数据上报", "result": "info"},
        {"time": "14:25:40", "event": "关门操作", "result": "success"},
    ]
}


@router.get("/device/status")
async def get_device_status():
    """获取设备当前状态"""
    # 模拟数据波动
    ds = device_state["sensors"]
    ds["temperature"] = round(ds["temperature"] + (random.random() - 0.5) * 0.3, 1)
    ds["humidity"] = round(ds["humidity"] + (random.random() - 0.5) * 0.5, 1)
    ds["pressure"] = round(ds["pressure"] + (random.random() - 0.5) * 0.5, 1)
    device_state["uptime_seconds"] += 5

    return {
        **device_state,
        "uptime": f"{device_state['uptime_seconds'] // 3600}h {(device_state['uptime_seconds'] % 3600) // 60}m",
    }


@router.post("/device/control")
async def control_device(action: str):
    """控制设备动作：open/close/sterilize"""
    ds = device_state["sensors"]

    if action == "open":
        ds["door_state"] = "open"
        log = {"time": datetime.now().strftime("%H:%M:%S"), "event": "开门操作", "result": "success"}
    elif action == "close":
        ds["door_state"] = "closed"
        log = {"time": datetime.now().strftime("%H:%M:%S"), "event": "关门操作", "result": "success"}
    elif action == "sterilize":
        ds["sterilizing"] = True
        log = {"time": datetime.now().strftime("%H:%M:%S"), "event": "VHP灭菌启动", "result": "info"}
    elif action == "sterilize_done":
        ds["sterilizing"] = False
        log = {"time": datetime.now().strftime("%H:%M:%S"), "event": "VHP灭菌完成", "result": "success"}
    else:
        return {"error": f"Unknown action: {action}"}

    device_state["logs"].insert(0, log)
    if len(device_state["logs"]) > 20:
        device_state["logs"] = device_state["logs"][:20]

    return {"status": "ok", "action": action, "sensors": ds}
