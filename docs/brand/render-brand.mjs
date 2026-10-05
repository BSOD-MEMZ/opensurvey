// 渲染品牌 SVG 为高分辨率 PNG（透明底），供后续转 webp/ico
// 用法: node render-brand.mjs
import { chromium } from 'playwright-core';
import fs from 'node:fs';
import path from 'node:path';

const EXE = 'C:/Users/Miku/AppData/Local/ms-playwright/chromium-1243/chrome-win64/chrome.exe';
const BRAND_DIR = 'D:/Dev/OpenSurvey/docs/brand';
const OUT_DIR = path.join(BRAND_DIR, 'out');

const JOBS = [
  { svg: 'logo-mark.svg', out: 'mark@2x.png', w: 512, h: 512 },
  { svg: 'logo-wordmark.svg', out: 'wordmark@2x.png', w: 780, h: 320 },
  { svg: 'login-background.svg', out: 'login-bg@1x.png', w: 1442, h: 900, scale: 2 },
  { svg: 'avatar.svg', out: 'avatar@3x.png', w: 400, h: 400, scale: 3 },
];

fs.mkdirSync(OUT_DIR, { recursive: true });

const browser = await chromium.launch({ executablePath: EXE, args: ['--no-sandbox'] });

for (const job of JOBS) {
  const svgPath = path.join(BRAND_DIR, job.svg);
  const svg = fs.readFileSync(svgPath, 'utf8')
    .replace(/width="\d+"/, `width="${job.w}"`)
    .replace(/height="\d+"/, `height="${job.h}"`);
  const html = `<!doctype html><html><head><style>
    html,body{margin:0;padding:0;background:transparent}
    svg{display:block}
  </style></head><body>${svg}</body></html>`;

  const page = await browser.newPage({
    viewport: { width: job.w, height: job.h },
    deviceScaleFactor: job.scale ?? 2,
  });
  await page.setContent(html, { waitUntil: 'load' });
  await page.waitForTimeout(250);
  const outPath = path.join(OUT_DIR, job.out);
  await page.screenshot({ path: outPath, omitBackground: true });
  const { width, height } = await page.evaluate(() => {
    const r = document.querySelector('svg').getBoundingClientRect();
    return { width: r.width, height: r.height };
  });
  console.log(`${job.svg} -> ${job.out}  (CSS ${width}x${height} @2x)`);
  await page.close();
}

await browser.close();
console.log('OK');
