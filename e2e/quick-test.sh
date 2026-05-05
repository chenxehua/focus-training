#!/bin/bash
# 专注星球 - 快速 API 测试

API_BASE="http://localhost:3000"

echo "=========================================="
echo "专注星球 - 快速 API 测试"
echo "=========================================="
echo ""

passed=0
failed=0

# 测试函数
check_success() {
  local result="$1"
  if echo "$result" | grep -qE '(success":true|code":0)'; then
    return 0
  else
    return 1
  fi
}

# 1. 健康检查
echo "📋 1. 健康检查"
result=$(curl -s "$API_BASE/api/health")
if echo "$result" | grep -qE '(success":true|code":0|status":"ok)'; then
  echo "  ✅ GET /api/health - 服务正常"
  ((passed++))
else
  echo "  ❌ GET /api/health - 服务异常"
  ((failed++))
fi

# 2. 认证模块
echo ""
echo "📋 2. 认证模块"
result=$(curl -s -X POST "$API_BASE/api/auth/wx-login" \
  -H "Content-Type: application/json" \
  -d '{"code": "test_quick_login"}')
if check_success "$result"; then
  echo "  ✅ POST /api/auth/wx-login - 新用户登录"
  ((passed++))
  TOKEN=$(echo "$result" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
else
  echo "  ❌ POST /api/auth/wx-login - 登录失败"
  ((failed++))
  TOKEN=""
fi

# 3. 游戏列表
echo ""
echo "📋 3. 游戏模块"
result=$(curl -s "$API_BASE/api/game/list")
if check_success "$result"; then
  echo "  ✅ GET /api/game/list - 获取游戏列表"
  ((passed++))
else
  echo "  ❌ GET /api/game/list - 获取失败"
  ((failed++))
fi

# 4. 会员套餐
echo ""
echo "📋 4. 会员模块"
result=$(curl -s "$API_BASE/api/membership/packages")
if check_success "$result"; then
  echo "  ✅ GET /api/membership/packages - 获取套餐列表"
  ((passed++))
else
  echo "  ❌ GET /api/membership/packages - 获取失败"
  echo "    Response: $result" 
  ((failed++))
fi

# 5. 家长学院
echo ""
echo "📋 5. 家长学院"
result=$(curl -s "$API_BASE/api/academy/categories")
if check_success "$result"; then
  echo "  ✅ GET /api/academy/categories - 获取分类列表"
  ((passed++))
else
  echo "  ❌ GET /api/academy/categories - 获取失败"
  ((failed++))
fi

result=$(curl -s "$API_BASE/api/academy/articles")
if check_success "$result"; then
  echo "  ✅ GET /api/academy/articles - 获取文章列表"
  ((passed++))
else
  echo "  ❌ GET /api/academy/articles - 获取失败"
  ((failed++))
fi

# 6. 学校管理
echo ""
echo "📋 6. 学校管理"
result=$(curl -s "$API_BASE/api/school/schools")
if check_success "$result"; then
  echo "  ✅ GET /api/school/schools - 获取学校列表"
  ((passed++))
else
  echo "  ❌ GET /api/school/schools - 获取失败"
  ((failed++))
fi

# 7. 成就系统
echo ""
echo "📋 7. 成就系统"
result=$(curl -s "$API_BASE/api/achievement/list")
if check_success "$result"; then
  echo "  ✅ GET /api/achievement/list - 获取成就列表"
  ((passed++))
else
  echo "  ❌ GET /api/achievement/list - 获取失败"
  echo "    Response: $result"
  ((failed++))
fi

# 8. 需要认证的接口测试
if [ -n "$TOKEN" ]; then
  echo ""
  echo "📋 8. 需要认证的接口"
  
  # 用户信息
  result=$(curl -s -H "Authorization: Bearer $TOKEN" "$API_BASE/api/user/info")
  if check_success "$result"; then
    echo "  ✅ GET /api/user/info - 获取用户信息"
    ((passed++))
  else
    echo "  ❌ GET /api/user/info - 获取失败"
    ((failed++))
  fi
  
  # 儿童列表
  result=$(curl -s -H "Authorization: Bearer $TOKEN" "$API_BASE/api/user/children")
  if check_success "$result"; then
    echo "  ✅ GET /api/user/children - 获取儿童列表"
    ((passed++))
  else
    echo "  ❌ GET /api/user/children - 获取失败"
    ((failed++))
  fi
  
  # 添加儿童
  result=$(curl -s -X POST -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    "$API_BASE/api/user/child" \
    -d '{"name":"测试儿童","age":8,"gender":"male","ageGroup":"7-9"}')
  if check_success "$result"; then
    echo "  ✅ POST /api/user/child - 添加儿童"
    ((passed++))
    CHILD_ID=$(echo "$result" | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
  else
    echo "  ❌ POST /api/user/child - 添加失败"
    ((failed++))
    CHILD_ID="1"
  fi
  
  # 报告接口
  echo ""
  echo "📋 9. 报告模块"
  result=$(curl -s -H "Authorization: Bearer $TOKEN" "$API_BASE/api/report/today/$CHILD_ID")
  if check_success "$result"; then
    echo "  ✅ GET /api/report/today/:childId - 获取今日数据"
    ((passed++))
  else
    echo "  ❌ GET /api/report/today/:childId - 获取失败"
    ((failed++))
  fi
  
  result=$(curl -s -H "Authorization: Bearer $TOKEN" "$API_BASE/api/report/weekly/$CHILD_ID")
  if check_success "$result"; then
    echo "  ✅ GET /api/report/weekly/:childId - 获取周报"
    ((passed++))
  else
    echo "  ❌ GET /api/report/weekly/:childId - 获取失败"
    ((failed++))
  fi
  
  # 新增的报告路由
  result=$(curl -s -H "Authorization: Bearer $TOKEN" "$API_BASE/api/report/list")
  if check_success "$result"; then
    echo "  ✅ GET /api/report/list - 获取报告列表"
    ((passed++))
  else
    echo "  ❌ GET /api/report/list - 获取失败"
    ((failed++))
  fi
  
  result=$(curl -s -H "Authorization: Bearer $TOKEN" "$API_BASE/api/report/child/$CHILD_ID/latest")
  if check_success "$result"; then
    echo "  ✅ GET /api/report/child/:childId/latest - 获取最新报告"
    ((passed++))
  else
    echo "  ❌ GET /api/report/child/:childId/latest - 获取失败"
    ((failed++))
  fi
  
  # 会员状态
  result=$(curl -s -H "Authorization: Bearer $TOKEN" "$API_BASE/api/membership/status")
  if check_success "$result"; then
    echo "  ✅ GET /api/membership/status - 获取会员状态"
    ((passed++))
  else
    echo "  ❌ GET /api/membership/status - 获取失败"
    ((failed++))
  fi
  
  # 评估模块
  echo ""
  echo "📋 10. 评估模块"
  result=$(curl -s -H "Authorization: Bearer $TOKEN" "$API_BASE/api/assessment/child/$CHILD_ID/dimensions")
  if check_success "$result"; then
    echo "  ✅ GET /api/assessment/child/:childId/dimensions - 获取评估维度"
    ((passed++))
  else
    echo "  ❌ GET /api/assessment/child/:childId/dimensions - 获取失败"
    ((failed++))
  fi
  
  # 推荐模块
  echo ""
  echo "📋 11. 推荐模块"
  result=$(curl -s -H "Authorization: Bearer $TOKEN" "$API_BASE/api/recommendation/$CHILD_ID")
  if check_success "$result"; then
    echo "  ✅ GET /api/recommendation/:childId - 获取推荐"
    ((passed++))
  else
    echo "  ❌ GET /api/recommendation/:childId - 获取失败"
    ((failed++))
  fi
fi

# 总结
echo ""
echo "=========================================="
echo "测试结果汇总"
echo "=========================================="
echo "通过: $passed"
echo "失败: $failed"
echo "总计: $((passed + failed))"
echo ""

if [ $failed -eq 0 ]; then
  echo "🎉 所有测试通过!"
  exit 0
else
  echo "⚠️  有 $failed 个测试失败"
  exit 1
fi
