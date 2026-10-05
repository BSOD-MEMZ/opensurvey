// 生成 13 个题型缩略图 SVG（编辑器题库 hover 预览用）
// 设计语言与答题端/管理端一致：白底 + 青绿强调 + 深蓝紫灰字
// 用法: node docs/brand/gen-question-snapshots.mjs
import fs from 'node:fs';
import path from 'node:path';

const OUT = 'D:/Dev/OpenSurvey/web/public/imgs/question-type-snapshot';

const C = {
  ink: '#444466',
  ink2: '#5d5d80',
  bar: '#cfd4e2',
  barSoft: '#e3e7f0',
  line: '#e6e9f2',
  teal: '#77eedd',
  tealMid: '#5fd8c6',
  tealDeep: '#2fa596',
  tealPale: '#e4fcf8',
  pink: '#ff5599',
  white: '#ffffff',
};

const W = 132, H = 88;
const FONT = "system-ui, 'Segoe UI', 'Microsoft YaHei', sans-serif";

const bar = (x, y, w, h, rx, fill) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}"/>`;
const field = (x, y, w, h, rx = 5) =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${C.white}" stroke="${C.line}" stroke-width="1.2"/>`;

/** 表头：星号 + 序号标题（左）+ 题型胶囊（右对齐，避免中文字宽估算误差导致重叠） */
function header(title, chip, { titleSize = 9, chipSize = 8 } = {}) {
  const chipW = chip.length * 6.4 + 14;
  const chipX = W - 8 - chipW;
  return `<text x="7" y="15" font-family="${FONT}" font-size="7" fill="${C.pink}">*</text>
  <text x="13" y="15" font-family="${FONT}" font-size="${titleSize}" font-weight="700" fill="${C.ink}">1.&nbsp;${title}</text>
  ${bar(chipX, 5, chipW, 13, 6.5, C.tealPale)}
  <text x="${chipX + chipW / 2}" y="14.6" font-family="${FONT}" font-size="${chipSize}" font-weight="600"
        fill="${C.tealDeep}" text-anchor="middle">${chip}</text>`;
}

/** 一行选项：圆点/方框 + 占位条 */
function row(y, { checked = false, box = false, w = 54 } = {}) {
  const x = 16, r = 5.5;
  const mark = box
    ? `<rect x="${x - r}" y="${y - r}" width="${r * 2}" height="${r * 2}" rx="3"
         fill="${checked ? C.teal : C.white}" stroke="${checked ? C.teal : C.bar}" stroke-width="1.2"/>`
    : `<circle cx="${x}" cy="${y}" r="${r}"
         fill="${checked ? C.teal : C.white}" stroke="${checked ? C.teal : C.bar}" stroke-width="1.2"/>`;
  const tick = checked
    ? (box
      ? `<path d="M${x - 3} ${y} l2.2 2.4 4-4.6" fill="none" stroke="${C.ink}" stroke-width="1.6"
            stroke-linecap="round" stroke-linejoin="round"/>`
      : `<circle cx="${x}" cy="${y}" r="2.2" fill="${C.ink}"/>`)
    : '';
  return `${mark}${tick}
    ${bar(x + 11, y - 3, w, 6, 3, checked ? C.ink2 : C.barSoft)}`;
}

