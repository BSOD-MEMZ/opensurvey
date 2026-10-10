/**
 * 外链安全过滤。
 *
 * 提交成功页支持作者配置「自动跳转链接」。这个值会进 `location.href`，
 * 所以必须挡掉 `javascript:` / `data:` 这类能执行脚本的伪协议
 * （否则作者（或协作者）填一条 javascript: 就等于在答题者浏览器里执行任意脚本）。
 *
 * 放行的只有：http(s) 绝对地址、协议相对地址（//host/path）、站内相对路径（/xxx）。
 */
export function safeJumpUrl(url?: string): string {
  if (!url || typeof url !== 'string') return ''
  const value = url.trim()
  if (!value) return ''
  if (/^https?:\/\//i.test(value)) return value
  if (/^\/\//.test(value)) return value
  if (value.startsWith('/')) return value
  // 剩下的一律拒绝：javascript: / data: / vbscript: / 各种自定义协议、以及光秃秃的裸域名
  return ''
}
