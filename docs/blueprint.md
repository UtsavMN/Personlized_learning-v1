# **App Name**: NIE Campus Guide

## Core Features:

- Document Ingestion: Parse and index PDFs (courses, labs, papers) using layout-aware chunking, supporting paragraphs, headings, tables, and figures.
- Hybrid Retrieval: Combine BM25 keyword search with semantic vector search (sentence transformers) to retrieve relevant passages. Rerank using a cross-encoder.
- Cited Question Answering: Generate answers to user queries based on retrieved documents. Every sentence in the output includes a citation to its source. If no strong evidence, output 'I don't know'.
- Math Tool: Solve math problems using SymPy, citing the parsed formula's origin in documents.
- Code Tool: Execute code using a sandboxed Python environment, citing the code explanation in documents. Serves as a tool to augment the RAG system.
- Timetable Tool: Parse CSV/ICS files for class and lab schedules. Resolve schedule conflicts and propose swap options. Citations to applicable timetable policy are provided in the output.
- Interactive Chat UI: A chat interface with user question, AI response, source citations, confidence meter (low/medium/high), and traceability view of retrieval and tool usage.

## Style Guidelines:

- Primary color: Light teal (#90EE90) to convey a sense of calm and trustworthiness, crucial for an academic assistant.
- Background color: Off-white (#F5F5DC) providing a soft, unobtrusive backdrop for readability.
- Accent color: Muted violet (#8A2BE2) for interactive elements like citations and links, to stand out against the neutral background.
- Headline font: 'Space Grotesk' (sans-serif) for headings. Body font: 'Inter' (sans-serif) for main content.
- Code font: 'Source Code Pro' (monospace) for code snippets.
- Simple, academic-themed icons for tools and sources (e.g., calculator, book, calendar).
- Clear, pane-based layout with chat on the left, sources and traceability on the right.