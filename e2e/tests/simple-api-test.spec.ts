/**
 * Simple API Test - Quick verification
 */
import { test, expect } from '@playwright/test'

test('Health check', async () => {
  const response = await fetch('http://localhost:3000/api/health')
  expect(response.ok).toBeTruthy()
  const json = await response.json()
  expect(json.status).toBe('ok')
})

test('Admin login', async () => {
  const response = await fetch('http://localhost:3000/api/auth/admin-login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: 'admin123' })
  })
  expect(response.ok).toBeTruthy()
})

test('Game list (public)', async () => {
  const response = await fetch('http://localhost:3000/api/game/list')
  expect(response.ok).toBeTruthy()
})
