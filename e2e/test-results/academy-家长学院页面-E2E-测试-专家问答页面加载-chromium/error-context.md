# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: academy.spec.ts >> 家长学院页面 E2E 测试 >> 专家问答页面加载
- Location: tests/academy.spec.ts:319:7

# Error details

```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:5173/
Call log:
  - navigating to "http://localhost:5173/", waiting until "load"

```

# Test source

```ts
  195 |       const body = await res.json()
  196 |       expect(body.code).toBe(0)
  197 |       expect(Array.isArray(body.data)).toBeTruthy()
  198 |     })
  199 | 
  200 |     test('获取问题详情', async () => {
  201 |       // 先获取热门问题
  202 |       const hotRes = await fetch(`${BASE_URL}/academy/questions/hot?limit=1`)
  203 |       const hotData = await hotRes.json()
  204 |       
  205 |       if (hotData.data && hotData.data.length > 0) {
  206 |         const questionId = hotData.data[0].id
  207 |         const res = await fetch(`${BASE_URL}/academy/questions/${questionId}`)
  208 |         expect(res.ok).toBeTruthy()
  209 |         
  210 |         const body = await res.json()
  211 |         expect(body.code).toBe(0)
  212 |         expect(body.data).toHaveProperty('question_title')
  213 |         expect(body.data).toHaveProperty('question_content')
  214 |       }
  215 |     })
  216 | 
  217 |     test('获取问题回答', async () => {
  218 |       const hotRes = await fetch(`${BASE_URL}/academy/questions/hot?limit=1`)
  219 |       const hotData = await hotRes.json()
  220 |       
  221 |       if (hotData.data && hotData.data.length > 0) {
  222 |         const questionId = hotData.data[0].id
  223 |         const res = await fetch(`${BASE_URL}/academy/questions/${questionId}/answers`)
  224 |         expect(res.ok).toBeTruthy()
  225 |         
  226 |         const body = await res.json()
  227 |         expect(body.code).toBe(0)
  228 |         expect(body.data).toHaveProperty('items')
  229 |       }
  230 |     })
  231 | 
  232 |     test('创建提问 - 未登录返回401', async () => {
  233 |       const res = await fetch(`${BASE_URL}/academy/questions`, {
  234 |         method: 'POST',
  235 |         headers: { 'Content-Type': 'application/json' },
  236 |         body: JSON.stringify({
  237 |           questionTitle: '测试问题标题',
  238 |           questionContent: '这是测试问题的内容描述',
  239 |           categoryId: 1
  240 |         })
  241 |       })
  242 |       
  243 |       const body = await res.json()
  244 |       expect(body.code).toBe(401)
  245 |     })
  246 | 
  247 |     test('创建提问 - 缺少必填字段返回400', async () => {
  248 |       const res = await fetch(`${BASE_URL}/academy/questions`, {
  249 |         method: 'POST',
  250 |         headers: { 
  251 |           'Content-Type': 'application/json',
  252 |           'Authorization': `Bearer ${authToken}`
  253 |         },
  254 |         body: JSON.stringify({
  255 |           questionTitle: '测试'
  256 |         })
  257 |       })
  258 |       
  259 |       const body = await res.json()
  260 |       expect(body.code).toBe(400)
  261 |     })
  262 | 
  263 |     test('创建提问 - 成功', async () => {
  264 |       // 获取问答分类
  265 |       const catRes = await fetch(`${BASE_URL}/academy/questions/categories`)
  266 |       const catData = await catRes.json()
  267 |       
  268 |       if (catData.data && catData.data.length > 0 && authToken) {
  269 |         const res = await fetch(`${BASE_URL}/academy/questions`, {
  270 |           method: 'POST',
  271 |           headers: { 
  272 |             'Content-Type': 'application/json',
  273 |             'Authorization': `Bearer ${authToken}`
  274 |           },
  275 |           body: JSON.stringify({
  276 |             questionTitle: '测试问题标题',
  277 |             questionContent: '这是测试问题的内容描述，至少10个字',
  278 |             categoryId: catData.data[0].id
  279 |           })
  280 |         })
  281 |         
  282 |         expect(res.ok).toBeTruthy()
  283 |         const body = await res.json()
  284 |         expect(body.code).toBe(0)
  285 |         expect(body.data).toHaveProperty('id')
  286 |       }
  287 |     })
  288 |   })
  289 | })
  290 | 
  291 | describe('家长学院页面 E2E 测试', () => {
  292 |   test.beforeEach(async ({ page }) => {
  293 |     await page.setViewportSize({ width: 375, height: 812 })
  294 |     // 模拟登录
> 295 |     await page.goto('http://localhost:5173/')
      |                ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:5173/
  296 |     await page.evaluate(() => {
  297 |       localStorage.setItem('auth_token', 'test_token_123')
  298 |       localStorage.setItem('user_id', '1')
  299 |     })
  300 |   })
  301 | 
  302 |   test('家长学院首页加载', async ({ page }) => {
  303 |     await page.goto('http://localhost:5173/pages/academy/index')
  304 |     await page.waitForLoadState('networkidle')
  305 |     
  306 |     // 检查页面标题
  307 |     const title = page.locator('.title')
  308 |     await expect(title).toContainText('家长学院')
  309 |   })
  310 | 
  311 |   test('文章列表页面加载', async ({ page }) => {
  312 |     await page.goto('http://localhost:5173/pages/academy/articles')
  313 |     await page.waitForLoadState('networkidle')
  314 |     
  315 |     const title = page.locator('.title')
  316 |     await expect(title).toContainText('文章列表')
  317 |   })
  318 | 
  319 |   test('专家问答页面加载', async ({ page }) => {
  320 |     await page.goto('http://localhost:5173/pages/academy/questions')
  321 |     await page.waitForLoadState('networkidle')
  322 |     
  323 |     const title = page.locator('.title')
  324 |     await expect(title).toContainText('专家问答')
  325 |   })
  326 | 
  327 |   test('提问页面加载', async ({ page }) => {
  328 |     await page.goto('http://localhost:5173/pages/academy/ask')
  329 |     await page.waitForLoadState('networkidle')
  330 |     
  331 |     const title = page.locator('.title')
  332 |     await expect(title).toContainText('提问')
  333 |   })
  334 | })
```