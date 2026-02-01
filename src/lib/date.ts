// Get current KST time as Date object (in UTC)
export function getKSTDate() {
  const now = new Date()
  return new Date(now.getTime() + 9 * 60 * 60 * 1000)
}

// Get KST today at midnight (in UTC)
export function getKSTToday() {
  const kst = getKSTDate()
  // Get today's UTC date at midnight, then subtract 9 hours for KST midnight
  const utcDate = new Date(Date.UTC(kst.getUTCFullYear(), kst.getUTCMonth(), kst.getUTCDate(), 0, 0, 0))
  utcDate.setUTCHours(utcDate.getUTCHours() - 9)
  return utcDate
}

// Get KST tomorrow at midnight (in UTC)
export function getKSTTomorrow() {
  const today = getKSTToday()
  const tomorrow = new Date(today)
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1)
  return tomorrow
}

// Get KST date as YYYY-MM-DD string
export function getKSTDateOnly() {
  const kst = getKSTDate()
  return kst.toISOString().split('T')[0]
}

// Parse KST date string to UTC Date
// KST midnight = UTC time that is 9 hours earlier
// Example: "2025-02-02" KST midnight = 2025-02-01 15:00:00 UTC
export function parseKSTDate(dateStr: string) {
  const [year, month, day] = dateStr.split('-').map(Number)
  const utcDate = new Date(Date.UTC(year, month - 1, day, 0, 0, 0))
  utcDate.setUTCHours(utcDate.getUTCHours() - 9)
  return utcDate
}

export function formatKSTDate(date: Date) {
  const kstDate = new Date(date.getTime() + 9 * 60 * 60 * 1000)
  const days = ['일', '월', '화', '수', '목', '금', '토']
  const year = String(kstDate.getUTCFullYear()).slice(-2)
  const month = String(kstDate.getUTCMonth() + 1).padStart(2, '0')
  const day = String(kstDate.getUTCDate()).padStart(2, '0')
  const dayOfWeek = days[kstDate.getUTCDay()]
  return `${year}${month}${day}(${dayOfWeek})`
}
