/** 模拟一次网络往返：延迟后返回深拷贝，避免调用方改到 mock 存储。 */
export function mockResponse<T>(read: () => T, delayMs = 250): Promise<T> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(structuredClone(read())), delayMs)
  })
}
