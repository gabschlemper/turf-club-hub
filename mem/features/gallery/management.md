---
name: Photo Gallery
description: Album-based photo gallery with private storage, photographer role, ZIP downloads
type: feature
---
**Tables:** `photo_albums`, `photos`, `photographers`. Soft-delete only. Audit trigger on albums.

**Storage:** Private bucket `gallery`. Path: `{club_id}/{album_id}/{photo_id}_{name}.webp`. Thumbs in `thumbs/` subfolder. RLS by club_id.

**Roles:** New `photographer` role. Can ONLY access gallery (upload/manage). `can_manage_gallery()` includes admin/club_admin/super_admin/photographer. `handle_new_user()` resolves photographer role first when signing up.

**Image processing:** Client-side via `browser-image-compression`. Full=1920px WebP q0.82 (~300-500KB), thumb=480px WebP q0.7 (~30-60KB). Concurrency=3 for upload, 4 for ZIP download.

**Signed URLs:** TTL 1h, batched via `createSignedUrls`.

**UX:** Album grid (cover + count) → AlbumDetail (grid + lightbox via yet-another-react-lightbox). Set cover via star icon. Download single photo or full ZIP via jszip.
