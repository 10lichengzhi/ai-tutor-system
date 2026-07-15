/**
 * 生成唯一ID
 * 优先使用 crypto.randomUUID()，降级使用时间戳+随机数
 */
export function generateId(prefix: string = ''): string {
  const prefixStr = prefix ? `${prefix}_` : ''
  // 优先使用浏览器原生crypto API
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return prefixStr + crypto.randomUUID()
  }
  // 降级方案：时间戳 + 随机字符串
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substring(2, 10)
  return `${prefixStr}${timestamp}_${random}`
}

/**
 * 生成短ID（8位，用于UI显示）
 */
export function generateShortId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID().replace(/-/g, '').substring(0, 8)
  }
  return Math.random().toString(36).substring(2, 10)
}
