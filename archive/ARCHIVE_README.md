# Archive Contents (v1.0 Cleanup)

This folder contains files that were removed from the main project in the **v1.0 release cleanup** branch (`cleanup/v1.0`). These files are kept for historical reference and future migration purposes.

## What's Archived

### 1. **Setup Documentation**
- `docs/FIREBASE_AUTH_SETUP.md` — Firebase Authentication setup instructions (superseded by local auth)
- `docs/CLOUD_STORAGE_SETUP.md` — Firebase Cloud Storage setup (superseded by local filesystem storage at `public/uploads/`)

**Reason:** Project migrated to **local filesystem storage** to avoid cloud storage costs. These docs are no longer relevant but preserved for future reference.

### 2. **Old Server Action**
- `src/app/actions/upload-document.ts` — Server action for document uploads

**Reason:** Replaced by dedicated API route `/api/upload` (at `src/app/api/upload/route.ts`) to handle large file uploads (bypasses Next.js Server Actions 1MB body limit).

### 3. **Old AI Flow (Lazy-Load Version)**
- `src/ai/flows/cited-question-answering-lazy.ts` — Dynamic import wrapper for QA flow

**Reason:** Merged functionality directly into main flow; no longer needed since Genkit initialization errors are now caught at the app level in `src/ai/genkit.ts`.

## Active Storage & Upload Architecture (v1.0)

### Local Document Storage
- **Location:** `public/uploads/documents/`
- **Metadata:** `public/uploads/documents.json`
- **Upload Endpoint:** `POST /api/upload` — handles FormData with large files
- **Fetch Endpoint:** `GET /api/documents` — serves metadata and document list

### Why These Changes?
1. **Cost Optimization:** Eliminated Firebase Cloud Storage charges.
2. **Simplification:** Local storage reduces Firebase dependency for non-auth features.
3. **Performance:** Direct filesystem access faster than cloud APIs.
4. **Development:** Easier local testing without cloud setup.

## Future Considerations

If you decide to upgrade to cloud storage later:
1. Refer to `archive/docs/CLOUD_STORAGE_SETUP.md` for setup instructions.
2. Update `src/app/api/upload/route.ts` and `src/components/views/document-view.tsx` to use Firebase Cloud Storage APIs.
3. Adjust authentication in `src/components/header.tsx` if needed.

## Commit History

- `chore(cleanup): archive old server-action upload-document (replaced by /api/upload)` — Moved server action
- `chore(cleanup): archive Firebase setup docs and old lazy-load flow` — Archived docs and flow variant

---

**Branch:** `cleanup/v1.0`  
**Date:** 2026-01-11  
**Archived by:** Automated cleanup process
