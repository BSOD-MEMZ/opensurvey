/**
 * OpenSurvey / OPENSURVEY 端到端冒烟测试
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
const MONGO_DB = process.env.MONGO_DB || 'opensurvey';
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

function makeRows(texts, suffix) {
  return texts.map((text, i) => ({ text, hash: `${suffix}${i + 1}` }));
}

function buildQuestions(suffix) {
  const base = { isRequired: true, showIndex: true, showType: true, showSpliter: true };
  const questions = [
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
    {
      ...base,
      field: `q_matrix_radio_${suffix}`,
      type: 'matrix-radio',
      title: '请对以下方面做出评价',
      options: makeOptions(['非常满意', '满意', '一般', '不满意'], `mr${suffix}`),
      matrixRows: makeRows(['整体体验', '功能完整性', '操作便捷性'], `mrw${suffix}`),
    },
    {
      ...base,
      field: `q_matrix_scale_${suffix}`,
      type: 'matrix-scale',
      title: '请按 1-5 分为以下方面打分',
      matrixRows: makeRows(['产品功能', '页面设计'], `msw${suffix}`),
      scaleMax: 5,
      scaleMinLabel: '很不满意',
      scaleMaxLabel: '很满意',
    },
    {
      ...base,
      isRequired: false,
      field: `q_sort_${suffix}`,
      type: 'sort',
      title: '请按重要性从高到低排序',
      options: makeOptions(['价格', '质量', '服务'], `so${suffix}`),
    },
    {
      ...base,
      isRequired: false,
      field: `q_slider_${suffix}`,
      type: 'slider',
      title: '你有多大可能推荐给朋友？',
      sliderMin: 0,
      sliderMax: 100,
      sliderStep: 1,
      sliderMinLabel: '完全不会',
      sliderMaxLabel: '一定会',
    },
    /* ---------- 第二批题型（对齐问卷星） ---------- */
    {
      ...base,
      field: `q_date_${suffix}`,
      type: 'date',
      title: '请选择日期',
      dateRange: false,
      options: [],
    },
    {
      ...base,
      field: `q_time_${suffix}`,
      type: 'time',
      title: '请选择时间',
      timeRange: false,
      timeStep: 60,
      options: [],
    },
    {
      ...base,
      field: `q_select_${suffix}`,
      type: 'select',
      title: '请选择所在城市',
      options: makeOptions(['北京', '上海', '广州'], `se${suffix}`),
    },
    {
      ...base,
      isRequired: false,
      field: `q_upload_${suffix}`,
      type: 'upload',
      title: '请上传一张截图',
      uploadType: 'image',
      fileCount: 1,
      fileMaxSize: 5,
      fileAccept: '',
      options: [],
    },
    {
      ...base,
      field: `q_multifill_${suffix}`,
      type: 'multi-fill',
      title: '请填写联系信息',
      fillBlanks: makeRows(['姓名', '联系电话'], `mf${suffix}`),
      layout: 'vertical',
      blankPlaceholder: '请填写',
      options: [],
    },
    {
      ...base,
      field: `q_imageradio_${suffix}`,
      type: 'image-radio',
      title: '请选择你偏好的配色',
      options: [
        { text: '青绿', image: '/imgs/skin/17e06b7604a007e1d3e1453b9ddadc3c.webp', others: false, mustOthers: false, othersKey: '', placeholderDesc: '', hash: `ir${suffix}1` },
        { text: '暖阳', image: '/imgs/skin/145gBCRtNP1558514861211.webp', others: false, mustOthers: false, othersKey: '', placeholderDesc: '', hash: `ir${suffix}2` },
      ],
      columns: 2,
      showOptionText: true,
    },
    {
      ...base,
      isRequired: false,
      field: `q_imagecheckbox_${suffix}`,
      type: 'image-checkbox',
      title: '以下图片你感兴趣的有（可多选）',
      options: [
        { text: '风景', image: '/imgs/skin/3ABKqvDaVn1558514860472.webp', others: false, mustOthers: false, othersKey: '', placeholderDesc: '', hash: `ic${suffix}1` },
        { text: '美食', image: '/imgs/skin/4aWi5JxG471558514268698.webp', others: false, mustOthers: false, othersKey: '', placeholderDesc: '', hash: `ic${suffix}2` },
      ],
      columns: 2,
      showOptionText: true,
    },
    {
      ...base,
      field: `q_proportion_${suffix}`,
      type: 'proportion',
      title: '请为下列因素分配比重（合计 100%）',
      options: makeOptions(['价格', '质量', '服务'], `pr${suffix}`),
      total: 100,
    },
    {
      ...base,
      field: `q_matrixcheckbox_${suffix}`,
      type: 'matrix-checkbox',
      title: '以下功能分别具备哪些特点？',
      options: makeOptions(['易用', '高效', '稳定'], `mcb${suffix}`),
      matrixRows: makeRows(['功能A', '功能B'], `mcbw${suffix}`),
      minNum: '',
    },
    {
      ...base,
      isRequired: false,
      field: `q_matrixinput_${suffix}`,
      type: 'matrix-input',
      title: '请按行列填写使用时长',
      options: makeOptions(['工作日', '周末'], `min${suffix}`),
      matrixRows: makeRows(['上午', '下午'], `minw${suffix}`),
      matrixPlaceholder: '小时',
    },
    {
      ...base,
      isRequired: false,
      field: `q_section_${suffix}`,
      type: 'section',
      title: '说明',
      desc: '<p>以下问题用于了解你的使用习惯。</p>',
      options: [],
    },
    {
      ...base,
      isRequired: false,
      field: `q_calc_${suffix}`,
      type: 'calculation',
      title: '推荐意愿得分（自动计算）',
      calcFields: [],
      calcFormula: 'Q1 * 2',
      calcPrecision: 0,
      calcUnit: '分',
      calcVisible: true,
      options: [],
    },
  ];

  // 计算题引用滑块题，保证参与计算的是真实存在的字段
  questions.forEach((item) => {
    delete item.__calcRefType;
  });

  // 题目 field 必须形如 dataN —— 项目自身就是用 data{num} 命名的，
  // 服务端的数据表/导出转换只处理以 data 开头的字段。
  questions.forEach((question, index) => {
    question.field = `data${index + 1}`;
  });

  // 计算题引用的字段要等归一化之后才是最终 field
  const sliderQuestion = questions.find((item) => item.type === 'slider');
  const calcQuestionFinal = questions.find((item) => item.type === 'calculation');
  if (calcQuestionFinal) {
    delete calcQuestionFinal.__calcRefType;
    if (sliderQuestion) {
      calcQuestionFinal.calcFields = [{ field: sliderQuestion.field, label: '推荐可能性' }];
    }
  }

  return questions;
}

