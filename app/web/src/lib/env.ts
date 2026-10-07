// 只放可以公开的配置；VITE_ 变量会被打进前端包。
export const env = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? '',
  reownProjectId: import.meta.env.VITE_REOWN_PROJECT_ID ?? '',
  // WalletConnect 要求 metadata.url 与当前页面同源，所以直接取当前域名。
  appUrl: window.location.origin,
}
