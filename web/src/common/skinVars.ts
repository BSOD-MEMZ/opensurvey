/**
 * 把问卷皮肤配置写进 CSS 变量（答题端 render/App.vue 与编辑器各预演面板共用一份，
 * 免得两边表现不一致）。
 *
 * 这里最关键的一条：**作者没设置背景时，页面那层"半透明白蒙层"要关掉**。
 *
 * 原来的问题是：skinConf.backgroundConf 默认是空的（color/type/image 都是 ''），
 * 但 render 端的 RenderPage / SuccessPage / ErrorPage 上都写着
 *   background: rgba(255, 255, 255, var(--opacity))
 * 而 contentConf.opacity 默认 100 → --opacity: 1 → 整页被一层不透明白盖住，
 * 底下的 pjsk 渐变三角全被蒙掉。
 *
 * 现在的规则：
 *   - 作者设了颜色/背景图 → 完全按作者来（尊重设置，蒙层透明度照旧取 contentConf.opacity）
 *   - 没设 → 走 pjsk 默认渐变背景，蒙层透明度置 0、页面底色置 transparent，让渐变直接透出来
 */

export interface ApplySkinVarsOptions {
  /**
   * 是否同时把 --primary-background-color 也写掉。
   * 编辑器里有个面板用它给预演区铺作者背景色，答题端则只用它当页面底色。
   */
  writePageColor?: boolean
}

export function applySkinVars(skinConf: any, options: ApplySkinVarsOptions = {}) {
  const { writePageColor = true } = options
  const root = document.documentElement
  const { themeConf, backgroundConf, contentConf } = skinConf || {}

  if (themeConf?.color) {
    root.style.setProperty('--primary-color', themeConf.color)
  }

  const { color, type, image } = backgroundConf || {}
  root.style.setProperty(
    '--primary-background',
    type === 'image' ? `url(${image}) no-repeat center / cover` : color || ''
  )

  const hasOwnBackground = Boolean(color) || (type === 'image' && Boolean(image))

  if (hasOwnBackground) {
    if (contentConf?.opacity != null) {
      root.style.setProperty('--opacity', `${contentConf.opacity / 100}`)
    }
    if (writePageColor) {
      root.style.removeProperty('--primary-background-color')
    }
  } else {
    // pjsk 默认背景：蒙层与页面底色都让开
    root.style.setProperty('--opacity', '0')
    if (writePageColor) {
      root.style.setProperty('--primary-background-color', 'transparent')
    }
  }
}
