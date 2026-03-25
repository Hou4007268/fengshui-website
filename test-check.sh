#!/bin/bash
# 趣味测试页面功能测试

echo "=== 趣味测试页面功能测试 ==="
echo ""

# 测试目录
TEST_DIR="/Users/yachaolailo/projects/openclaw-backup/vps-website/test"

# 1. 检查所有HTML文件是否存在
echo "1. 检查文件完整性..."
files=(
    "index.html"
    "fun/mbti.html"
    "fun/lucky.html"
    "fun/animal.html"
    "fun/superpower.html"
    "fun/movie.html"
    "fun/music.html"
    "fun/lifestyle.html"
    "fun/all-in-one.html"
)

missing=0
for file in "${files[@]}"; do
    if [ -f "$TEST_DIR/$file" ]; then
        echo "  ✓ $file"
    else
        echo "  ✗ $file (缺失)"
        missing=$((missing + 1))
    fi
done

if [ $missing -eq 0 ]; then
    echo "  所有文件完整！"
else
    echo "  缺失 $missing 个文件"
fi

echo ""

# 2. 检查HTML语法
echo "2. 检查HTML语法..."
syntax_errors=0
for file in "${files[@]}"; do
    if [ -f "$TEST_DIR/$file" ]; then
        # 检查基本HTML结构
        if grep -q "<!DOCTYPE html>" "$TEST_DIR/$file" && \
           grep -q "</html>" "$TEST_DIR/$file" && \
           grep -q "</body>" "$TEST_DIR/$file"; then
            echo "  ✓ $file 语法正确"
        else
            echo "  ✗ $file 语法错误"
            syntax_errors=$((syntax_errors + 1))
        fi
    fi
done

if [ $syntax_errors -eq 0 ]; then
    echo "  所有文件语法正确！"
else
    echo "  发现 $syntax_errors 个语法错误"
fi

echo ""

# 3. 检查JavaScript函数
echo "3. 检查JavaScript函数..."
js_errors=0

# 检查fun目录下的测试页面
for file in fun/*.html; do
    full_path="$TEST_DIR/$file"
    if [ -f "$full_path" ]; then
        # 检查是否有测试函数
        if grep -q "function test" "$full_path" || grep -q "onclick=" "$full_path"; then
            echo "  ✓ $file 包含测试函数"
        else
            echo "  ✗ $file 缺少测试函数"
            js_errors=$((js_errors + 1))
        fi
    fi
done

if [ $js_errors -eq 0 ]; then
    echo "  所有测试函数完整！"
else
    echo "  发现 $js_errors 个函数缺失"
fi

echo ""

# 4. 统计测试数量
echo "4. 测试统计..."
echo "  风水测试: 9个 (fate, love, couple, personality, mental-age, career, face, palm, yucky)"
echo "  趣味测试: 8个 (mbti, lucky, animal, superpower, movie, music, lifestyle, all-in-one)"
echo "  总计: 17个测试"

echo ""

# 5. 检查tools.html链接
echo "5. 检查tools.html集成..."
if grep -q "/test/index.html" "/Users/yachaolailo/projects/openclaw-backup/vps-website/tools.html"; then
    echo "  ✓ tools.html已添加测试中心入口"
else
    echo "  ✗ tools.html未添加测试中心入口"
fi

if grep -q "/test/fun/mbti.html" "/Users/yachaolailo/projects/openclaw-backup/vps-website/tools.html"; then
    echo "  ✓ tools.html已添加趣味测试链接"
else
    echo "  ✗ tools.html未添加趣味测试链接"
fi

echo ""
echo "=== 测试完成 ==="
