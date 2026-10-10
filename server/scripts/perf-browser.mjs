/**
 * 在真实浏览器里驱动登录页「注册」按钮，量出客户端每一段的耗时。
 * 用法（在 server/ 目录下跑）：
 *   MONGO_URL=mongodb://127.0.0.1:17385/ node scripts/perf-browser.mjs
 */
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import { MongoClient, ObjectId } from 'mongodb';

const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const PORT = 9300 + Math.floor(Math.random() * 400);
const PAGE = process.env.PAGE || 'http://127.0.0.1:8080/management/login';
const MONGO_URL = process.env.MONGO_URL || 'mongodb://127.0.0.1:17385/';
const HEADFUL = process.env.HEADFUL === '1';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const mongo = new MongoClient(MONGO_URL);
await mongo.connect();
const db = mongo.db('opensurvey');

async function getTarget() {
  for (let i = 0; i < 80; i++) {
    try {
      const r = await fetch(`http://127.0.0.1:${PORT}/json/list`);
      const l = await r.json();
      const t = l.find((x) => x.type === 'page' && x.webSocketDebuggerUrl);
      if (t) return t;
    } catch {}
    await sleep(250);
  }
  throw new Error('CDP 没起来');
}

const profile = `${process.env.TEMP}/edgeperf-${PORT}`.replace(/\\/g, '/');
fs.rmSync(profile, { recursive: true, force: true });
const edgeArgs = [
  `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`,
  '--no-first-run', '--no-default-browser-check', '--disable-gpu',
  'about:blank',
];
if (!HEADFUL) edgeArgs.unshift('--headless=new');
console.log(`启动 Edge（${HEADFUL ? '有头窗口，你可以看着它操作' : '无头'}）profile=${profile}`);
const edge = spawn(EDGE, edgeArgs, { stdio: 'ignore' });

const target = await getTarget();
const ws = new WebSocket(target.webSocketDebuggerUrl);
let id = 0;
const pending = new Map();
let t0 = Date.now();

const net = [];            // {url, method, tReq, tResp, status}
const byReqId = new Map();
const pendingModules = new Map();   // reqId -> url，8080 上还没回来的模块请求
const modulePendAt = [];            // {t, n} 在途模块数随时间变化

ws.addEventListener('message', (ev) => {
  const msg = JSON.parse(ev.data);
  const t = Date.now() - t0;
  if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); return; }
  const p = msg.params;
  if (msg.method === 'Network.requestWillBeSent') {
    const url = p.request.url;
    byReqId.set(p.requestId, { url, method: p.request.method, tReq: t });
    if (url.includes('127.0.0.1:8080') && !url.includes('/api/') && !url.includes('@vite')) {
      pendingModules.set(p.requestId, url);
      modulePendAt.push({ t, n: pendingModules.size });
    }
  } else if (msg.method === 'Network.responseReceived') {
    const rec = byReqId.get(p.requestId);
    if (rec) { rec.tResp = t; rec.status = p.response.status; }
    if (p.type === 'XHR' || p.type === 'Fetch') net.push({ ...rec, requestId: p.requestId });
  } else if (msg.method === 'Network.loadingFinished' || msg.method === 'Network.loadingFailed') {
    pendingModules.delete(p.requestId);
  }
});
await new Promise((r) => ws.addEventListener('open', r));
const send = (m, params = {}) => new Promise((res) => {
  const mid = ++id; pending.set(mid, res); ws.send(JSON.stringify({ id: mid, method: m, params }));
});
const evalJs = async (expr) => {
  const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
  return r.result?.result?.value;
};

await send('Page.enable');
await send('Runtime.enable');
await send('Network.enable');
await send('Page.addScriptToEvaluateOnNewDocument', {
  source: `
    window.__lt = [];
    try {
      new PerformanceObserver((l) => {
        for (const e of l.getEntries()) window.__lt.push({ s: Math.round(e.startTime), d: Math.round(e.duration) });
      }).observe({ entryTypes: ['longtask'] });
    } catch (e) { window.__lt.push({ err: String(e) }); }
  `,
});
t0 = Date.now();
await send('Page.navigate', { url: PAGE });

