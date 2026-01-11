# Firebase Studio

This is a NextJS starter in Firebase Studio.

To get started, take a look at `src/app/page.tsx`.

## Setup (local)

1. Install dependencies:

```powershell
cd "c:\Users\Utsav M N\OneDrive\Documents\My projects\iit ropar\minor-project"
npm install --legacy-peer-deps
```

2. Create a local `.env` file from `.env.example` and fill in keys (do not commit `.env`).

3. Start the dev server (runs on port 9002 by default):

```powershell
npm run dev
```

4. Build for production (Windows PowerShell compatible):

```powershell
npm run build
```

## Notes

- The repository includes a `src/firebase/config.ts` file with a Firebase config object. If you prefer, override values with environment variables instead of committing credentials.
- Some features (GenKit / Google GenAI) require API keys that are not included here. Add them to your local `.env` as `GENKIT_API_KEY` / `GOOGLE_GENAI_API_KEY`.
- To deploy to Firebase Hosting, install and login with the Firebase CLI and follow `firebase deploy` steps; I can prepare `DEPLOY.md` if you want.
# Firebase Studio

This is a NextJS starter in Firebase Studio.

To get started, take a look at src/app/page.tsx.
