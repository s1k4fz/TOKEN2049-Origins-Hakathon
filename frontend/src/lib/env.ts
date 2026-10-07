// 只放可以公开的配置；VITE_ 变量会被打进前端包。
export const env = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? '',
  reownProjectId: import.meta.env.VITE_REOWN_PROJECT_ID ?? '',
  appUrl: import.meta.env.VITE_APP_URL ?? window.location.origin,
}
