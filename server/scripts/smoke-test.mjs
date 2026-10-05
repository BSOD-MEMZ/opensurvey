/**
 * OpenSurvey / XIAOJUSURVEY 端到端冒烟测试
 *
 * 覆盖：验证码 → 注册 → 登录 → 建问卷 → 建编辑会话 → 存题目 → 发布
 *       → 拉取答题端 schema → 匿名提交答卷 → 查询统计
 *
 * 用法：
 *   node scripts/smoke-test.mjs
 * 环境变量：
 *   BASE_URL   默认 http://127.0.0.1:3000
 *   MONGO_URL  内存版 MongoDB 连接串（`npm run local` 启动时会打印）
 *   DUMP_SCHEMA=1  额外打印默认问卷 schema，便于排查
 */
import { MongoClient, ObjectId } from 'mongodb';
import { createHash } from 'node:crypto';

const BASE_URL = process.env.BASE_URL || 'http://127.0.0.1:3000';
const MONGO_URL = process.env.MONGO_URL || 'mongodb://127.0.0.1:39133/';
const MONGO_DB = process.env.MONGO_DB || 'xiaojuSurvey';
const DUMP = process.env.DUMP_SCHEMA === '1';

/**
 * 复刻前端 web/src/render/api/base.js 的签名算法：
 *   sha256(排序后的 "key=value" 拼接 + ts) + "." + ts
 * 字符串走 encodeURIComponent，其余走 JSON.stringify。
 */
function computeSign(body) {
  const keys = Object.keys(body).filter((k) => k !== 'sign').sort();
  const parts = keys.map((k) => {
    const v = body[k];
    if (v === undefined) return `${k}=`;
    if (typeof v === 'string') return `${k}=${encodeURIComponent(v)}`;
    return `${k}=${JSON.stringify(v)}`;
  });
  const ts = Date.now();
  const digest = createHash('sha256').update(parts.join('') + ts).digest('hex');
  return `${digest}.${ts}`;
}

const results = [];
const log = (s) => process.stdout.write(s + '\n');
const green = (s) => `\x1b[32m${s}\x1b[0m`;
const red = (s) => `\x1b[31m${s}\x1b[0m`;

let n = 0;
function ok(name, detail = '') {
  n++;
  results.push({ n, name, ok: true, detail });
  log(`${green(`[${n}] ✔ ${name}`)}${detail ? '  ' + detail : ''}`);
}
function bad(name, detail = '') {
  n++;
  results.push({ n, name, ok: false, detail });
  log(`${red(`[${n}] ✘ ${name}`)}  ${detail}`);
}

async function api(method, path, { body, token } = {}) {
  const headers = {};
  if (body) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(BASE_URL + path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    redirect: 'manual',
  });
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch { /* 非 JSON */ }
  return { status: res.status, json, text };
}

/** 深度优先找出第一个匹配键的标量值 */
function pick(obj, keys) {
  const seen = new Set();
  const queue = [obj];
  while (queue.length) {
    const cur = queue.shift();
    if (!cur || typeof cur !== 'object' || seen.has(cur)) continue;
    seen.add(cur);
    for (const [k, v] of Object.entries(cur)) {
      if (keys.includes(k) && v !== null && v !== undefined && typeof v !== 'object') return v;
      if (v && typeof v === 'object') queue.push(v);
    }
  }
  return undefined;
}

let mongoClient = null;
async function mongo() {
  if (!mongoClient) {
    mongoClient = new MongoClient(MONGO_URL);
    await mongoClient.connect();
  }
  return mongoClient.db(MONGO_DB);
}

async function freshCaptcha() {
  const r = await api('POST', '/api/auth/captcha', { body: {} });
  const id = pick(r.json, ['id', 'captchaId']);
  if (!id) throw new Error('验证码接口未返回 id：' + r.text.slice(0, 160));
  const db = await mongo();
  let oid;
  try { oid = new ObjectId(id); } catch { oid = id; }
  const doc = await db.collection('captcha').findOne({ _id: oid });
  if (!doc?.text) throw new Error('未从 MongoDB 读到验证码明文（检查 MONGO_URL）');
  return { id, text: doc.text };
}

/* ---------- 题目构造：字段与 materials/questions/widgets 下各 meta.js 对齐 ---------- */
function makeOptions(texts, suffix) {
  return texts.map((text, i) => ({
    text,
    others: false,
    mustOthers: false,
    othersKey: '',
    placeholderDesc: '',
    hash: `${suffix}${i + 1}`,
  }));
}

