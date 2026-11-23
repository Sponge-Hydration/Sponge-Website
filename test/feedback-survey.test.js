// The feedback survey exists in two places (/feedback and the bottom of
// /reviews) and writes into an Airtable base whose columns are fixed.
//
// The failure these tests exist to prevent: someone adds a question to the form
// whose Airtable column does not exist. Airtable rejects the WHOLE record with
// 422 when a single field name is unknown, so one stray question does not lose
// that answer — it loses every response, silently, while the form still shows a
// thank-you screen. Nothing else in the suite would catch that.

import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const repo = (p) => path.resolve(process.cwd(), p)
const read = (p) => readFileSync(repo(p), 'utf8')

const survey = read('src/components/FeedbackSurvey.jsx')
const api = read('functions/api/reviews.js')

describe('the survey form and the Airtable writer agree', () => {
  // Keys the form puts in the POST body, minus the ones the API handles itself.
  const NOT_COLUMNS = new Set(['website', 'useCases'])

  const bodyKeys = () => {
    // The object literal inside JSON.stringify({ ... }) in the submit handler.
    const block = survey.slice(
      survey.indexOf('body: JSON.stringify({'),
      survey.indexOf('      })\n', survey.indexOf('body: JSON.stringify({'))
    )
    const keys = new Set()
    for (const m of block.matchAll(/^\s{10}([a-zA-Z]+)[:,]/gm)) keys.add(m[1])
    return [...keys]
  }

  it('posts a non-trivial set of answers', () => {
    expect(bodyKeys().length).toBeGreaterThanOrEqual(10)
  })

  it('every posted answer has a column in the FIELDS map', () => {
    const fields = api.slice(api.indexOf('const FIELDS = {'), api.indexOf('}', api.indexOf('const FIELDS = {')))
    const mapped = new Set([...fields.matchAll(/^\s{2}([a-zA-Z]+):/gm)].map((m) => m[1]))
    // "useCases" is mapped too, but it is written as a joined string.
    for (const key of bodyKeys()) {
      if (NOT_COLUMNS.has(key)) continue
      expect(mapped, `form posts "${key}" with no Airtable column`).toContain(key)
    }
    expect(mapped.has('useCases')).toBe(true)
  })

  it('offers only the rating words the API will accept', () => {
    const formWords = survey.match(/export const RATING_WORDS = \[(.*?)\]/s)[1]
    const apiWords = api.match(/const RATING_WORDS = \[(.*?)\]/s)[1]
    const norm = (s) => s.match(/'([^']+)'/g).sort().join(',')
    expect(norm(formWords)).toBe(norm(apiWords))
  })

  it('keeps the bot honeypot', () => {
    expect(survey).toMatch(/name="website"/)
    expect(api).toMatch(/if \(body\.website\)/)
  })
})

describe('the survey is reachable', () => {
  it('is routed at /feedback', () => {
    const app = read('src/App.jsx')
    expect(app).toMatch(/path: 'feedback'/)
    expect(app).toMatch(/import Feedback from '\.\/pages\/Feedback'/)
  })

  it('is linked from the footer and listed in the sitemap', () => {
    expect(read('src/components/Footer.jsx')).toMatch(/to="\/feedback"/)
    expect(read('public/sitemap.xml')).toMatch(/spongehydration\.com\/feedback</)
  })

  it('is used by both pages from the one shared component', () => {
    expect(read('src/pages/Feedback.jsx')).toMatch(/FeedbackSurvey variant="feedback"/)
    expect(read('src/pages/ReviewsPage.jsx')).toMatch(/FeedbackSurvey variant="review"/)
  })
})

// These run against the BUILT output, because that is what visitors get.
const built = existsSync(path.resolve(process.cwd(), 'dist/feedback.html'))
const d = built ? describe : describe.skip

d('the prerendered /feedback page carries the form', () => {
  const html = readFileSync(path.resolve(process.cwd(), 'dist/feedback.html'), 'utf8')

  it('renders the star picker and the open-text question server-side', () => {
    expect(html).toMatch(/star-picker/)
    expect(html).toMatch(/name="feedback"/)
    expect(html).toMatch(/name="nps"/)
  })

  it('has its own canonical and title', () => {
    expect(html).toMatch(/spongehydration\.com\/feedback/)
    expect(html.toLowerCase()).toMatch(/feedback survey/)
  })
})
