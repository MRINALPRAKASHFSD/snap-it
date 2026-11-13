<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

## Lens app rules
- Never request, store or use location (GPS, IP geolocation); discovery uses interest tags only. Why: core product/privacy rule.
- Camera logic lives in src/lib/camera (useCamera adapter + CSS-filter pipeline) so native/AR can replace it. Why: future mobile app.
- Private user media goes in the private `gallery` bucket under `<uid>/` and is shown via signed URLs; public buckets are blocked in this workspace.
- Strangers only see user_tags rows with is_public = true (enforced by RLS).

## Social architecture
- Social reads use authenticated server functions and React Query; subscriptions invalidate the shared social query so all social surfaces stay consistent.
- Friendship transitions, story expiry and point awards are enforced in database functions/triggers; clients cannot grant points or accept outgoing requests.
- Shared images remain in the private gallery and receive short-lived signed URLs only after participant/audience RLS checks; media rows remain owner-only.
- Private profile fields are read only through the owner-scoped RPC; public readers use column grants or the visibility-aware profile RPC to prevent direct API leakage.
- Blocking is enforced by database pair guards and read policies, not UI alone; block inserts atomically disconnect friendships and serialize against sends/acceptance.
