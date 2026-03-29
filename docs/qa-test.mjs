import { chromium } from 'playwright';
import fs from 'fs';

const SCREENSHOT_DIR = '/Users/liamfrazer/projects/micro-tools/docs/qa-screenshots';
const BASE_URL = 'https://devtools.page';
const results = [];

async function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

async function testTool(browser, name, slug, testFn) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();

  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', err => consoleErrors.push(err.message));

  const url = `${BASE_URL}/tools/${slug}`;
  let status = 'FAIL';
  let notes = '';

  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    await delay(2000);

    const result = await testFn(page);
    status = result.status;
    notes = result.notes;

    if (consoleErrors.length > 0) {
      notes += ` | Console errors: ${consoleErrors.join('; ')}`;
    }
  } catch (err) {
    status = 'FAIL';
    notes = `Error: ${err.message}`;
  }

  const screenshotPath = `${SCREENSHOT_DIR}/${slug}.png`;
  await page.screenshot({ path: screenshotPath, fullPage: false });

  results.push({ name, url, status, notes, screenshotPath });
  console.log(`${status}: ${name} — ${notes}`);

  await context.close();
}

(async () => {
  const browser = await chromium.launch({ headless: true });

  // 1. JSON Path Tester
  await testTool(browser, 'JSON Path Tester', 'json-path-tester', async (page) => {
    const snapshot = await page.content();

    // Find JSON input area and path input
    const textareas = await page.locator('textarea').all();
    const inputs = await page.locator('input[type="text"], input:not([type])').all();

    // Try to find the JSON input (usually a textarea or code editor)
    const jsonInput = '{"store":{"book":[{"title":"Moby Dick"},{"title":"1984"}]}}';
    const pathInput = '$.store.book[*].title';

    // Check for Monaco/CodeMirror or plain textareas
    if (textareas.length > 0) {
      await textareas[0].click();
      await textareas[0].fill(jsonInput);
    } else {
      // Try contenteditable or other editor
      const editor = page.locator('[contenteditable="true"], .cm-content, .monaco-editor textarea').first();
      if (await editor.count() > 0) {
        await editor.click();
        await editor.fill(jsonInput);
      }
    }

    // Find path input field
    for (const input of inputs) {
      const placeholder = await input.getAttribute('placeholder') || '';
      const label = await input.getAttribute('aria-label') || '';
      const id = await input.getAttribute('id') || '';
      if (placeholder.toLowerCase().includes('path') || label.toLowerCase().includes('path') || id.toLowerCase().includes('path') || placeholder.includes('$')) {
        await input.fill(pathInput);
        break;
      }
    }

    // If no specific path input found, try first input
    if (inputs.length > 0) {
      const val = await inputs[0].inputValue().catch(() => '');
      if (!val.includes('$')) {
        // Try filling first available input if path not set
        for (const input of inputs) {
          try {
            const v = await input.inputValue();
            if (!v) { await input.fill(pathInput); break; }
          } catch(e) {}
        }
      }
    }

    await delay(1000);

    // Try clicking a run/evaluate button
    const buttons = await page.locator('button').all();
    for (const btn of buttons) {
      const text = (await btn.textContent() || '').toLowerCase();
      if (text.includes('run') || text.includes('eval') || text.includes('test') || text.includes('query') || text.includes('execute') || text.includes('apply')) {
        await btn.click();
        break;
      }
    }

    await delay(2000);

    const pageText = await page.textContent('body');
    const hasMoby = pageText.includes('Moby Dick');
    const has1984 = pageText.includes('1984');

    if (hasMoby && has1984) {
      return { status: 'PASS', notes: 'Both titles (Moby Dick, 1984) found in output' };
    } else {
      return { status: 'FAIL', notes: `Missing results. Moby Dick: ${hasMoby}, 1984: ${has1984}. Page may need different interaction.` };
    }
  });

  // 2. Tailwind CSS Converter
  await testTool(browser, 'Tailwind CSS Converter', 'tailwind-css-converter', async (page) => {
    const cssInput = 'margin: 16px; padding: 8px; color: red;';

    const textareas = await page.locator('textarea').all();
    if (textareas.length > 0) {
      await textareas[0].click();
      await page.keyboard.press('Meta+a');
      await textareas[0].fill(cssInput);
    }

    await delay(1000);

    // Click convert button
    const buttons = await page.locator('button').all();
    for (const btn of buttons) {
      const text = (await btn.textContent() || '').toLowerCase();
      if (text.includes('convert') || text.includes('generate') || text.includes('translate') || text.includes('transform')) {
        await btn.click();
        break;
      }
    }

    await delay(2000);

    const pageText = await page.textContent('body');
    // Look for tailwind classes like m-4, p-2, text-red
    const hasTailwind = pageText.includes('m-4') || pageText.includes('p-2') || pageText.includes('text-red') ||
                        pageText.includes('margin') || pageText.includes('padding');

    if (hasTailwind) {
      return { status: 'PASS', notes: 'Tailwind class suggestions found in output' };
    } else {
      return { status: 'FAIL', notes: 'No Tailwind class suggestions detected in output' };
    }
  });

  // 3. TOML Formatter
  await testTool(browser, 'TOML Formatter', 'toml-formatter', async (page) => {
    const tomlInput = '[server]\nhost = "localhost"\nport = 8080';

    const textareas = await page.locator('textarea').all();
    if (textareas.length > 0) {
      await textareas[0].click();
      await page.keyboard.press('Meta+a');
      await textareas[0].fill(tomlInput);
    }

    await delay(1000);

    const buttons = await page.locator('button').all();
    for (const btn of buttons) {
      const text = (await btn.textContent() || '').toLowerCase();
      if (text.includes('format') || text.includes('beautify') || text.includes('validate') || text.includes('parse')) {
        await btn.click();
        break;
      }
    }

    await delay(2000);

    const pageText = await page.textContent('body');
    const hasServer = pageText.includes('[server]') || pageText.includes('server');
    const hasHost = pageText.includes('localhost');
    const hasPort = pageText.includes('8080');

    if (hasServer && hasHost && hasPort) {
      return { status: 'PASS', notes: 'TOML formatted output contains server, localhost, and 8080' };
    } else {
      return { status: 'FAIL', notes: `Output missing expected content. server:${hasServer} host:${hasHost} port:${hasPort}` };
    }
  });

  // 4. IP Address Lookup
  await testTool(browser, 'IP Address Lookup', 'ip-address-lookup', async (page) => {
    const ipInput = '8.8.8.8';

    const inputs = await page.locator('input[type="text"], input:not([type])').all();
    const textareas = await page.locator('textarea').all();

    let filled = false;
    for (const input of inputs) {
      const placeholder = await input.getAttribute('placeholder') || '';
      const type = await input.getAttribute('type') || '';
      if (type !== 'hidden' && type !== 'checkbox' && type !== 'radio') {
        await input.fill(ipInput);
        filled = true;
        break;
      }
    }
    if (!filled && textareas.length > 0) {
      await textareas[0].fill(ipInput);
    }

    await delay(1000);

    const buttons = await page.locator('button').all();
    for (const btn of buttons) {
      const text = (await btn.textContent() || '').toLowerCase();
      if (text.includes('lookup') || text.includes('search') || text.includes('check') || text.includes('find') || text.includes('submit') || text.includes('go') || text.includes('calculate')) {
        await btn.click();
        break;
      }
    }

    await delay(3000);

    const pageText = await page.textContent('body');
    const hasGoogle = pageText.toLowerCase().includes('google');
    const hasIP = pageText.includes('8.8.8.8');
    const hasGeo = pageText.toLowerCase().includes('united states') || pageText.toLowerCase().includes('us') ||
                   pageText.toLowerCase().includes('mountain view') || pageText.toLowerCase().includes('california') ||
                   pageText.toLowerCase().includes('subnet') || pageText.toLowerCase().includes('dns');

    if (hasIP && (hasGoogle || hasGeo)) {
      return { status: 'PASS', notes: 'IP info displayed with Google/location data' };
    } else {
      return { status: 'FAIL', notes: `IP lookup results incomplete. IP shown:${hasIP} Google:${hasGoogle} Geo:${hasGeo}` };
    }
  });

  // 5. Barcode Generator
  await testTool(browser, 'Barcode Generator', 'barcode-generator', async (page) => {
    const barcodeInput = '1234567890';

    const inputs = await page.locator('input[type="text"], input:not([type])').all();
    const textareas = await page.locator('textarea').all();

    let filled = false;
    for (const input of inputs) {
      const type = await input.getAttribute('type') || '';
      if (type !== 'hidden' && type !== 'checkbox' && type !== 'radio') {
        await input.fill(barcodeInput);
        filled = true;
        break;
      }
    }
    if (!filled && textareas.length > 0) {
      await textareas[0].fill(barcodeInput);
    }

    await delay(1000);

    const buttons = await page.locator('button').all();
    for (const btn of buttons) {
      const text = (await btn.textContent() || '').toLowerCase();
      if (text.includes('generate') || text.includes('create') || text.includes('make') || text.includes('encode')) {
        await btn.click();
        break;
      }
    }

    await delay(2000);

    // Check for barcode output — could be SVG, canvas, or img
    const svgCount = await page.locator('svg').count();
    const canvasCount = await page.locator('canvas').count();
    const imgCount = await page.locator('img[src*="barcode"], img[src*="data:image"]').count();
    const hasBarcode = svgCount > 0 || canvasCount > 0 || imgCount > 0;

    if (hasBarcode) {
      return { status: 'PASS', notes: `Barcode generated (SVGs:${svgCount} Canvas:${canvasCount} Imgs:${imgCount})` };
    } else {
      return { status: 'FAIL', notes: 'No barcode image/SVG/canvas detected after generation' };
    }
  });

  await browser.close();

  // Print summary
  console.log('\n========== QA TEST RESULTS ==========');
  for (const r of results) {
    console.log(`\n${r.status}: ${r.name}`);
    console.log(`  URL: ${r.url}`);
    console.log(`  Notes: ${r.notes}`);
    console.log(`  Screenshot: ${r.screenshotPath}`);
  }
  console.log('\n=====================================');

  // Write results JSON
  fs.writeFileSync(`${SCREENSHOT_DIR}/qa-results.json`, JSON.stringify(results, null, 2));
})();