function buildQuestions(suffix) {
  const base = { isRequired: true, showIndex: true, showType: true, showSpliter: true };
  return [
    {
      ...base,
      field: `q_radio_${suffix}`,
      type: 'radio',
      title: '你的职业是？',
      options: makeOptions(['学生', '上班族', '自由职业', '其他'], `r${suffix}`),
      layout: 'vertical',
      quotaDisplay: true,
    },
    {
      ...base,
      isRequired: false,
      field: `q_checkbox_${suffix}`,
      type: 'checkbox',
      title: '你常用的设备有哪些？',
      options: makeOptions(['手机', '电脑', '平板'], `c${suffix}`),
      layout: 'vertical',
      quotaDisplay: true,
    },
    {
      ...base,
      isRequired: false,
      field: `q_text_${suffix}`,
      type: 'text',
      title: '你的称呼是？',
      options: [],
    },
    {
      ...base,
      field: `q_textarea_${suffix}`,
      type: 'textarea',
      title: '还有什么想告诉我们的？',
      options: [],
    },
  ];
}

async function main() {
  log('='.repeat(66));
  log('OpenSurvey 端到端冒烟测试');
  log(`  BASE_URL  = ${BASE_URL}`);
  log(`  MONGO_URL = ${MONGO_URL}`);
  log('='.repeat(66));

  const suffix = Math.random().toString(36).slice(2, 8);
  const username = `smoke_${suffix}`;
  const password = 'Test1234!';

  /* 1. 验证码 */
  let cap;
  try {
    cap = await freshCaptcha();
    ok('获取验证码并直读明文', `text=${cap.text}（验证验证码服务与 DB 通路）`);
  } catch (e) {
    bad('获取验证码', e.message);
    return finish();
  }

  /* 2. 注册 */
  try {
    const r = await api('POST', '/api/auth/register', {
      body: { username, password, captchaId: cap.id, captcha: cap.text },
    });
    if (r.json?.code === 200) ok('注册新用户', `username=${username}`);
    else bad('注册新用户', r.text.slice(0, 200));
  } catch (e) { bad('注册新用户', e.message); }

  /* 3. 登录 */
  let token;
  try {
    cap = await freshCaptcha();
    const r = await api('POST', '/api/auth/login', {
      body: { username, password, captchaId: cap.id, captcha: cap.text },
    });
    token = pick(r.json, ['token', 'accessToken']);
    if (token) ok('登录并取得 JWT', `token=${String(token).slice(0, 28)}…`);
    else bad('登录', r.text.slice(0, 300));
  } catch (e) { bad('登录', e.message); }
  if (!token) return finish();

  /* 4. 创建问卷 */
  let surveyId;
  try {
    const r = await api('POST', '/api/survey/createSurvey', {
      body: {
        title: `冒烟测试问卷 ${suffix}`,
        remark: '由自动化冒烟测试创建',
        surveyType: 'normal',
        createMethod: null,
        createFrom: null,
        workspaceId: null,
        groupId: null,
        questionList: buildQuestions(suffix),
      },
      token,
    });
    surveyId = pick(r.json, ['id', 'surveyId', 'surveyPath']);
    if (r.json?.code === 200 && surveyId) ok('创建问卷', `surveyId=${surveyId}`);
    else bad('创建问卷', r.text.slice(0, 300));
  } catch (e) { bad('创建问卷', e.message); }
  if (!surveyId) return finish();

  /* 5. 编辑会话（必须建在问卷之后） */
  let sessionId;
  try {
    const r = await api('POST', '/api/session/create', { body: { surveyId }, token });
    sessionId = pick(r.json, ['sessionId']);
    if (sessionId) ok('创建协同编辑会话', `sessionId=${String(sessionId).slice(0, 10)}…`);
    else bad('创建编辑会话', r.text.slice(0, 300));
  } catch (e) { bad('创建编辑会话', e.message); }

  /* 6. 读取默认 schema（决定后续字段形状） */
  let conf = null;
  let surveyPath = null;
  try {
    const r = await api('GET', `/api/survey/getSurvey?surveyId=${surveyId}`, { token });
    conf = r.json?.data?.surveyConfRes?.code ?? null;
    surveyPath = r.json?.data?.surveyMetaRes?.surveyPath ?? null;
    const cnt = conf?.dataConf?.dataList?.length ?? 0;
    if (conf) ok('读取问卷配置', `dataList=${cnt} 道题；surveyPath=${surveyPath}`);
    else bad('读取问卷配置', r.text.slice(0, 300));
  } catch (e) { bad('读取问卷配置', e.message); }

  if (DUMP && conf) {
    log('\n----- 默认 schema 结构（截断） -----');
    log(JSON.stringify(conf, null, 2).slice(0, 4000));
    log('----- end -----\n');
  }

  /* 7. 保存题目 */
  if (sessionId && conf) {
    try {
      const questions = buildQuestions(suffix);
      conf.dataConf = { dataList: questions };
      conf.pageConf = [questions.length];
      const r = await api('POST', '/api/survey/updateConf', {
        body: { surveyId, sessionId, configData: conf },
        token,
      });
      if (r.json?.code === 200) ok('保存问卷题目', `${questions.length} 道题（单选/多选/单行/多行）`);
      else bad('保存问卷题目', r.text.slice(0, 400));
    } catch (e) { bad('保存问卷题目', e.message); }
  } else {
    bad('保存问卷题目', '前置步骤缺失（会话或配置未取到）');
  }

  /* 8. 发布 */
  try {
    const r = await api('POST', '/api/survey/publishSurvey', { body: { surveyId }, token });
    if (r.json?.code === 200) ok('发布问卷', `surveyPath=${surveyPath}`);
    else bad('发布问卷', r.text.slice(0, 400));
  } catch (e) { bad('发布问卷', e.message); }

  /* 9. 答题端 schema */
  let schema = null;
  if (surveyPath) {
    try {
      const r = await api('GET', `/api/responseSchema/getSchema?surveyPath=${encodeURIComponent(surveyPath)}`);
      schema = r.json?.data?.code ?? null;
      const cnt = schema?.dataConf?.dataList?.length ?? 0;
      if (r.json?.code === 200) ok('拉取答题端 schema', `${cnt} 道题可渲染`);
      else bad('拉取答题端 schema', r.text.slice(0, 300));
    } catch (e) { bad('拉取答题端 schema', e.message); }
  }

  /* 10. 匿名提交答卷 */
  if (surveyPath && schema?.dataConf?.dataList) {
    try {
      const formValues = {};
      for (const q of schema.dataConf.dataList) {
        const key = q.field ?? q.id;
        if (q.type === 'radio') formValues[key] = q.options?.[0]?.text ?? q.options?.[0]?.value ?? '学生';
        else if (q.type === 'checkbox') formValues[key] = [q.options?.[0]?.text ?? q.options?.[0]?.value ?? '手机'];
        else if (q.type === 'text') formValues[key] = '冒烟测试';
        else if (q.type === 'textarea') formValues[key] = '这是一条自动化提交的文本回答。';
        else formValues[key] = q.options?.[0]?.text ?? 'x';
      }
      const body = {
        surveyPath,
        data: JSON.stringify(formValues),
        diffTime: 1000,
        clientTime: Date.now(),
        password: null,
        whitelist: null,
      };
      body.sign = computeSign(body);
      const r = await api('POST', '/api/surveyResponse/createResponse', { body });
      if (r.json?.code === 200) ok('匿名提交答卷', `${Object.keys(formValues).length} 个答案字段`);
      else bad('匿名提交答卷', r.text.slice(0, 400));
    } catch (e) { bad('匿名提交答卷', e.message); }
  } else {
    bad('匿名提交答卷', '未取得 surveyPath 或 schema');
  }

  /* 11. 统计 */
  try {
    const r = await api('GET', `/api/survey/dataStatistic/aggregationStatis?surveyId=${surveyId}`, { token });
    if (r.json?.code === 200) ok('分题统计接口', `返回字段：${Object.keys(r.json.data || {}).join(',')}`);
    else bad('分题统计接口', r.text.slice(0, 300));
  } catch (e) { bad('分题统计接口', e.message); }

  /* 12. 回收数据表 */
  try {
    const r = await api('GET', `/api/survey/dataStatistic/dataTable?surveyId=${surveyId}`, { token });
    if (r.json?.code === 200) ok('回收数据表接口', `total=${pick(r.json, ['total', 'count']) ?? 'n/a'}`);
    else bad('回收数据表接口', r.text.slice(0, 300));
  } catch (e) { bad('回收数据表接口', e.message); }

  return finish();
}

function finish() {
  const passed = results.filter((r) => r.ok).length;
  const total = results.length;
  log('\n' + '='.repeat(66));
  log(`冒烟测试结果：${passed}/${total} 项通过`);
  if (passed < total) {
    log('\n未通过项：');
    results.filter((r) => !r.ok).forEach((r) => log(`  [${r.n}] ${r.name} → ${r.detail}`));
  }
  log('='.repeat(66));
  if (mongoClient) mongoClient.close().catch(() => {});
  process.exit(passed === total ? 0 : 1);
}

main().catch((e) => {
  console.error('冒烟测试异常终止：', e);
  finish();
});
