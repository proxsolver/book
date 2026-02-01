// Get current KST time as Date object (in UTC)
export function getKSTDate() {
  const now = new Date()
  return new Date(now.getTime() + 9 * 60 * 60 * 1000)
}

// Get KST today at midnight (in UTC)
// KST midnight = UTC 15:00 previous day
export function getKSTToday() {
  const kst = getKSTDate()
  // Set to KST midnight by setting UTC hours to 15 on the previous day
  kst.setUTCHours(15, 0, 0, 0)
  kst.setUTCDate(kst.getUTCDate() - 1)
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
  const kst = getKSTDate()
  return kst.toISOString().split('T')[0]
}

// Parse KST date string (YYYY-MM-DD) to UTC Date
// Input is KST date, output is UTC Date representing KST midnight
export function parseKSTDate(dateStr: string) {
  const [year, month, day] = dateStr.split('-').map(Number)
  // KST midnight (00:00) = UTC 15:00 previous day
  const utcDate = new Date(Date.UTC(year, month - 1, day, 15, 0, 0))
  // Subtract 1 day to get correct UTC date
  utcDate.setUTCDate(utcDate.getUTCDate() - 1)
  return utcDate
}

export function formatKSTDate(date: Date) {
  // Convert UTC date to KST for formatting
  const kstDate = new Date(date.getTime() + 9 * 60 * 60 * 1000)
  const days = ['일', '월', '화', '수', '목', '금', '토']
  const year = String(kstDate.getUTCFullYear()).slice(-2)
  const month = String(kstDate.getUTCMonth() + 1).padStart(2, '0')
  const day = String(kstDate.getUTCDate()).padStart(2, '0')
  const dayOfWeek = days[kstDate.getUTCDay()]
  return `${year}${month}${day}(${dayOfWeek})`
}
