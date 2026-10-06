/**
 * 自定义问卷 CSS 的安全过滤。
 *
 * 背景：问卷作者就是自己部署这套系统的人，所以样式本身给足控制权 ——
 * 选择器、伪类、CSS 变量、动画、@media 全都不拦。
 *
 * 唯一要拦住的是「让受访者浏览器向第三方发请求」的写法：
 *   · @import  —— 加载站外样式表，内容不可审计
 *   · url(http(s)://…)、url(//…) —— 典型的外链追踪像素
 * 这两类会泄露受访者 IP 与 Referer，和本项目「零广告零追踪」的定位直接冲突。
 * 本地相对路径（/imgs/...）与 data: 内联资源不受影响。
 *
 * 注意：这层过滤是在**渲染时**做的，数据库里仍保存作者写的原文，
 * 便于他回来继续编辑，不会被"洗"成看不懂的样子。
 */

/** 历史遗留的危险属性，现代浏览器基本无效，但顺手清掉不亏 */
const DANGEROUS_PROPS = [/behavior\s*:/gi, /-moz-binding\s*:/gi, /expression\s*\(/gi]

/** 外链 url()：协议相对、http、https 都算 */
const EXTERNAL_URL = /url\(\s*(['"]?)\s*(?:https?:)?\/\/[^)]*\)/gi

/**
 * 过滤自定义 CSS。
 * @param {string} css 作者填写的原文
 * @returns {string} 可安全注入 <style> 的 CSS
 */
export function sanitizeCustomCss(css) {
  if (!css || typeof css !== 'string') return ''

  let out = css
  // @import 会拉站外样式表
  out = out.replace(/@import\s+(?:url\()?[^;]*;?/gi, '')
  // 外链 url() 掏空
  out = out.replace(EXTERNAL_URL, 'url()')
  // 危险属性
  for (const re of DANGEROUS_PROPS) out = out.replace(re, '')
  // @charset 写在 <style> 里没有意义
  out = out.replace(/@charset[^;]*;?/gi, '')

  return out
}

/**
 * 把过滤后的 CSS 注入页面。用 textContent 而不是 innerHTML，
 * 所以哪怕作者写了 </style><script> 也只会被当成普通文本。
 * @param {string} css
 * @param {string} [id] style 标签的 id，重复调用会覆盖同一个标签
 */
export function injectCustomCss(css, id = 'opensurvey-custom-css') {
  if (typeof document === 'undefined') return
  const safe = sanitizeCustomCss(css)
  let el = document.getElementById(id)

  if (!safe.trim()) {
    if (el) el.textContent = ''
    return
  }

  if (!el) {
    el = document.createElement('style')
    el.id = id
    document.head.appendChild(el)
  }
  el.textContent = safe
}
