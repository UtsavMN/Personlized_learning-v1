# Mentora: Project Report

## 1. Problem Statement
Education today is data-rich but insight-poor. Students generate vast amounts of behavioral data (time spent, scores, rest patterns), but this data is rarely used to optimize *how* they study. Static scheduling tools fail to account for human variables like fatigue or learning curves. "Mentora" addresses this by deploying autonomous AI agents to manage the "Meta-Learning" process.

## 2. Methodology & System Design
We moved away from a monolithic app structure to a **Multi-Agent Architecture**:

### 2.1 The Scheduler Agent (Reinforcement Learning)
We implemented a custom **Q-Learning** algorithm that treats the student's day as an environment.
- **State Space**: Day of Week, Energy Level, Previous Subject.
- **Action Space**: Study Subject X, Take Break.
- **Reward Signal**: User feedback (Thumbs Up/Down) and Session Completion.
- **Training**: The agent trains locally in the browser, adapting to the user's specific circadian rhythm.

### 2.2 The Predictor Agent (Neural Network)
To provide actionable insights, we engineered a Feed-Forward Neural Network using **TensorFlow.js**.
- The model takes behavioral inputs (Quiz Scores, Focus Time, Task Completion).
- It outputs a predicted final grade probability.
- **Training**: The model is trained entirely client-side using the user's own historical data, ensuring privacy and personalization.

### 2.3 The Content Agent (RAG + Generative AI)
We utilized a Retrieval-Augmented Generation (RAG) pipeline.
- Documents are parsed and chunked locally.
- We prompt-engineered Large Language Models (Gemini) to act as "Socratic Tutors", generating questions based *only* on the provided context chunks.

## 3. Key Results
- **Adaptive Scheduling**: The RL agent successfully learns to avoid scheduling high-cognitive load tasks (e.g., Math) during user-reported "Low Energy" periods.
- **Performance**: The entire multi-agent system runs at 60fps on standard hardware due to our "Local-First" optimization strategy (IndexedDB + Keep-Alive View Architecture).
- **Latency**: Navigation delays were reduced to near-zero (0ms) by pre-mounting agent views.

## 4. Learnings
- **Small Models are Effective**: For tasks like grade prediction and scheduling, massive LLMs are overkill. Small, specialized models (Linear Regression, Q-Tables) provide instant, reliable results with 0 cost.
- **Privacy by Design**: Training AI locally is viable in 2025. We proved that sensitive learning data never needs to leave the student's device to power intelligent features.

## 5. References & AI Tools
- **Frameworks**: Next.js, TensorFlow.js, Dexie.js.
- **AI Models**: Custom Q-Learning Implementation, Custom TF.js Sequential Model, Gemini Pro (via API for text generation).
- **Development**: Assisted by Google DeepMind's agentic tools for boilerplate generation and refactoring.