// 等登录页可交互（账号 + 密码两个输入框）；若页面仍在用验证码，再顺手取一次明文
let captchaId = null;
let pageReady = false;
for (let i = 0; i < 60 && !pageReady; i++) {
  await sleep(250);
  const s = await evalJs(`(() => {
    const n = document.querySelectorAll('.el-input__inner').length;
    const hasBtn = [...document.querySelectorAll('button')].some(b => b.textContent.trim() === '注册');
    return JSON.stringify({ n, hasBtn });
  })()`);
  try {
    const v = JSON.parse(s || '{}');
    if (v.n >= 2 && v.hasBtn) pageReady = true;
  } catch {}
  for (const [rid, rec] of byReqId) {
    if (rec.url.endsWith('/api/auth/captcha') && rec.tResp != null) {
      const body = await send('Network.getResponseBody', { requestId: rid });
      try {
        const j = JSON.parse(body.result.body);
        captchaId = j?.data?.id || j?.data?.captchaId;
      } catch {}
    }
  }
}
const tReady = Date.now() - t0;
let captchaText = null;
if (captchaId) {
  const doc = await db.collection('captcha').findOne({ _id: new ObjectId(captchaId) });
  captchaText = doc?.text ?? null;
}
console.log(`登录页可交互耗时 ${tReady} ms；验证码：${captchaText ? '页面仍在使用，明文 = ' + captchaText : '登录页已不使用（符合预期）'}`);

// 填入表单并点注册
const username = 'ui' + Date.now().toString().slice(-8);
const fillResult = await evalJs(`(() => {
  const inputs = [...document.querySelectorAll('.el-input__inner')];
  const set = (el, v) => {
    const s = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
    s.call(el, v);
    el.dispatchEvent(new Event('input', { bubbles: true }));
  };
  if (inputs.length < 2) return { count: inputs.length, err: '输入框不足 2 个' };
  set(inputs[0], ${JSON.stringify(username)});   // 账号
  set(inputs[1], 'Perf123456');                  // 密码
  if (inputs[2] && ${JSON.stringify(captchaText ?? '')}) set(inputs[2], ${JSON.stringify(captchaText ?? '')});
  return { count: inputs.length, filled: inputs.length };
})()`);
console.log(`表单输入框数量：${fillResult?.count}（${fillResult?.err || '已填好'}）`);
await sleep(900); // 让 debounce(500) 的密码强度校验跑完

const clickAt = Date.now() - t0;
const before = modulePendAt.filter((x) => x.t <= clickAt).slice(-1)[0] || { n: 0 };
const pendingUrlsAtClick = [...pendingModules.values()];
await evalJs(`(() => {
  const btns = [...document.querySelectorAll('button')];
  const b = btns.find(x => x.textContent.trim() === '注册');
  if (!b) return 'no-button';
  b.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  return 'clicked';
})()`);

// 轮询按钮 loading 状态与最终 URL
const marks = {};
const deadline = Date.now() + 30000;
while (Date.now() < deadline) {
  const s = await evalJs(`JSON.stringify({
    loading: !!document.querySelector('button.is-loading'),
    href: location.pathname,
    msg: (document.querySelector('.el-message')||{}).textContent || ''
  })`);
  if (s) {
    const v = JSON.parse(s);
    const t = Date.now() - t0;
    if (v.loading && !marks.spin) marks.spin = t;
    if (!v.loading && marks.spin && !marks.spinEnd) marks.spinEnd = t;
    if (v.href !== '/management/login' && !marks.nav) marks.nav = t;
    if (v.msg && !marks.msg) marks.msg = v.msg + ' @ ' + t + 'ms';
    marks.last = v;
    if (marks.spinEnd && marks.nav) break;
  }
  await sleep(100);
}