const bodies = {
  text: () => field(14, 26, 104, 17) + bar(22, 33, 42, 4.5, 2.2, C.barSoft),

  textarea: () => field(14, 26, 104, 46, 6) +
    bar(22, 34, 60, 4.5, 2.2, C.barSoft) +
    bar(22, 43, 80, 4.5, 2.2, C.barSoft) +
    bar(22, 52, 46, 4.5, 2.2, C.barSoft),

  radio: () => row(36) + row(52) + row(68, { checked: true }),

  checkbox: () => row(36, { box: true, checked: true }) + row(52, { box: true }) + row(68, { box: true }),

  'binary-choice': () => `
    <rect x="14" y="30" width="48" height="24" rx="12" fill="${C.tealPale}" stroke="${C.tealMid}" stroke-width="1.4"/>
    <text x="38" y="46" font-family="${FONT}" font-size="10" font-weight="700" fill="${C.tealDeep}" text-anchor="middle">对</text>
    <rect x="70" y="30" width="48" height="24" rx="12" fill="${C.white}" stroke="${C.line}" stroke-width="1.4"/>
    <text x="94" y="46" font-family="${FONT}" font-size="10" font-weight="700" fill="${C.ink2}" text-anchor="middle">错</text>
    ${bar(14, 64, 104, 9, 4.5, C.barSoft)}`,

  'radio-star': () => {
    let s = '';
    for (let i = 0; i < 5; i++) {
      const cx = 25 + i * 20.5, cy = 48, R = 8.5, r = 3.6;
      let d = '';
      for (let k = 0; k < 10; k++) {
        const ang = (Math.PI / 5) * k - Math.PI / 2;
        const rad = k % 2 ? r : R;
        d += `${k ? 'L' : 'M'}${(cx + rad * Math.cos(ang)).toFixed(2)} ${(cy + rad * Math.sin(ang)).toFixed(2)}`;
      }
      s += `<path d="${d}Z" fill="${i < 4 ? C.teal : C.white}" stroke="${i < 4 ? C.tealMid : C.bar}" stroke-width="1.1"/>`;
    }
    return s;
  },

  'radio-nps': () => {
    let s = '';
    for (let i = 0; i < 6; i++) {
      const x = 14 + i * 17.5, on = i === 4;
      s += `<rect x="${x}" y="28" width="14" height="14" rx="4" fill="${on ? C.teal : C.white}"
              stroke="${on ? C.tealMid : C.line}" stroke-width="1.1"/>
            ${bar(x + 4, 33.5, 6, 3, 1.5, on ? C.ink : C.barSoft)}`;
    }
    return s +
      `<text x="14" y="60" font-family="${FONT}" font-size="7" fill="${C.ink2}">完全不会</text>
       <text x="118" y="60" font-family="${FONT}" font-size="7" fill="${C.ink2}" text-anchor="end">一定会</text>
       ${bar(14, 66, 104, 5, 2.5, C.barSoft)}
       ${bar(14, 66, 52, 5, 2.5, C.teal)}`;
  },

  vote: () => `
    ${field(14, 30, 78, 16, 5)}${bar(22, 36, 34, 4.5, 2.2, C.barSoft)}
    ${bar(96, 30, 22, 16, 8, C.teal)}
    ${field(14, 52, 78, 16, 5)}${bar(22, 58, 44, 4.5, 2.2, C.barSoft)}
    <rect x="96" y="52" width="22" height="16" rx="8" fill="${C.white}" stroke="${C.line}" stroke-width="1.2"/>`,

  cascader: () => `
    ${field(14, 26, 104, 17)}
    ${bar(22, 33, 40, 4.5, 2.2, C.barSoft)}
    <path d="M104 32 l3.4 3.4 3.4-3.4" fill="none" stroke="${C.ink2}" stroke-width="1.4" stroke-linecap="round"/>
    ${field(14, 48, 104, 30, 6)}
    ${bar(20, 53, 92, 7, 3.5, C.tealPale)}
    ${bar(20, 64, 92, 6, 3, C.barSoft)}
    <circle cx="24" cy="67" r="2" fill="${C.tealDeep}"/>`,

  'matrix-radio': () => {
    let s = `<line x1="54" y1="26" x2="54" y2="80" stroke="${C.line}" stroke-width="1"/>
             <line x1="77" y1="26" x2="77" y2="80" stroke="${C.line}" stroke-width="1"/>
             <line x1="100" y1="26" x2="100" y2="80" stroke="${C.line}" stroke-width="1"/>`;
    for (let r = 0; r < 3; r++) {
      const y = 36 + r * 17;
      s += bar(14, y - 3, 32, 6, 3, C.barSoft);
      for (let c = 0; c < 3; c++) {
        const on = r === 1 && c === 2;
        const cx = 65.5 + c * 23;
        s += `<circle cx="${cx}" cy="${y}" r="5" fill="${on ? C.teal : C.white}"
                stroke="${on ? C.tealMid : C.bar}" stroke-width="1.1"/>`;
        if (on) s += `<circle cx="${cx}" cy="${y}" r="2" fill="${C.ink}"/>`;
      }
    }
    return s;
  },

  'matrix-scale': () => {
    let s = '';
    for (let r = 0; r < 3; r++) {
      const y = 36 + r * 17;
      s += bar(14, y - 3, 32, 6, 3, C.barSoft);
      for (let c = 0; c < 5; c++) {
        const x = 54 + c * 14, on = r === 1 && c === 3;
        s += `<rect x="${x}" y="${y - 6.5}" width="11" height="13" rx="4" fill="${on ? C.teal : C.white}"
                stroke="${on ? C.tealMid : C.line}" stroke-width="1"/>`;
      }
    }
    return s;
  },

  sort: () => {
    let s = '';
    for (let i = 0; i < 3; i++) {
      const y = 30 + i * 18;
      s += `<rect x="14" y="${y}" width="104" height="15" rx="5" fill="${C.white}" stroke="${C.line}" stroke-width="1.1"/>
            <circle cx="24" cy="${y + 7.5}" r="6" fill="${C.teal}"/>
            <text x="24" y="${y + 10.4}" font-family="${FONT}" font-size="8" font-weight="700"
                  fill="${C.ink}" text-anchor="middle">${i + 1}</text>
            ${bar(36, y + 4.5, i === 0 ? 42 : i === 1 ? 54 : 34, 6, 3, C.barSoft)}`;
    }
    return s;
  },

  slider: () => `
    ${bar(14, 46, 104, 5, 2.5, C.barSoft)}
    ${bar(14, 46, 62, 5, 2.5, C.teal)}
    <circle cx="76" cy="48.5" r="8" fill="${C.white}" stroke="${C.tealMid}" stroke-width="2"/>
    <text x="14" y="33" font-family="${FONT}" font-size="7.5" fill="${C.ink2}">0</text>
    <text x="118" y="33" font-family="${FONT}" font-size="7.5" fill="${C.tealDeep}" text-anchor="end">100</text>
    ${bar(58, 62, 36, 13, 6.5, C.tealPale)}
    <text x="76" y="71.6" font-family="${FONT}" font-size="8" font-weight="700" fill="${C.tealDeep}" text-anchor="middle">62</text>`,
};

