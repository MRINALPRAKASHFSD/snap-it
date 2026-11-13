export const STORY_LIFETIME_HOURS = 24;
export const SHARED_URL_SECONDS = 60;
export function storyIsActive(expiresAt: string, now = Date.now()) {
  return new Date(expiresAt).getTime() > now;
}
export function mayViewStory(ownerId: string, viewerId: string, isFriend: boolean, audience: string, selectedIds: string[], expiresAt: string, now = Date.now()) {
  if (!storyIsActive(expiresAt, now)) return false;
  return ownerId === viewerId || (isFriend && (audience === "friends" || selectedIds.includes(viewerId)));
}