const reg = net.find((x) => x.url.endsWith('/api/auth/register'));
let regBody = null;
if (reg?.requestId) {
  const b = await send('Network.getResponseBody', { requestId: reg.requestId });
  try { regBody = JSON.parse(b.result.body); } catch { regBody = { raw: (b.result?.body || '').slice(0, 200) }; }
}
console.log('\n=== 客户端时间线（相对导航起点）===');
console.log(`  点击「注册」                    : ${clickAt} ms`);
console.log(`  点击瞬间 8080 上在途的模块请求  : ${before.n} 个`);
if (pendingUrlsAtClick.length) {
  console.log(`    ↳ 其中前 5 个还没回来的:`);
  pendingUrlsAtClick.slice(0, 5).forEach((u) => console.log(`        ${u.replace('http://127.0.0.1:8080', '')}`));
}
console.log(`  按钮开始转                      : ${marks.spin ?? '-'} ms`);
if (reg) {
  console.log(`  注册请求发出                    : ${reg.tReq} ms   （点击后 ${reg.tReq - clickAt} ms）`);
  console.log(`  注册响应到达                    : ${reg.tResp} ms   状态 ${reg.status}   （请求耗时 ${reg.tResp - reg.tReq} ms）`);
} else {
  console.log('  ✘ 没有观察到 /api/auth/register 请求');
}
if (regBody) {
  console.log(`  注册响应体                      : code=${regBody.code ?? '?'} errmsg=${regBody.errmsg ?? '(无)'} token=${regBody?.data?.token ? '有' : '无'}`);
}
console.log(`  按钮停止转                      : ${marks.spinEnd ?? '-'} ms`);
console.log(`  跳离登录页                      : ${marks.nav ?? '-'} ms`);
console.log(`  提示信息                        : ${marks.msg ?? '(无)'}`);
console.log(`  结束 URL                        : ${marks.last?.href}`);

console.log('\n=== 本次点击前后发生的 XHR/Fetch ===');
net.filter((x) => x.tReq > clickAt - 2000).forEach((x) => {
  console.log(`  ${String(x.tReq).padStart(6)}ms → ${String(x.tResp ?? '-').padStart(6)}ms  ${x.status ?? ''}  ${x.url.replace('http://127.0.0.1:8080', '')}`);
});

// 主线程占用
const lt = JSON.parse(await evalJs('JSON.stringify(window.__lt || [])') || '[]');
const freezeFrom = reg?.tResp ?? clickAt;
const freezeTo = marks.nav ?? Date.now() - t0;
const inWindow = lt.filter((x) => x.d && x.s + x.d > freezeFrom && x.s < freezeTo);
const busy = inWindow.reduce((a, x) => a + x.d, 0);
console.log('\n=== 注册成功之后那段"卡住"的时间里，主线程在干嘛 ===');
console.log(`  窗口                     : ${freezeFrom} ms → ${freezeTo} ms（${freezeTo - freezeFrom} ms）`);
console.log(`  长任务数量               : ${inWindow.length} 个`);
console.log(`  长任务总占用             : ${busy} ms（占窗口 ${Math.round((busy / (freezeTo - freezeFrom)) * 100)}%）`);
console.log('  最长的 8 个长任务:');
inWindow.sort((a, b) => b.d - a.d).slice(0, 8).forEach((x) => {
  console.log(`    起 ${String(x.s).padStart(6)}ms  持续 ${String(x.d).padStart(5)}ms`);
});

// 这期间拉了多少模块、最慢的是哪些
const mods = [...byReqId.values()].filter(
  (r) => r.url && r.url.includes('127.0.0.1:8080') && !r.url.includes('/api/') && r.tReq >= freezeFrom && r.tReq <= freezeTo,
);
const withDur = mods.filter((r) => r.tResp != null).map((r) => ({ url: r.url, d: r.tResp - r.tReq }));
withDur.sort((a, b) => b.d - a.d);
console.log(`\n  这段窗口内又请求了 ${mods.length} 个前端模块`);
console.log('  最慢的 8 个模块请求:');
withDur.slice(0, 8).forEach((x) => {
  console.log(`    ${String(x.d).padStart(5)}ms  ${x.url.replace('http://127.0.0.1:8080', '')}`);
});

ws.close(); edge.kill(); await mongo.close(); process.exit(0);
