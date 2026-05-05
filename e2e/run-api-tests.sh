#!/bin/bash
echo "=========================================="
echo "专注星球小程序 API E2E 测试"
echo "=========================================="
echo ""
echo "等待速率限制重置..."
sleep 5
echo ""
echo "运行测试..."
npx playwright test tests/api-full-admin.spec.ts --project='API Tests' --timeout=60000 --workers=1 --reporter=list 2>&1 | tee test-results/api-full.log
echo ""
echo "=========================================="
echo "测试完成!"
echo "=========================================="
