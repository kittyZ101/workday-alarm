// 把排班配置编码进 URL，让纯静态部署（如 GitHub Pages）也能分享。
export function encodeConfig(config) {
  const json = JSON.stringify(config)
  return btoa(unescape(encodeURIComponent(json)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

export function decodeConfig(str) {
  const base64 = str.replace(/-/g, '+').replace(/_/g, '/')
  const json = decodeURIComponent(escape(atob(base64)))
  return JSON.parse(json)
}
