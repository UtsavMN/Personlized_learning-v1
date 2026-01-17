# Mentora: AI Personalized Learning System

Mentora is an intelligent, local-first learning assistant designed to adapt to your study habits.

## Features
- **Smart Dashboard**: Visual analytics of your study progress.
- **The Lab**: Consolidated suite for Coding, Math, and Focus.
- **Pulse**: Spaced-repetition flashcards generated from your notes.
- **Local Privacy**: Your data stays on your device (IndexedDB).

## Installation

1. Install dependencies:
   ```powershell
   npm install --legacy-peer-deps
   ```

2. Setup Environment:
   - Copy `.env.example` to `.env`
   - Add your `GOOGLE_GENAI_API_KEY`

3. Run Development Server:
   ```powershell
   npm run dev
   ```
   Open [http://localhost:9002](http://localhost:9002).

## Academic Prototype Statement
**This is an academic prototype submitted for evaluation (Module E).**
The objective is to demonstrate an end-to-end AI pipeline for personalized learning. Advanced AI capabilities are intentionally scoped as future work.

## Evaluation Artifact
The primary evaluation source is `Mentora_Evaluation.ipynb`.
**To run:**
1. Install Python dependencies: `pip install -r requirements.txt`
2. Open the notebook in VS Code or Jupyter Lab.
3. Run all cells top-to-bottom.

## Scope & Limitations
- **Prototype**: Relies on synthetic/baseline logic for demonstration purposes in the Evaluation Notebook.
- **AI**: Uses Google Gemini for advanced features; requires internet connection for those specific tools.
