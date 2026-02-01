// Get current KST time
export function getKSTDate() {
  const now = new Date()
  return new Date(now.getTime() + 9 * 60 * 60 * 1000)
}

// Get KST today at midnight (in UTC)
export function getKSTToday() {
  const kst = getKSTDate()
  kst.setUTCHours(0, 0, 0, 0)
  return kst
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
  return getKSTToday().toISOString().split('T')[0]
}

// Parse KST date string (YYYY-MM-DD) to UTC Date
export function parseKSTDate(dateStr: string) {
  const [year, month, day] = dateStr.split('-').map(Number)
  // KST midnight = UTC 15:00 previous day, but we use setUTCHours(0,0,0,0) on the shifted date
  const kstDate = new Date(Date.UTC(year, month - 1, day, 0, 0, 0))
  // Shift by +9 hours to get KST time, then set to midnight
  kstDate.setTime(kstDate.getTime() + 9 * 60 * 60 * 1000)
  kstDate.setUTCHours(0, 0, 0, 0)
  return kstDate
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
