// Pacific-time calendar helpers for the weekly reports. The business runs on
// PT, so "this week" means the 7 PT calendar days ending today (today partial).

const TZ = 'America/Los_Angeles'

function tzOffsetMs(date) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', {
      timeZone: TZ, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    })
      .formatToParts(date)
      .map((p) => [p.type, p.value])
  )
  const asUtc = Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour, +parts.minute, +parts.second)
  return asUtc - Math.floor(date.getTime() / 1000) * 1000
}

// 'YYYY-MM-DD' for the PT calendar day containing `date`.
export function ptDate(date = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(date)
}

export function addDays(dateStr, n) {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10)
}

// Epoch ms of 00:00 PT on dateStr.
export function ptMidnight(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number)
  const guess = Date.UTC(y, m - 1, d)
  let t = guess - tzOffsetMs(new Date(guess))
  t = guess - tzOffsetMs(new Date(t)) // re-check across DST changes
  return t
}

// This week = 7 PT days ending `endDate` (inclusive); last week = the 7 before.
export function reportWindows(now = new Date(), endDate = ptDate(now)) {
  const mk = (start, end) => ({
    start,
    end,
    startMs: ptMidnight(start),
    endMs: ptMidnight(addDays(end, 1)), // exclusive
    days: Array.from({ length: 7 }, (_, i) => addDays(start, i)),
  })
  const thisStart = addDays(endDate, -6)
  return {
    thisWeek: mk(thisStart, endDate),
    lastWeek: mk(addDays(thisStart, -7), addDays(thisStart, -1)),
  }
}
