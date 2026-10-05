/**
 * pjsk.moe 同款背景的形状生成器。
 *
 * 全部参数范围来自对 https://pjsk.moe/zh-cn/ 实测 DOM 的统计：
 * 该页 SSR 输出了 34 个形状（24 个三角形 + 10 个圆形，分 3 个视差层），
 * 逐个解析出位置 / 尺寸 / 颜色 / 透明度 / 形变后取的范围。
 * 原站是服务端随机生成的，所以每次刷新布局都不同 —— 这里同样随机，
 * 但把随机范围锁在实测区间内，保证观感一致。
 */

/** 实测配色（权重来自 34 个形状的实际分布 10 / 8 / 7 / 6 / 3） */
const COLORS = [
  { value: 'rgb(119, 238, 227)', weight: 10 }, // miku 亮青
  { value: 'rgb(255, 117, 168)', weight: 8 }, // comp 粉
  { value: '#ffffff', weight: 7 }, // 白
  { value: 'rgb(255, 229, 138)', weight: 6 }, // mid 黄
  { value: 'rgb(51, 204, 187)', weight: 3 } // miku 深青
]

/** 每层的形状数量与分布区域（实测值） */
export const LAYER_SPEC = [
  { layer: 1, triangles: 9, circles: 5, left: [0.2, 94.8], top: [33.7, 89.8] },
  { layer: 2, triangles: 8, circles: 4, left: [12.5, 87.5], top: [14.7, 98.9] },
  { layer: 3, triangles: 7, circles: 1, left: [7.1, 92.9], top: [2.6, 83.5] }
]

/** 三角形顶点（原站固定用这一个不规则三角形，靠形变产生多样性） */
export const TRIANGLE_POINTS = '10,0 0,100 100,85'

/**
 * 视差系数（实测）。
 * 在 pjsk.moe 上滚到 1399px 时：
 *   --bg-layer-1-y = -419.7px  → -0.300
 *   --bg-layer-2-y = -223.84px → -0.160
 *   --bg-layer-3-y = -97.93px  → -0.070
 *   --bg-base-y    = -48.965px → -0.035
 * 完全吻合，所以直接取这四个值。
 */
export const PARALLAX_RATES = { 1: -0.3, 2: -0.16, 3: -0.07, base: -0.035 }

/** mulberry32：小而稳的可复现伪随机 */
function rngFactory(seed) {
  let s = seed >>> 0
  return function next() {
    s = (s + 0x6d2b79f5) >>> 0
    let t = s
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const rand = (rnd, min, max) => min + rnd() * (max - min)

const TOTAL_WEIGHT = COLORS.reduce((sum, c) => sum + c.weight, 0)

function pickColor(rnd) {
  let hit = rnd() * TOTAL_WEIGHT
  for (const c of COLORS) {
    hit -= c.weight
    if (hit <= 0) return c.value
  }
  return COLORS[0].value
}

function makeTriangle(spec, rnd, id) {
  return {
    id,
    layer: spec.layer,
    type: 'triangle',
    left: rand(rnd, spec.left[0], spec.left[1]),
    top: rand(rnd, spec.top[0], spec.top[1]),
    size: rand(rnd, 26.14, 94.35),
    color: pickColor(rnd),
    // 实测 0.080~0.469，且低透明度占多数 —— 用幂函数让分布偏小
    opacity: 0.08 + Math.pow(rnd(), 1.6) * 0.39,
    // 非等比缩放 → 每个三角形形状都不一样
    sx: rand(rnd, 0.383, 0.521),
    sy: rand(rnd, 0.503, 0.815),
    skew: rand(rnd, -15.89, 17.48),
    rotate: rand(rnd, -40.29, 48.45),
    // 实测 11 实心 / 13 描边
    filled: rnd() < 11 / 24
  }
}

function makeCircle(spec, rnd, id) {
  return {
    id,
    layer: spec.layer,
    type: 'circle',
    left: rand(rnd, spec.left[0], spec.left[1]),
    top: rand(rnd, spec.top[0], spec.top[1]),
    size: rand(rnd, 6.74, 12.92),
    color: pickColor(rnd),
    opacity: rand(rnd, 0.106, 0.229)
  }
}

/**
 * 生成一整套背景形状。
 * @param {number} [seed] 传同一个 seed 会得到完全相同的布局（便于截图比对）
 * @returns {Array} 34 个形状描述
 */
export function createShapes(seed) {
  const rnd = rngFactory(seed == null ? Math.floor(Math.random() * 0xffffffff) : seed)
  const out = []
  let id = 0
  for (const spec of LAYER_SPEC) {
    // 顺序必须保持「先三角形后圆形」—— CSS 里的 nth-child 降级规则依赖它
    for (let i = 0; i < spec.triangles; i++) out.push(makeTriangle(spec, rnd, ++id))
    for (let i = 0; i < spec.circles; i++) out.push(makeCircle(spec, rnd, ++id))
  }
  return out
}
