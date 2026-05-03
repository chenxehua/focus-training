# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: api.spec.ts >> 会员系统 API >> 获取会员套餐
- Location: tests/api.spec.ts:352:7

# Error details

```
Error: expect(received).toBeTruthy()

Received: false
```

# Test source

```ts
  255 |     })
  256 | 
  257 |     expect([200, 201, 400, 401, 500]).toContain(response.status)
  258 |     const body = response.json
  259 |     expect(body).toHaveProperty('code')
  260 |   })
  261 | 
  262 |   test('获取训练记录', async () => {
  263 |     if (!authToken) {
  264 |       test.skip()
  265 |       return
  266 |     }
  267 |     
  268 |     const response = await apiFetch(`/api/game/records?childId=${childId || 1}`, {
  269 |       token: authToken
  270 |     })
  271 | 
  272 |     expect([200, 400, 401, 500]).toContain(response.status)
  273 |     const body = response.json
  274 |     expect(body).toHaveProperty('code')
  275 |   })
  276 | })
  277 | 
  278 | describe('报告系统 API', () => {
  279 |   let authToken: string
  280 | 
  281 |   test.beforeAll(async () => {
  282 |     const loginRes = await apiFetch('/api/auth/wx-login', {
  283 |       method: 'POST',
  284 |       body: { code: `test_report_${Date.now()}` }
  285 |     })
  286 |     const loginBody = loginRes.json
  287 |     if (loginBody.code === 0) {
  288 |       authToken = loginBody.data.token
  289 |     }
  290 |   })
  291 | 
  292 |   test('获取今日数据', async () => {
  293 |     if (!authToken) {
  294 |       test.skip()
  295 |       return
  296 |     }
  297 |     
  298 |     const response = await apiFetch('/api/report/today?childId=1', {
  299 |       token: authToken
  300 |     })
  301 | 
  302 |     expect([200, 400, 401, 500]).toContain(response.status)
  303 |     const body = response.json
  304 |     expect(body).toHaveProperty('code')
  305 |   })
  306 | 
  307 |   test('获取周报', async () => {
  308 |     if (!authToken) {
  309 |       test.skip()
  310 |       return
  311 |     }
  312 |     
  313 |     const response = await apiFetch('/api/report/weekly?childId=1', {
  314 |       token: authToken
  315 |     })
  316 | 
  317 |     expect([200, 400, 401, 500]).toContain(response.status)
  318 |     const body = response.json
  319 |     expect(body).toHaveProperty('code')
  320 |   })
  321 | })
  322 | 
  323 | describe('会员系统 API', () => {
  324 |   let authToken: string
  325 | 
  326 |   test.beforeAll(async () => {
  327 |     const loginRes = await apiFetch('/api/auth/wx-login', {
  328 |       method: 'POST',
  329 |       body: { code: `test_vip_${Date.now()}` }
  330 |     })
  331 |     const loginBody = loginRes.json
  332 |     if (loginBody.code === 0) {
  333 |       authToken = loginBody.data.token
  334 |     }
  335 |   })
  336 | 
  337 |   test('获取会员状态', async () => {
  338 |     if (!authToken) {
  339 |       test.skip()
  340 |       return
  341 |     }
  342 |     
  343 |     const response = await apiFetch('/api/membership/status', {
  344 |       token: authToken
  345 |     })
  346 | 
  347 |     expect([200, 401, 500]).toContain(response.status)
  348 |     const body = response.json
  349 |     expect(body).toHaveProperty('code')
  350 |   })
  351 | 
  352 |   test('获取会员套餐', async () => {
  353 |     const response = await apiFetch('/api/membership/packages')
  354 | 
> 355 |     expect(response.ok).toBeTruthy()
      |                         ^ Error: expect(received).toBeTruthy()
  356 |     const body = response.json
  357 |     // 会员套餐可能返回 code:0 或 success:true
  358 |     if (body.code === 0 || body.success === true) {
  359 |       expect(Array.isArray(body.data)).toBe(true)
  360 |     }
  361 |   })
  362 | })
  363 | 
  364 | describe('成就系统 API', () => {
  365 |   test('获取成就列表', async () => {
  366 |     const response = await apiFetch('/api/achievement/list')
  367 | 
  368 |     expect(response.ok).toBeTruthy()
  369 |     const body = response.json
  370 |     // 支持 code:0 或 success:true 两种响应格式
  371 |     if (body.code === 0 || body.success === true) {
  372 |       expect(Array.isArray(body.data)).toBe(true)
  373 |     }
  374 |   })
  375 | })
  376 | 
  377 | describe('评估系统 API', () => {
  378 |   let authToken: string
  379 | 
  380 |   test.beforeAll(async () => {
  381 |     const loginRes = await apiFetch('/api/auth/wx-login', {
  382 |       method: 'POST',
  383 |       body: { code: `test_assessment_${Date.now()}` }
  384 |     })
  385 |     const loginBody = loginRes.json
  386 |     if (loginBody.code === 0) {
  387 |       authToken = loginBody.data.token
  388 |     }
  389 |   })
  390 | 
  391 |   test('获取能力维度评分', async () => {
  392 |     if (!authToken) {
  393 |       test.skip()
  394 |       return
  395 |     }
  396 |     
  397 |     const response = await apiFetch('/api/assessment/dimensions?childId=1', {
  398 |       token: authToken
  399 |     })
  400 | 
  401 |     expect([200, 400, 401, 500]).toContain(response.status)
  402 |     const body = response.json
  403 |     expect(body).toHaveProperty('code')
  404 |   })
  405 | 
  406 |   test('获取能力趋势', async () => {
  407 |     if (!authToken) {
  408 |       test.skip()
  409 |       return
  410 |     }
  411 |     
  412 |     const response = await apiFetch('/api/assessment/trend?childId=1', {
  413 |       token: authToken
  414 |     })
  415 | 
  416 |     expect([200, 400, 401, 500]).toContain(response.status)
  417 |     const body = response.json
  418 |     expect(body).toHaveProperty('code')
  419 |   })
  420 | })
  421 | 
  422 | describe('推荐系统 API', () => {
  423 |   let authToken: string
  424 | 
  425 |   test.beforeAll(async () => {
  426 |     const loginRes = await apiFetch('/api/auth/wx-login', {
  427 |       method: 'POST',
  428 |       body: { code: `test_rec_${Date.now()}` }
  429 |     })
  430 |     const loginBody = loginRes.json
  431 |     if (loginBody.code === 0) {
  432 |       authToken = loginBody.data.token
  433 |     }
  434 |   })
  435 | 
  436 |   test('获取用户画像', async () => {
  437 |     if (!authToken) {
  438 |       test.skip()
  439 |       return
  440 |     }
  441 |     
  442 |     const response = await apiFetch('/api/recommendation/profile?childId=1', {
  443 |       token: authToken
  444 |     })
  445 | 
  446 |     expect([200, 400, 401, 500]).toContain(response.status)
  447 |     const body = response.json
  448 |     expect(body).toHaveProperty('code')
  449 |   })
  450 | 
  451 |   test('获取游戏推荐', async () => {
  452 |     if (!authToken) {
  453 |       test.skip()
  454 |       return
  455 |     }
```