// The gift email's link (?gift=CODE) is remembered so checkout can apply it.
import { beforeEach, describe, expect, it } from 'vitest'
import { GIFT_KEY, captureGiftFromUrl, clearGiftCode, getGiftCode } from '../src/gift.js'

const visit = (qs) => window.history.replaceState({}, '', `/products${qs}`)
beforeEach(() => { localStorage.clear(); visit('') })

describe('gift link capture', () => {
  it('stores a well-formed code and keeps it after the param is gone', () => {
    visit('?gift=gift-abcd2345')
    captureGiftFromUrl()
    expect(getGiftCode()).toBe('GIFT-ABCD2345')
    visit('')
    captureGiftFromUrl()
    expect(getGiftCode()).toBe('GIFT-ABCD2345')
  })

  it('ignores anything that is not a gift code', () => {
    for (const bad of ['?gift=SAVE10', '?gift=GIFT-ABCD234', '?gift=GIFT-ABCD234O', '?gift=<script>', '?gift=']) {
      visit(bad)
      captureGiftFromUrl()
    }
    expect(getGiftCode()).toBe('')
  })

  it('never returns a tampered stored value, and can be cleared once spent', () => {
    localStorage.setItem(GIFT_KEY, 'not-a-code')
    expect(getGiftCode()).toBe('')
    localStorage.setItem(GIFT_KEY, 'GIFT-ABCD2345')
    clearGiftCode()
    expect(getGiftCode()).toBe('')
  })
})