async function main() {
  log('='.repeat(66));
  log('OpenSurvey 端到端冒烟测试');
  log(`  BASE_URL  = ${BASE_URL}`);
  log(`  MONGO_URL = ${MONGO_URL}`);
  log('='.repeat(66));

  const suffix = Math.random().toString(36).slice(2, 8);
  // 允许固定账号，便于用浏览器登录同一账号做人工/截图验收
  const username = process.env.SMOKE_USER || 'smoke_' + suffix;
  const password = process.env.SMOKE_PASS || 'Test1234!';

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
    else if (/已存在|exist/i.test(r.text)) ok('注册新用户', `username=${username} 已存在，跳过（复用固定账号）`);
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

  /* 4. 建一个分组，问卷挂在分组下（否则管理端列表页看不到 —— 列表按 groupId 过滤） */
  let groupId = null;
  try {
    const r = await api('POST', '/api/surveyGroup', { body: { name: `演示分组 ${suffix}` }, token });
    groupId = r.json?.data?.id ?? null;
    if (groupId) ok('创建分组', `groupId=${groupId}`);
    else bad('创建分组', r.text.slice(0, 300));
  } catch (e) { bad('创建分组', e.message); }

  /* 5. 创建问卷 */
  let surveyId;
  try {
    const r = await api('POST', '/api/survey/createSurvey', {
      body: {
        title: `冒烟测试问卷 ${suffix}`,
        remark: '由自动化冒烟测试创建',
        surveyType: 'normal',
        createMethod: null,
        createFrom: null,
        // 不要显式传 workspaceId: null —— 列表接口对个人空间的判定是
        // `workspaceId` 字段必须「不存在」，写成 null 会让问卷在管理端列表里查不到
        groupId,
        questionList: buildQuestions(suffix),
      },
      token,
    });
    surveyId = pick(r.json, ['id', 'surveyId', 'surveyPath']);
    if (r.json?.code === 200 && surveyId) ok('创建问卷', `surveyId=${surveyId}`);
    else bad('创建问卷', r.text.slice(0, 300));
  } catch (e) { bad('创建问卷', e.message); }
  if (!surveyId) return finish();

  /* 6. 编辑会话（必须建在问卷之后） */
  let sessionId;
  try {
    const r = await api('POST', '/api/session/create', { body: { surveyId }, token });
    sessionId = pick(r.json, ['sessionId']);
    if (sessionId) ok('创建协同编辑会话', `sessionId=${String(sessionId).slice(0, 10)}…`);
    else bad('创建编辑会话', r.text.slice(0, 300));
  } catch (e) { bad('创建编辑会话', e.message); }

  /* 7. 读取默认 schema（决定后续字段形状） */
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

  /* 8. 保存题目 */
  if (sessionId && conf) {
    try {
      const questions = buildQuestions(suffix);
      conf.dataConf = { dataList: questions };
      conf.pageConf = [questions.length];
      const r = await api('POST', '/api/survey/updateConf', {
        body: { surveyId, sessionId, configData: conf },
        token,
      });
      if (r.json?.code === 200) ok("保存问卷题目", `${questions.length} 道题（含矩阵/排序/滑块）`);
      else bad('保存问卷题目', r.text.slice(0, 400));
    } catch (e) { bad('保存问卷题目', e.message); }
  } else {
    bad('保存问卷题目', '前置步骤缺失（会话或配置未取到）');
  }

  /* 9. 发布 */
  try {
    const r = await api('POST', '/api/survey/publishSurvey', { body: { surveyId }, token });
    if (r.json?.code === 200) ok('发布问卷', `surveyPath=${surveyPath}`);
    else bad('发布问卷', r.text.slice(0, 400));
  } catch (e) { bad('发布问卷', e.message); }

  /* 10. 答题端 schema */
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

  /* 11. 匿名提交答卷 */
  if (surveyPath && schema?.dataConf?.dataList) {
    try {
      const formValues = {};
      for (const q of schema.dataConf.dataList) {
        const key = q.field ?? q.id;
        // 注意：选项类题目提交的是选项 hash，不是文案（服务端会校验 hash 是否存在）
        if (q.type === 'radio') formValues[key] = q.options?.[0]?.hash ?? '';
        else if (q.type === 'checkbox') formValues[key] = q.options?.[0]?.hash ? [q.options[0].hash] : [];
        else if (q.type === 'text') formValues[key] = '冒烟测试';
        else if (q.type === 'textarea') formValues[key] = '这是一条自动化提交的文本回答。';
        // 矩阵题：{ 行hash: 列hash }，必填要求每行都有值
        else if (q.type === 'matrix-radio') {
          const picked = {};
          for (const row of q.matrixRows || []) picked[row.hash] = q.options?.[1]?.hash ?? q.options?.[0]?.hash;
          formValues[key] = picked;
        } else if (q.type === 'matrix-scale') {
          const picked = {};
          for (const row of q.matrixRows || []) picked[row.hash] = 'scale_3';
          formValues[key] = picked;
        } else if (q.type === 'sort') {
          formValues[key] = (q.options || []).map((o) => o.hash).reverse();
        } else if (q.type === 'slider') {
          formValues[key] = 80;
        } else if (q.type === 'date') {
          formValues[key] = '2026-10-01';
        } else if (q.type === 'time') {
          formValues[key] = '09:30';
        } else if (q.type === 'select') {
          formValues[key] = q.options?.[1]?.hash ?? q.options?.[0]?.hash ?? '';
        } else if (q.type === 'upload') {
          formValues[key] = '/imgs/favicon.ico';
        } else if (q.type === 'multi-fill') {
          const filled = {};
          for (const blank of q.fillBlanks || []) filled[blank.hash] = `填-${blank.text}`;
          formValues[key] = filled;
        } else if (q.type === 'image-radio') {
          formValues[key] = q.options?.[0]?.hash ?? '';
        } else if (q.type === 'image-checkbox') {
          formValues[key] = q.options?.[0]?.hash ? [q.options[0].hash] : [];
        } else if (q.type === 'proportion') {
          // 各项之和必须等于 total(100)，必填的校验会检查这一点
          const options = q.options || [];
          const each = options.length ? Math.floor(100 / options.length) : 0;
          const allocated = {};
          options.forEach((option, index) => {
            allocated[option.hash] = index === options.length - 1 ? 100 - each * (options.length - 1) : each;
          });
          formValues[key] = allocated;
        } else if (q.type === 'matrix-checkbox') {
          const picked = {};
          for (const row of q.matrixRows || []) {
            picked[row.hash] = [q.options?.[0]?.hash, q.options?.[1]?.hash].filter(Boolean);
          }
          formValues[key] = picked;
        } else if (q.type === 'matrix-input') {
          const filled = {};
          for (const row of q.matrixRows || []) {
            const cells = {};
            for (const col of q.options || []) cells[col.hash] = '2';
            filled[row.hash] = cells;
          }
          formValues[key] = filled;
        } else if (q.type === 'section') {
          // 说明题不产生答案
          continue;
        } else if (q.type === 'calculation') {
          // 计算题由前端算好后当普通答案提交；这里手工按公式算一遍
          formValues[key] = 160;
        } else formValues[key] = q.options?.[0]?.hash ?? 'x';
      }
      const body = {
        surveyPath,
        // 直接传对象。传 JSON 字符串的话服务端不会二次解析（JSON.parse(JSON.stringify(str)) 仍然是字符串），
        // 数据表/导出会拿到字符串而无法还原选项文案。
        // 真实前端在 DATA_ENCRYPT_TYPE=rsa 时传的是加密数组，服务端解密后同样是对象。
        data: formValues,
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

  /* 12. 统计 */
  try {
    const r = await api('GET', `/api/survey/dataStatistic/aggregationStatis?surveyId=${surveyId}`, { token });
    if (r.json?.code === 200) ok('分题统计接口', `返回字段：${Object.keys(r.json.data || {}).join(',')}`);
    else bad('分题统计接口', r.text.slice(0, 300));
  } catch (e) { bad('分题统计接口', e.message); }

  /* 13. 回收数据表 + 校验矩阵题已还原成可读文案 */
  try {
    const r = await api('GET', `/api/survey/dataStatistic/dataTable?surveyId=${surveyId}&isMasked=false`, { token });
    if (r.json?.code === 200) {
      ok('回收数据表接口', `total=${pick(r.json, ['total', 'count']) ?? 'n/a'}`);
      const body = r.json.data?.listBody?.[0] || r.json.data?.list?.[0] || {};
      const head = r.json.data?.listHead || [];
      const fieldOfType = (t) => head.find((item) => item.type === t)?.field;
      if (process.env.DEBUG_DUMP === '1') {
        log('  [debug] typeof body = ' + typeof body + ' / isArray=' + Array.isArray(body));
        log('  [debug] body 前 160 字符 = ' + JSON.stringify(body).slice(0, 160));
        log('  [debug] head fields = ' + head.map((h) => h.field + ':' + h.type).join(' | '));
      }

      const matrixField = fieldOfType('matrix-radio');
      if (matrixField && matrixField in body) {
        const val = body[matrixField];
        const readable = typeof val === 'string' && val.includes('：') && !val.includes('[object');
        if (readable) ok('矩阵题数据已还原为可读文案', String(val).slice(0, 70) + '…');
        else bad('矩阵题数据文案', `值不理想：${JSON.stringify(val).slice(0, 140)}`);
      } else {
        bad('矩阵题数据文案', `数据表里没有 matrix-radio 字段（head=${JSON.stringify(head.map((h) => h.type))}）`);
      }

      const sortField = fieldOfType('sort');
      if (sortField && sortField in body) ok('排序题数据', String(body[sortField]).slice(0, 70));
      else bad('排序题数据', '数据表里没有 sort 字段');

      const sliderField = fieldOfType('slider');
      if (sliderField && sliderField in body) ok('滑块题数据', String(body[sliderField]).slice(0, 40));
      else bad('滑块题数据', '数据表里没有 slider 字段');

      /* 新增题型：值为对象的必须还原成可读文案，标量的原样保留 */
      const objectChecks = [
        ['multi-fill', '多项填空'],
        ['proportion', '比重题'],
        ['matrix-checkbox', '矩阵多选'],
        ['matrix-input', '矩阵填空'],
      ];
      for (const [type, label] of objectChecks) {
        const field = fieldOfType(type);
        if (!field || !(field in body)) {
          bad(`${label}数据文案`, `数据表里没有 ${type} 字段`);
          continue;
        }
        const val = body[field];
        const readable = typeof val === 'string' && val.includes('：') && !val.includes('[object');
        if (readable) ok(`${label}数据已还原为可读文案`, String(val).slice(0, 70) + '…');
        else bad(`${label}数据文案`, `值不理想：${JSON.stringify(val).slice(0, 140)}`);
      }

      const scalarChecks = [
        ['date', '日期', '2026-10-01'],
        ['time', '时间', '09:30'],
        ['upload', '文件上传', null],
        ['calculation', '计算题', null],
      ];
      for (const [type, label, expected] of scalarChecks) {
        const field = fieldOfType(type);
        if (!field || !(field in body)) {
          bad(`${label}数据`, `数据表里没有 ${type} 字段`);
          continue;
        }
        const val = String(body[field]);
        if (expected && val !== expected) bad(`${label}数据`, `期望 ${expected}，实际 ${val}`);
        else ok(`${label}数据`, val.slice(0, 50));
      }

      const selectField = fieldOfType('select');
      if (selectField && selectField in body) {
        const val = String(body[selectField]);
        // 下拉题提交 hash，数据表应还原成选项文案
        if (val && !/^[a-z0-9]{4,}$/i.test(val)) ok('下拉选择数据已还原为文案', val);
        else bad('下拉选择数据', `疑似没还原：${val}`);
      } else {
        bad('下拉选择数据', '数据表里没有 select 字段');
      }

      const imageField = fieldOfType('image-radio');
      if (imageField && imageField in body) ok('图片单选数据已还原为文案', String(body[imageField]).slice(0, 40));
      else bad('图片单选数据', '数据表里没有 image-radio 字段');

      // 说明题不应出现在数据表里
      if (fieldOfType('section')) bad('段落说明不应产生答案', '但数据表里出现了 section 字段');
      else ok('段落说明不产生答案', '数据表里没有 section 字段');
    } else {
      bad('回收数据表接口', r.text.slice(0, 300));
    }
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
