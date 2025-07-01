import { format as dateFnsFormat } from "date-fns"
import { ja } from "date-fns/locale"

// 日付が有効かどうかをチェックする関数
export function isValidDate(date: any): boolean {
  return date instanceof Date && !isNaN(date.getTime())
}

// 安全に日付を変換する関数
export function safeDate(date: any): Date {
  if (isValidDate(date)) {
    return date
  }

  // Firestoreのタイムスタンプオブジェクトの場合
  if (date && typeof date.toDate === "function") {
    try {
      const converted = date.toDate()
      if (isValidDate(converted)) {
        return converted
      }
    } catch (e) {
      console.error("Failed to convert Firestore timestamp:", e)
    }
  }

  // 文字列の場合、パースを試みる
  if (typeof date === "string") {
    const parsed = new Date(date)
    if (isValidDate(parsed)) {
      return parsed
    }
  }

  // 数値の場合、タイムスタンプとして扱う
  if (typeof date === "number") {
    const parsed = new Date(date)
    if (isValidDate(parsed)) {
      return parsed
    }
  }

  // どれにも当てはまらない場合は現在時刻を返す
  console.warn("Invalid date provided, using current date instead:", date)
  return new Date()
}

// 安全にフォーマットする関数
export function safeFormat(date: any, formatStr: string): string {
  try {
    return dateFnsFormat(safeDate(date), formatStr, { locale: ja })
  } catch (e) {
    console.error("Error formatting date:", e)
    return "日付エラー"
  }
}

// 日付の比較を安全に行う関数
export function safeCompareDate(date1: any, date2: any): boolean {
  const safeDate1 = safeDate(date1)
  const safeDate2 = safeDate(date2)
  return safeDate1 <= safeDate2
}
