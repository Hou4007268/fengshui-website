#!/usr/bin/env python3
"""
风水网站 - 统一API网关
整合所有AI工具，统一对外提供服务
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import os

app = Flask(__name__)
CORS(app)

OLLAMA_HOST = os.environ.get("OLLAMA_HOST", "http://localhost:11434")

# ==================== 户型分析 ====================
@app.route('/api/floorplan/analyze', methods=['POST'])
def analyze_floorplan():
    """户型风水分析"""
    if 'image' not in request.files:
        return jsonify({"error": "请上传图片"}), 400
    
    import base64
    image_data = request.files['image'].read()
    image_base64 = base64.b64encode(image_data).decode('utf-8')
    
    prompt = """分析这张户型图：
1. 户型结构概述
2. 风水问题（如穿堂煞、对门煞等）
3. 调整建议
4. 财位推荐

请用JSON格式回复：{"overview": "概述", "issues": "问题", "suggestions": "建议", "wealth": "财位"}"""
    
    try:
        resp = requests.post(
            f"{OLLAMA_HOST}/api/generate",
            json={"model": "gemma3:4b", "prompt": prompt, "images": [image_base64], "stream": False},
            timeout=120
        )
        if resp.status_code == 200:
            return jsonify({"result": resp.json().get("response", ""), "status": "ok"})
    except Exception as e:
        pass
    
    return jsonify({"error": "分析失败"}), 500

# ==================== 配色助手 ====================
@app.route('/api/color/recommend', methods=['GET'])
def recommend_color():
    """风水配色推荐"""
    room = request.args.get('room', '客厅')
    
    prompt = f"""为{room}推荐风水配色。
JSON格式：{{"main_colors": ["色1", "色2"], "secondary_colors": ["色1"], "meanings": ["寓意1"], "effect": "效果"}}"""
    
    try:
        resp = requests.post(
            f"{OLLAMA_HOST}/api/generate",
            json={"model": "qwen2.5:latest", "prompt": prompt, "stream": False},
            timeout=60
        )
        if resp.status_code == 200:
            return jsonify({"room": room, "result": resp.json().get("response", ""), "status": "ok"})
    except:
        pass
    
    return jsonify({"error": "推荐失败"}), 500

# ==================== 预算规划 ====================
@app.route('/api/budget/calculate', methods=['GET'])
def calculate_budget():
    """装修预算计算"""
    area = request.args.get('area', '100')
    room_type = request.args.get('room', '三室两厅')
    style = request.args.get('style', '现代简约')
    
    prompt = f"""生成装修预算方案。面积{area}平米，户型{room_type}，风格{style}。
JSON：{{"total": "总预算", "living_room": "客厅预算", "bedroom": "卧室预算", "kitchen": "厨房预算", "bathroom": "卫生间预算"}}"""
    
    try:
        resp = requests.post(
            f"{OLLAMA_HOST}/api/generate",
            json={"model": "qwen2.5:latest", "prompt": prompt, "stream": False},
            timeout=90
        )
        if resp.status_code == 200:
            return jsonify({"result": resp.json().get("response", ""), "status": "ok"})
    except:
        pass
    
    return jsonify({"error": "计算失败"}), 500

# ==================== 收纳规划 ====================
@app.route('/api/storage/plan', methods=['GET'])
def storage_plan():
    """收纳方案"""
    room = request.args.get('room', '客厅')
    area = request.args.get('area', '20')
    family = request.args.get('family', '3')
    
    prompt = f"""为{room}生成收纳方案。面积{area}平米，{family}口人。
JSON：{{"tools": ["工具1"], "locations": ["位置1"], "tips": ["技巧1"]}}"""
    
    try:
        resp = requests.post(
            f"{OLLAMA_HOST}/api/generate",
            json={"model": "qwen2.5:latest", "prompt": prompt, "stream": False},
            timeout=60
        )
        if resp.status_code == 200:
            return jsonify({"result": resp.json().get("response", ""), "status": "ok"})
    except:
        pass
    
    return jsonify({"error": "生成失败"}), 500

# ==================== 风格测试 ====================
@app.route('/api/style/test', methods=['POST'])
def style_test():
    """装修风格测试"""
    answers = request.json.get('answers', [])
    
    # 简单计分
    styles = {"modern": 0, "nordic": 0, "chinese": 0, "japanese": 0, "european": 0}
    
    score_map = [
        [{"modern": 3}, {"nordic": 2}, {"european": 2}, {"mediterranean": 3}],
        [{"modern": 3}, {"nordic": 3}, {"chinese": 3}, {"mediterranean": 3}],
        [{"modern": 3}, {"nordic": 3}, {"chinese": 2}, {"european": 2}],
    ]
    
    for i, ans in enumerate(answers):
        if i < len(score_map) and ans < len(score_map[i]):
            for style, score in score_map[i][ans].items():
                styles[style] = styles.get(style, 0) + score
    
    style_names = {
        "modern": "现代简约",
        "nordic": "北欧风",
        "chinese": "新中式",
        "japanese": "日式",
        "european": "欧式"
    }
    
    result_style = max(styles, key=styles.get)
    
    return jsonify({
        "style": style_names.get(result_style, "现代简约"),
        "scores": styles,
        "status": "ok"
    })

# ==================== 光照设计 ====================
@app.route('/api/light/design', methods=['GET'])
def light_design():
    """光照设计方案"""
    room = request.args.get('room', '客厅')
    area = request.args.get('area', '20')
    orientation = request.args.get('orientation', '南')
    
    prompt = f"""为{room}设计光照方案。面积{area}平米，朝向{orientation}。
JSON：{{"main": "主光", "aux": ["辅光"], "color_temp": "色温", "brightness": "亮度", "tips": ["建议"]}}"""
    
    try:
        resp = requests.post(
            f"{OLLAMA_HOST}/api/generate",
            json={"model": "qwen2.5:latest", "prompt": prompt, "stream": False},
            timeout=60
        )
        if resp.status_code == 200:
            return jsonify({"result": resp.json().get("response", ""), "status": "ok"})
    except:
        pass
    
    return jsonify({"error": "生成失败"}), 500

# ==================== 健康检查 ====================
@app.route('/api/health', methods=['GET'])
def health():
    """健康检查"""
    try:
        resp = requests.get(f"{OLLAMA_HOST}/api/tags", timeout=5)
        models = resp.json().get("models", [])
        return jsonify({
            "status": "ok",
            "ollama": "connected",
            "models": [m["name"] for m in models]
        })
    except:
        return jsonify({"status": "error", "ollama": "disconnected"})

if __name__ == '__main__':
    print("🏮 一宅一句 API网关启动...")
    print("📡 地址: http://localhost:8000")
    app.run(host='0.0.0.0', port=8000, debug=True)
