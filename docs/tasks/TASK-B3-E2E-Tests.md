# TASK-B3: E2E Tests (Playwright)

## Why
E2E tests validate the full user journey through the real app. This is the highest-confidence test layer and demonstrates testing maturity.

## Setup

### Install
```bash
npm install -D @playwright/test
npx playwright install
```

### Config
**File:** `playwright.config.ts`
- Base URL: `http://localhost:3000`
- Web server command: `npm run dev`
- Browsers: Chromium only (for speed)
- Retries: 1

## Test File
**File:** `e2e/portfolio-dashboard.spec.ts`

### Test Cases

1. **Homepage loads with welcome screen**
   - Navigate to `/`
   - Expect "Connect Wallet" or welcome text visible
   - Expect demo mode toggle visible

2. **Demo mode shows portfolio**
   - Click demo mode toggle
   - Expect portfolio summary section appears
   - Expect total value is displayed (non-zero)
   - Expect asset list has items

3. **Chart time range switching**
   - In demo mode, click 7d/30d/90d/1y buttons
   - Chart re-renders without errors

4. **Asset list sorting**
   - Click sort by value → assets reorder
   - Click sort by name → alphabetical order

5. **Asset list filtering**
   - Select a chain filter → only that chain's assets shown
   - Clear filter → all assets shown

6. **Chain breakdown renders**
   - In demo mode, chart/breakdown section is visible

## Key Pattern
```typescript
import { test, expect } from '@playwright/test';

test.describe('Portfolio Dashboard', () => {
  test('shows welcome screen on load', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText(/connect wallet/i)).toBeVisible();
  });

  test('demo mode shows portfolio data', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /demo/i }).click();
    await expect(page.getByText(/\$/)).toBeVisible(); // Dollar value appears
  });
});
```

## Acceptance Criteria
- [ ] `npx playwright test` passes
- [ ] All 6 test cases pass using demo mode (no real wallet needed)
- [ ] Tests complete in <30 seconds
