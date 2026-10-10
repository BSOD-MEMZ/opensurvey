/**
 * 逐步计时：验证码 → 密码强度 → 注册 → 登录
 * 用法: MONGO_URL=mongodb://127.0.0.1:17385/ node scripts/perf-register.mjs
 */
import { MongoClient, ObjectId } from 'mongodb';

const BASE_URL = process.env.BASE_URL || 'http://127.0.0.1:3000';
const MONGO_URL = process.env.MONGO_URL || 'mongodb://127.0.0.1:17385/';
const MONGO_DB = process.env.MONGO_DB || 'opensurvey';

const client = new MongoClient(MONGO_URL);
await client.connect();
const db = client.db(MONGO_DB);

async function timed(label, fn) {
  const t = Date.now();
  try {
    const v = await fn();
    console.log(`  ${String(Date.now() - t).padStart(6)} ms  ${label}`);
    return v;
  } catch (e) {
    console.log(`  ${String(Date.now() - t).padStart(6)} ms  ${label}  ✘ ${e.message}`);
    return null;
  }
}

async function post(path, body, token) {
  const headers = {};
  if (body) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(BASE_URL + path, {
    method: 'POST', headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch {}
  return { status: res.status, json, text };
}

async function freshCaptcha() {
  const r = await post('/api/auth/captcha', {});
  const id = r.json?.data?.id || r.json?.data?.captchaId;
  if (!id) throw new Error('无 id: ' + r.text.slice(0, 120));
  const doc = await db.collection('captcha').findOne({ _id: new ObjectId(id) });
  if (!doc?.text) throw new Error('未从 MongoDB 读到验证码明文');
  return { id, text: doc.text };
}

const username = 'perf' + Date.now().toString().slice(-8);
const password = 'Perf123456';

console.log('\n=== 注册链路逐步耗时（每次都是全新请求）===\n');
console.log('【第一次：冷路径，前端实际会遇到的就是这一次】');
const cap1 = await timed('POST /api/auth/captcha         取验证码', () => freshCaptcha());
await timed('GET  /api/auth/password/strength 密码强度校验', () =>
  fetch(`${BASE_URL}/api/auth/password/strength?password=${password}`).then((r) => r.text()));

let t = Date.now();
const reg1 = await timed('POST /api/auth/register        注册', () =>
  post('/api/auth/register', {
    username, password, captchaId: cap1.id, captcha: cap1.text,
  }));
console.log(`         ↳ 返回: code=${reg1?.json?.code} ${reg1?.json?.errmsg || ''}`);
console.log(`         合计（校验+注册）: ${Date.now() - t} ms`);

console.log('\n【第二次：同一账号再走一遍，用于对比】');
const cap2 = await timed('POST /api/auth/captcha', () => freshCaptcha());
await timed('POST /api/auth/register        重复注册', () =>
  post('/api/auth/register', { username, password, captchaId: cap2.id, captcha: cap2.text }));

console.log('\n【登录】');
const cap3 = await timed('POST /api/auth/captcha', () => freshCaptcha());
const login = await timed('POST /api/auth/login', () =>
  post('/api/auth/login', { username, password, captchaId: cap3.id, captcha: cap3.text }));
console.log(`         ↳ code=${login?.json?.code}`);

console.log('\n【服务端纯粹的代价：连续 5 次取验证码】');
for (let i = 0; i < 5; i++) {
  await timed(`  第 ${i + 1} 次 captcha`, () => freshCaptcha());
}

await client.close();
