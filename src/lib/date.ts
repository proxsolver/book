export function getKSTDate() {
  const now = new Date()
  const utc = now.getTime() + now.getTimezoneOffset() * 60000
  const kst = new Date(utc + 540 * 60000) // KST is UTC+9
  return kst
}

export function getKSTToday() {
  const kst = getKSTDate()
  kst.setHours(0, 0, 0, 0)
  return kst
}

export function getKSTTomorrow() {
  const today = getKSTToday()
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  return tomorrow
}

export function getKSTDateOnly() {
  return getKSTToday().toISOString().split('T')[0]
}

export function formatKSTDate(date: Date) {
  const days = ['일', '월', '화', '수', '목', '금', '토']
  const year = String(date.getFullYear()).slice(-2)
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const dayOfWeek = days[date.getDay()]
  return `${year}${month}${day}(${dayOfWeek})`
}
