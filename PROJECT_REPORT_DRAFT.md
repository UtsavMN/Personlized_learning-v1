# Mentora: Project Report

## 1. Problem Statement
In the current educational landscape, students struggle with generic, one-size-fits-all curricula that generally fail to address individual learning paces and gaps in knowledge. "Mentora" aims to solve this by creating an AI-driven personalized learning assistant that adapts study schedules, generates custom assessments from user documents, and tracks mastery locally.

## 2. Approach
The system is built as a **Local-First Web Application** using Next.js and IndexedDB (Dexie.js).
- **Data Privacy**: All user data (flashcards, notes, analytics) is stored on the user's device.
- **AI Integration**: The system uses a hybrid approach:
  - **Rule-Based & Heuristic**: For immediate feedback, text extraction, and basic scheduling.
  - **Generative AI (Gemini)**: For complex tasks like summarizing documents and generating nuanced quiz questions.
- **Feature Consolidation**: Key tools (Math Solver, Code Executor, Focus Timer) are consolidated into "The Lab" to reduce context switching.

## 3. Key Results
- **Functional MVP**: A fully working web application with Dashboard, Tracker, and Study Tools.
- **Performance**: Achieved <100ms navigation times using Keep-Alive architecture.
- **Accuracy**: Baseline quiz generation achieves high relevance by anchoring questions strictly to source text.
- **Experience**: Clean, "WOW" factor UI with glassmorphism and smooth transitions.

## 4. Learnings
- **Offline First**: Managing state synchronization between React and IndexedDB is complex but crucial for user privacy.
- **AI Latency**: Hybridizing local logic with cloud AI provides the best balance of speed and intelligence.
- **UI Performance**: Conditional rendering (CSS toggling) is superior to unmounting for heavy dashboard-style apps.

## 5. References & AI Usage Disclosure
- **Tech Stack**: Next.js, React, TailwindCSS, Dexie.js, Google Generative AI SDK.
- **AI Assistance**: Code generation and debugging assistance provided by Google DeepMind's agentic coding tools.
- **Credits**: Concept and implementation by Utsav M N.
