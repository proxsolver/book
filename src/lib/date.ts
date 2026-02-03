// KST is UTC+9
const KST_OFFSET = 9 * 60 * 60 * 1000

// Get current KST time as Date object
export function getKSTDate() {
  return new Date(Date.now() + KST_OFFSET)
}

// Get KST today at midnight as a Date object (stored as UTC)
// KST 2025-02-02 00:00:00 = UTC 2025-02-01 15:00:00
export function getKSTToday() {
  const kst = getKSTDate()
  const utcYear = kst.getUTCFullYear()
  const utcMonth = kst.getUTCMonth()
  const utcDay = kst.getUTCDate()
  // Create UTC date at midnight, then subtract 9 hours
  const result = new Date(Date.UTC(utcYear, utcMonth, utcDay, 0, 0, 0))
  result.setTime(result.getTime() - KST_OFFSET)
  return result
}

// Get KST tomorrow at midnight
export function getKSTTomorrow() {
  const today = getKSTToday()
  const result = new Date(today)
  result.setTime(result.getTime() + 24 * 60 * 60 * 1000)
  return result
}

// Get KST date as YYYY-MM-DD string
export function getKSTDateOnly() {
  const kst = getKSTDate()
  const year = kst.getUTCFullYear()
  const month = String(kst.getUTCMonth() + 1).padStart(2, '0')
  const day = String(kst.getUTCDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// Parse KST date string to Date object
// "2025-02-02" -> Date representing 2025-02-01 15:00:00 UTC (KST midnight)
export function parseKSTDate(dateStr: string) {
  const [year, month, day] = dateStr.split('-').map(Number)
  const utcDate = new Date(Date.UTC(year, month - 1, day, 0, 0, 0))
  utcDate.setTime(utcDate.getTime() - KST_OFFSET)
  return utcDate
}

export function formatKSTDate(date: Date) {
  const kstDate = new Date(date.getTime() + KST_OFFSET)
  const days = ['일', '월', '화', '수', '목', '금', '토']
  const year = String(kstDate.getUTCFullYear()).slice(-2)
  const month = String(kstDate.getUTCMonth() + 1).padStart(2, '0')
  const day = String(kstDate.getUTCDate()).padStart(2, '0')
  const dayOfWeek = days[kstDate.getUTCDay()]
  return `${year}${month}${day}(${dayOfWeek})`
}
