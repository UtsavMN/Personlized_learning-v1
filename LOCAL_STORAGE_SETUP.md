# Local Document Storage Setup

✅ **Free! No Cloud Storage costs!**

Your documents are now stored locally in **Firestore** (which syncs to your browser). This is completely free—no Cloud Storage fees needed.

## How It Works

1. **Upload PDF** → Text is extracted automatically
2. **Stored in Firestore** → Free tier includes up to 1GB of stored data
3. **Accessed from browser** → Synced locally via Firestore's offline cache
4. **Download anytime** → Files are stored as Base64 in Firestore

## Document Limits

- ✅ **Firestore free tier**: 1GB storage, 50k read/write ops per day
- ⚠️ **PDF size limit**: ~5MB per file (due to Firestore document size limit)
- ✅ **Unlimited uploads** (within free tier limits)

## Testing Local Storage

1. Restart dev server: `npm run dev`
2. Go to http://localhost:9002
3. Login with Google
4. Click **Documents** tab
5. Upload a PDF:
   - Title: "Test Document"
   - Description: "My first test PDF"
   - File: Select any PDF
6. Click **Upload Document**
7. Document appears in "Available Documents" list ✅

## Viewing/Downloading Documents

The document is stored in Firestore as:
- Extracted text (for AI analysis and search)
- Original PDF file (Base64 encoded)
- Metadata (title, description, upload date, file size)

The Chat AI can access the document content for answering questions.

## When to Upgrade to Cloud Storage

Later, when you want to:
- Store **very large files** (>5MB)
- Have **automatic backups** and redundancy
- Store **unlimited amounts** of data

Then you can:
1. Enable Firebase Cloud Storage (in this project's Firebase Console)
2. Update `src/app/actions/upload-document.ts` to use Cloud Storage APIs
3. Update the security rules

But for now, **local Firestore storage is perfect and completely free!** 🎉

---

See also: `CLOUD_STORAGE_SETUP.md` (for when you're ready to upgrade)
