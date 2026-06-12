---
name: validate
description: Run puppeteer validation on both the local UI (port 3000) and static site (port 8080) to verify they work correctly.
disable-model-invocation: true
---

# Validate Skill

Run automated puppeteer checks on both nd preserve sites.

## What it checks

- Both servers respond (localhost:3000 and localhost:8080)
- Image viewer opens when calling ndShowPhoto()
- Zoom functions exist (ndPvZoomIn, ndPvZoomOut, ndPvRotateL, ndPvRotateR, ndPvReset)
- Keyboard shortcuts work: `+` zooms in, `-` zooms out, ArrowRight/ArrowLeft rotate, `R` resets
- Theme toggle exists and works

## Steps

1. Check if servers are running on ports 3000 and 8080. If not, start them:
   - Port 3000: `npx tsx src/server.ts` (from tools/)
   - Port 8080: `npx serve site -p 8080` (from repo root)
   - Wait for both to respond

2. Run a puppeteer test script (inline node -e) that:
   - Opens each site
   - Verifies viewer functions exist
   - Opens viewer with a test image
   - Tests keyboard shortcuts (+, -, ArrowRight, ArrowLeft, R)
   - Reports pass/fail for each check

3. Use `const delay = ms => new Promise(r => setTimeout(r, ms))` for waits (not page.waitForTimeout which is deprecated)

4. Element IDs differ between sites:
   - **Static site (8080)**: `nd-pv-img`, `nd-pv-level`, `nd-pv-container`, modal=`nd-modal`
   - **Local UI (3000)**: `pv-image`, `pv-zoom-level`, `pv-container`, modal=`nd-modal`

5. Report results clearly with OK/FAIL per check