const TYPES = [
  ['text', '单行输入框', '单行'],
  ['textarea', '多行输入框', '多行'],
  ['radio', '单项选择', '单选'],
  ['checkbox', '多项选择', '多选'],
  ['binary-choice', '判断题', '判断'],
  ['radio-star', '评分', '评分'],
  ['radio-nps', 'NPS 评分', 'NPS'],
  ['vote', '投票', '投票'],
  ['cascader', '多级联动', '联动'],
  ['matrix-radio', '矩阵单选', '矩阵单选', { titleSize: 8.5, chipSize: 7.2 }],
  ['matrix-scale', '矩阵量表', '矩阵量表', { titleSize: 8.5, chipSize: 7.2 }],
  ['sort', '排序', '排序'],
  ['slider', '滑块量表', '滑块'],
];

fs.mkdirSync(OUT, { recursive: true });
let n = 0;
for (const [type, title, chip, opt = {}] of TYPES) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="${title}示意">
  ${bar(0, 0, W, H, 0, C.white)}
  ${header(title, chip, opt)}
${bodies[type]()}
</svg>
`;
  fs.writeFileSync(path.join(OUT, `${type}.svg`), svg, 'utf8');
  n++;
  console.log(`${type}.svg`);
}
console.log(`共生成 ${n} 个题型缩略图`);
