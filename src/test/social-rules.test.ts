import { describe, expect, it } from "vitest";
import { mayViewStory, STORY_LIFETIME_HOURS, storyIsActive } from "@/lib/social-rules";

describe("Story privacy", () => {
  const now = Date.UTC(2026, 10, 9);
  const expiry = new Date(now + 24 * 3600_000).toISOString();
  it("expires at exactly 24 hours", () => {
    expect(STORY_LIFETIME_HOURS).toBe(24);
    expect(storyIsActive(expiry, now + 24 * 3600_000 - 1)).toBe(true);
    expect(storyIsActive(expiry, now + 24 * 3600_000)).toBe(false);
  });
  it("never exposes friend stories to strangers", () => {
    expect(mayViewStory("owner", "stranger", false, "friends", [], expiry, now)).toBe(false);
    expect(mayViewStory("owner", "friend", true, "friends", [], expiry, now)).toBe(true);
  });
  it("restricts selected-friend stories to that audience", () => {
    expect(mayViewStory("owner", "friend", true, "selected", ["other"], expiry, now)).toBe(false);
    expect(mayViewStory("owner", "friend", true, "selected", ["friend"], expiry, now)).toBe(true);
  });
});