import { beforeAll, describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

// Opt-in real backend audit. Credentials live outside the checkout, never in fixtures.
const enabled = Boolean(process.env['LENS_QA_ACCOUNTS']);
describe.skipIf(!enabled).sequential("Phase 2 real-account integration", () => {
  type Account = { id: string; label: string; username: string; session: { access_token: string } };
  let a: Account, b: Account, c: Account;
  let publicTag: string, privateTag: string, requestId: string, photoPath: string, privatePath: string, storyId: string;
  const url = process.env['SUPABASE_URL'] ?? "";
  const key = process.env['SUPABASE_PUBLISHABLE_KEY'] ?? "";
  async function call(user: Account | null, method: string, path: string, body?: unknown, storage = false) {
    const response = await fetch(`${url}/${storage ? "storage/v1" : "rest/v1"}/${path}`, {
      method, headers: { apikey: key, ...(user ? { Authorization: `Bearer ${user.session.access_token}` } : {}), "Content-Type": "application/json", Prefer: method === "PATCH" ? "return=minimal" : "return=representation" },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    const text = await response.text();
    return { status: response.status, data: text ? JSON.parse(text) : null };
  }
  async function request(from: Account, to: Account) {
    const result = await call(from, "POST", "friendships", { requester_id: from.id, recipient_id: to.id });
    expect(result.status).toBe(201);
    return result.data[0].id as string;
  }
  async function upload(user: Account, name: string) {
    const path = `${user.id}/${name}-${crypto.randomUUID()}.png`;
    const bytes = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=", "base64");
    const response = await fetch(`${url}/storage/v1/object/gallery/${path}`, { method: "POST", headers: { apikey: key, Authorization: `Bearer ${user.session.access_token}`, "Content-Type": "image/png" }, body: bytes });
    expect(response.status).toBe(200);
    expect((await call(user, "POST", "media", { owner_id: user.id, storage_path: path })).status).toBe(201);
    return path;
  }
  beforeAll(async () => {
    const accounts: Account[] = JSON.parse(readFileSync(process.env['LENS_QA_ACCOUNTS'] ?? "", "utf8"));
    const [first, second, third] = accounts;
    if (!first || !second || !third) throw new Error("Three independent audit accounts are required");
    a = first; b = second; c = third;
    const fixture = JSON.parse(readFileSync(process.env['LENS_QA_FIXTURE'] ?? "", "utf8"));
    publicTag = fixture.tag_public; privateTag = fixture.tag_private;
    for (const user of accounts) {
      await call(user, "DELETE", `blocks?blocker_id=eq.${user.id}`);
      await call(user, "DELETE", `friendships?or=(requester_id.eq.${user.id},recipient_id.eq.${user.id})`);
    }
    expect((await call(b, "PATCH", `profiles?id=eq.${b.id}`, { bio_public: false })).status).toBe(204);
  });
  it("discovers B through a shared public tag but not private tags", async () => {
    const result = await call(a, "GET", `user_tags?tag_id=eq.${publicTag}&user_id=eq.${b.id}&select=user_id,profiles!inner(username,display_name,onboarded)`);
    expect(result.status).toBe(200); expect(result.data[0].profiles.username).toBe(b.username);
    expect((await call(a, "GET", `user_tags?tag_id=eq.${privateTag}&user_id=eq.${b.id}`)).data).toEqual([]);
  });
  it("hides private tag membership from aggregate counts", async () => {
    const result = await call(a, "POST", "rpc/tag_counts", {});
    expect(result.status).toBe(200); expect(result.data.some((row: { tag_id: string }) => row.tag_id === privateTag)).toBe(false);
  });
  it("protects birth years and private bios even through direct requests", async () => {
    expect((await call(a, "GET", `profiles?id=eq.${b.id}&select=birth_year,bio`)).status).toBe(403);
    const visible = await call(a, "POST", "rpc/visible_profile", { handle: b.username });
    expect(visible.data[0].bio).toBeNull();
    const mine = await call(b, "POST", "rpc/my_private_profile", {});
    expect(mine.data).toHaveLength(1); expect(mine.data[0].id).toBe(b.id); expect(mine.data[0].birth_year).toBe(2002);
  });
  it("denies messages before acceptance and sender impersonation", async () => {
    expect((await call(a, "POST", "messages", { sender_id: a.id, recipient_id: b.id, body: "not friends" })).status).toBeGreaterThanOrEqual(400);
    expect((await call(a, "POST", "messages", { sender_id: b.id, recipient_id: a.id, body: "spoof" })).status).toBeGreaterThanOrEqual(400);
  });
  it("allows requests but denies duplicate and outgoing acceptance", async () => {
    requestId = await request(a, b);
    expect((await call(b, "POST", "friendships", { requester_id: b.id, recipient_id: a.id })).status).toBe(409);
    expect((await call(a, "POST", "rpc/accept_friend", { request_id: requestId })).status).toBeGreaterThanOrEqual(400);
    expect((await call(c, "GET", `friendships?id=eq.${requestId}`)).data).toEqual([]);
  });
  it("lets B reject then accept a new request; both see the connection", async () => {
    expect((await call(b, "DELETE", `friendships?id=eq.${requestId}`)).status).toBe(200);
    expect((await call(a, "GET", `friendships?id=eq.${requestId}`)).data).toEqual([]);
    requestId = await request(a, b);
    expect((await call(b, "POST", "rpc/accept_friend", { request_id: requestId })).status).toBe(204);
    for (const user of [a, b]) expect((await call(user, "GET", `friendships?id=eq.${requestId}`)).data[0].status).toBe("accepted");
  });
  it("awards exactly 10 points once per connection, not per reconnection", async () => {
    for (const [user, other] of [[a, b], [b, a]] as [Account, Account][]) {
      const points = await call(user, "GET", `point_events?source_key=eq.friend:${other.id}`);
      expect(points.data).toHaveLength(1); expect(points.data[0].points).toBe(10);
    }
    await call(a, "DELETE", `friendships?id=eq.${requestId}`);
    requestId = await request(a, b); await call(b, "POST", "rpc/accept_friend", { request_id: requestId });
    expect((await call(a, "GET", `point_events?source_key=eq.friend:${b.id}`)).data).toHaveLength(1);
    expect((await call(a, "POST", "point_events", { user_id: a.id, reason: "fake", points: 999, source_key: "fake" })).status).toBe(403);
  });
  it("exchanges messages both ways while a third user and anonymous caller cannot read", async () => {
    for (const [from, to] of [[a, b], [b, a]] as [Account, Account][]) {
      const sent = await call(from, "POST", "messages", { sender_id: from.id, recipient_id: to.id, body: `QA ${from.label} to ${to.label}` });
      expect(sent.status).toBe(201);
      expect((await call(to, "GET", `messages?id=eq.${sent.data[0].id}`)).data[0].body).toBe(`QA ${from.label} to ${to.label}`);
      expect((await call(c, "GET", `messages?id=eq.${sent.data[0].id}`)).data).toEqual([]);
      const anonymous = await call(null, "GET", `messages?id=eq.${sent.data[0].id}`);
      expect(anonymous.status >= 400 || anonymous.data.length === 0).toBe(true);
    }
  });
  it("allows only recipients to mark read and forbids client-written read receipts", async () => {
    await call(a, "POST", "rpc/mark_messages_read", { friend_id: b.id });
    const received = await call(a, "GET", `messages?sender_id=eq.${b.id}&recipient_id=eq.${a.id}`);
    expect(received.data.every((m: { read_at: string | null }) => m.read_at !== null)).toBe(true);
    expect((await call(a, "POST", "messages", { sender_id: a.id, recipient_id: b.id, body: "spoof read", read_at: new Date().toISOString() })).status).toBeGreaterThanOrEqual(400);
  });
  it("protects unshared private media and forged ownership/upload paths", async () => {
    privatePath = await upload(a, "private"); photoPath = await upload(a, "shared");
    expect((await call(b, "GET", `media?owner_id=eq.${a.id}`)).data).toEqual([]);
    expect((await call(b, "POST", `object/sign/gallery/${privatePath}`, { expiresIn: 60 }, true)).status).toBeGreaterThanOrEqual(400);
    expect((await call(b, "POST", "media", { owner_id: a.id, storage_path: privatePath })).status).toBe(403);
    expect((await call(b, "POST", "messages", { sender_id: b.id, recipient_id: a.id, body: "stolen", storage_path: privatePath })).status).toBeGreaterThanOrEqual(400);
    const forged = await fetch(`${url}/storage/v1/object/gallery/${a.id}/forged.png`, { method: "POST", headers: { apikey: key, Authorization: `Bearer ${b.session.access_token}`, "Content-Type": "image/png" }, body: new Uint8Array([1, 2, 3]) });
    expect(forged.status).toBeGreaterThanOrEqual(400);
  });
  it("allows participant photo access, denies spectators and manipulated signed URLs", async () => {
    expect((await call(a, "POST", "messages", { sender_id: a.id, recipient_id: b.id, body: "photo", storage_path: photoPath })).status).toBe(201);
    const signed = await call(b, "POST", `object/sign/gallery/${photoPath}`, { expiresIn: 60 }, true);
    expect(signed.status).toBe(200);
    const signedUrl = `${url}/storage/v1${signed.data.signedURL}`;
    expect((await fetch(signedUrl)).status).toBe(200);
    expect((await fetch(signedUrl.replace(photoPath, privatePath))).status).toBeGreaterThanOrEqual(400);
    expect((await call(c, "POST", `object/sign/gallery/${photoPath}`, { expiresIn: 60 }, true)).status).toBeGreaterThanOrEqual(400);
    expect((await fetch(`${url}/storage/v1/object/public/gallery/${privatePath}`)).status).toBeGreaterThanOrEqual(400);
  });
  it("enforces 24-hour expiry and audience rules regardless of client timestamps", async () => {
    const result = await call(a, "POST", "stories", { owner_id: a.id, storage_path: photoPath, caption: "QA friends story", created_at: "2000-01-01", expires_at: "2099-01-01" });
    expect(result.status).toBe(201); storyId = result.data[0].id;
    expect(new Date(result.data[0].expires_at).getTime() - new Date(result.data[0].created_at).getTime()).toBe(24 * 3600_000);
    expect((await call(b, "GET", `stories?id=eq.${storyId}`)).data).toHaveLength(1);
    expect((await call(c, "GET", `stories?id=eq.${storyId}`)).data).toEqual([]);
    expect((await call(a, "POST", "stories", { owner_id: a.id, storage_path: photoPath, audience: "selected", selected_ids: [] })).status).toBeGreaterThanOrEqual(400);
    expect((await call(a, "POST", "stories", { owner_id: a.id, storage_path: photoPath, audience: "selected", selected_ids: [c.id] })).status).toBeGreaterThanOrEqual(400);
  });
  it("restricts selected stories to chosen friends, not other accepted friends", async () => {
    const id = await request(a, c); await call(c, "POST", "rpc/accept_friend", { request_id: id });
    const result = await call(a, "POST", "stories", { owner_id: a.id, storage_path: photoPath, audience: "selected", selected_ids: [b.id], caption: "QA selected story" });
    expect(result.status).toBe(201);
    expect((await call(b, "GET", `stories?id=eq.${result.data[0].id}`)).data).toHaveLength(1);
    expect((await call(c, "GET", `stories?id=eq.${result.data[0].id}`)).data).toEqual([]);
    await call(a, "DELETE", `stories?id=eq.${result.data[0].id}`);
  });
  it("awards only 5 daily story points despite multiple stories", async () => {
    const result = await call(a, "GET", "point_events?reason=eq.Daily%20story");
    expect(result.data).toHaveLength(1); expect(result.data[0].points).toBe(5);
  });
  it("records views once and deletion removes story and dependent views", async () => {
    expect((await call(b, "POST", "story_views", { story_id: storyId, viewer_id: b.id })).status).toBe(201);
    expect((await call(b, "POST", "story_views", { story_id: storyId, viewer_id: b.id })).status).toBe(409);
    expect((await call(a, "GET", `story_views?story_id=eq.${storyId}`)).data).toHaveLength(1);
    expect((await call(b, "DELETE", `stories?id=eq.${storyId}`)).data).toEqual([]);
    expect((await call(a, "DELETE", `stories?id=eq.${storyId}`)).status).toBe(200);
    expect((await call(b, "GET", `stories?id=eq.${storyId}`)).data).toEqual([]);
    expect((await call(a, "GET", `story_views?story_id=eq.${storyId}`)).data).toEqual([]);
  });
  it("blocking disconnects and denies requests, messages, discovery, story and media access", async () => {
    const story = await call(a, "POST", "stories", { owner_id: a.id, storage_path: photoPath, caption: "QA blocked story" });
    expect((await call(a, "POST", "blocks", { blocker_id: a.id, blocked_id: b.id })).status).toBe(201);
    for (const user of [a, b]) expect((await call(user, "GET", `friendships?id=eq.${requestId}`)).data).toEqual([]);
    for (const [from, to] of [[a, b], [b, a]] as [Account, Account][]) {
      expect((await call(from, "POST", "friendships", { requester_id: from.id, recipient_id: to.id })).status).toBeGreaterThanOrEqual(400);
      expect((await call(from, "POST", "messages", { sender_id: from.id, recipient_id: to.id, body: "blocked" })).status).toBeGreaterThanOrEqual(400);
    }
    expect((await call(b, "GET", `messages?sender_id=eq.${a.id}`)).data).toEqual([]);
    expect((await call(b, "GET", `stories?id=eq.${story.data[0].id}`)).data).toEqual([]);
    expect((await call(b, "GET", `user_tags?user_id=eq.${a.id}`)).data).toEqual([]);
    expect((await call(b, "POST", `object/sign/gallery/${photoPath}`, { expiresIn: 60 }, true)).status).toBeGreaterThanOrEqual(400);
    expect((await call(b, "DELETE", `blocks?blocker_id=eq.${a.id}`)).data).toEqual([]);
    await call(a, "DELETE", `stories?id=eq.${story.data[0].id}`);
    await call(a, "DELETE", `blocks?blocker_id=eq.${a.id}&blocked_id=eq.${b.id}`);
  });
  it("unblocking does not silently recreate friendships or grant points", async () => {
    expect((await call(a, "GET", `friendships?recipient_id=eq.${b.id}`)).data).toEqual([]);
    expect((await call(a, "GET", `point_events?source_key=eq.friend:${b.id}`)).data).toHaveLength(1);
  });
});