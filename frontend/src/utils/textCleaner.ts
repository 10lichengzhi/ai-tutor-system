/**
 * 文本清理和格式化工具
 * 用于处理AI返回内容中的乱码字符、Markdown格式等
 */

// 清理无效/乱码字符
export function cleanText(text: string): string {
  if (!text) return ''
  
  return text
    // 移除Unicode替换字符（乱码）
    .replace(/\uFFFD/g, '')
    // 移除可能导致显示问题的控制字符（保留换行、制表符）
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    // 清理连续的多个空格（保留换行）
    .replace(/[ \t]+/g, ' ')
    // 清理行首行尾空格
    .split('\n')
    .map(line => line.trim())
    .join('\n')
    // 清理多余的连续空行
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

// 简单的Markdown解析为React可用的格式
// 将**粗体**转为标记，`代码`转为标记
export function parseMarkdown(text: string): string {
  if (!text) return ''
  
  let result = cleanText(text)
  
  // 处理Markdown加粗 **text** -> <strong>text</strong> (我们返回纯文本，用特殊标记)
  // 这里不做HTML转换，而是保留Markdown让CSS处理，或者直接移除Markdown符号
  // 为了简单起见，我们移除Markdown符号但保留语义
  
  // 移除 ** 加粗标记但保留文字
  result = result.replace(/\*\*(.+?)\*\*/g, '$1')
  
  // 移除 * 斜体标记
  result = result.replace(/\*(.+?)\*/g, '$1')
  
  // 移除 ` 代码标记
  result = result.replace(/`(.+?)`/g, '$1')
  
  // 移除 # 标题标记
  result = result.replace(/^#{1,6}\s+/gm, '')
  
  // 移除 --- 分隔线
  result = result.replace(/^---+$/gm, '')
  
  return result
}

// 将文本按换行分段，用于渲染
export function splitParagraphs(text: string): string[] {
  const cleaned = parseMarkdown(text)
  return cleaned.split('\n').filter(p => p.trim().length > 0)
}

// 检测是否包含乱码
export function hasGarbledText(text: string): boolean {
  return text.includes('\uFFFD') || /[\x00-\x08\x0B\x0C\x0E-\x1F]/.test(text)
}
