import { test, expect, describe } from "bun:test"
import { formatRelativeAge, shortRepoName, truncate } from "../format"

describe("formatRelativeAge", () => {
  test("returns 'now' for just now", () => {
    expect(formatRelativeAge(new Date().toISOString())).toBe("now")
  })

  test("returns minutes for < 1 hour", () => {
    const thirtyMinsAgo = new Date(Date.now() - 30 * 60000).toISOString()
    expect(formatRelativeAge(thirtyMinsAgo)).toBe("30m")
  })

  test("returns hours for < 1 day", () => {
    const fiveHoursAgo = new Date(Date.now() - 5 * 3600000).toISOString()
    expect(formatRelativeAge(fiveHoursAgo)).toBe("5h")
  })

  test("returns days for < 1 week", () => {
    const threeDaysAgo = new Date(Date.now() - 3 * 86400000).toISOString()
    expect(formatRelativeAge(threeDaysAgo)).toBe("3d")
  })

  test("returns weeks for < 5 weeks", () => {
    const twoWeeksAgo = new Date(Date.now() - 14 * 86400000).toISOString()
    expect(formatRelativeAge(twoWeeksAgo)).toBe("2w")
  })

  test("returns months for > 5 weeks", () => {
    const threeMonthsAgo = new Date(Date.now() - 90 * 86400000).toISOString()
    expect(formatRelativeAge(threeMonthsAgo)).toBe("3mo")
  })
})

describe("shortRepoName", () => {
  test("strips owner prefix", () => {
    expect(shortRepoName("OctavianTocan/ai-nexus")).toBe("ai-nexus")
  })

  test("handles repo name without owner", () => {
    expect(shortRepoName("ai-nexus")).toBe("ai-nexus")
  })
})

describe("truncate", () => {
  test("leaves short strings unchanged", () => {
    expect(truncate("hello", 10)).toBe("hello")
  })

  test("truncates long strings with ellipsis", () => {
    const result = truncate("this is a long string", 10)
    expect(result.length).toBe(10)
    expect(result).toEndWith("\u2026")
  })

  test("handles exact length", () => {
    expect(truncate("exact", 5)).toBe("exact")
  })
})
