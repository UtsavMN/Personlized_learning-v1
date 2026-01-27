# Firebase Cloud Storage Setup

Documents uploaded through your app will be stored in Firebase Cloud Storage (not Firestore). Follow these steps to enable it:

## Step 1: Enable Cloud Storage in Firebase

1. Go to Firebase Console: https://console.firebase.google.com/project/personlized-learning-c97ce/overview
2. In the left sidebar, click **Storage**
3. Click **Get Started**
4. When prompted for security rules, select **Start in production mode**
5. Choose region: **asia-south1** (same as your Firestore)
6. Click **Done**

Firebase will create a storage bucket: `gs://personlized-learning-c97ce.appspot.com`

## Step 2: Update Cloud Storage Security Rules

1. In **Storage**, click the **Rules** tab
2. Replace all content with:

```plaintext
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Allow authenticated users to upload and download documents
    match /documents/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null;
    }
    
    // Allow anyone to read public documents (optional)
    match /documents/public/{document=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

3. Click **Publish**

## Step 3: Initialize Cloud Storage in Code (Already Done!)

Your app is already configured to use Cloud Storage. When a user uploads a PDF:

1. ✅ The PDF is stored in `gs://personlized-learning-c97ce.appspot.com/documents/{timestamp}_{filename}`
2. ✅ Metadata is saved in Firestore's `documents` collection
3. ✅ PDF text is extracted and searchable
4. ✅ A download URL is generated for later access

## Document Storage Structure

```
gs://personlized-learning-c97ce.appspot.com/
└── documents/
    ├── 1704931200000_lecture_notes.pdf
    ├── 1704931300000_textbook_ch1.pdf
    └── ...
```

Each document has a Firestore entry with:
- `title` - User-friendly name
- `description` - What the document is about
- `filename` - Original filename
- `content` - Extracted text (for search/analysis)
- `downloadURL` - Link to download the PDF
- `storagePath` - Where the file is stored in Cloud Storage
- `uploadDate` - When it was uploaded

## Testing the Upload

1. Restart dev server: `npm run dev`
2. Go to http://localhost:9002
3. Login with Google (Documents tab appears)
4. Click **Documents** tab
5. Fill in title and description
6. Upload a PDF
7. The file will be stored in Cloud Storage ✅

## Important Security Notes

- ✅ Only authenticated users can upload
- ✅ PDF files are stored securely in Cloud Storage
- ✅ Metadata is in Firestore with security rules
- ⚠️ Cloud Storage has free tier: 5GB/month storage, 1GB/day download
- ⚠️ For production, monitor storage usage in Firebase Console

## Troubleshooting

| Issue | Solution |
|-------|----------|
| **"Bucket not found"** | Make sure Storage is enabled and rules are published. |
| **Upload fails silently** | Check browser console (F12) for errors. Ensure user is authenticated. |
| **Can't download PDF** | Verify download URL is working. Check Cloud Storage Rules allow read access. |

---

For more help: https://firebase.google.com/docs/storage/web/start
