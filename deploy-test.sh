#!/bin/bash
# 部署趣味测试到VPS

VPS_IP="124.156.176.155"
VPS_USER="root"
VPS_PATH="/home/ubuntu/fengshui-website"

echo "=== 部署趣味测试到VPS ==="
echo ""

# 1. 同步test目录
echo "1. 同步test目录..."
rsync -avz --progress \
  /Users/yachaolailo/projects/openclaw-backup/vps-website/test/ \
  ${VPS_USER}@${VPS_IP}:${VPS_PATH}/test/

# 2. 同步tools.html
echo ""
echo "2. 同步tools.html..."
rsync -avz --progress \
  /Users/yachaolailo/projects/openclaw-backup/vps-website/tools.html \
  ${VPS_USER}@${VPS_IP}:${VPS_PATH}/

echo ""
echo "=== 部署完成 ==="
echo ""
echo "访问地址："
echo "  测试中心: https://12zn.com/test/index.html"
echo "  工具页面: https://12zn.com/tools.html"
echo ""
echo "新增测试："
echo "  MBTI: https://12zn.com/test/fun/mbti.html"
echo "  幸运: https://12zn.com/test/fun/lucky.html"
echo "  动物: https://12zn.com/test/fun/animal.html"
echo "  超能力: https://12zn.com/test/fun/superpower.html"
echo "  电影: https://12zn.com/test/fun/movie.html"
echo "  音乐: https://12zn.com/test/fun/music.html"
echo "  人生: https://12zn.com/test/fun/lifestyle.html"
echo "  综合: https://12zn.com/test/fun/all-in-one.html"
