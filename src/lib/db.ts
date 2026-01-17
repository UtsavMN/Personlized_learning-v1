import Dexie, { type EntityTable } from 'dexie';

export interface TimetableEntry {
    id: number;
    day: string; // 'Monday', 'Tuesday', etc.
    startTime: string; // '09:00'
    endTime: string; // '10:00'
    subject: string;
    room?: string;
    type?: 'Lecture' | 'Lab' | 'Tutorial' | 'Other';
}

export interface DocumentEntry {
    id: number;
    title: string;
    description: string;
    content: string; // Extracted text
    subject?: string; // e.g. "Math", "Physics"
    file?: Blob; // The actual PDF file
    createdAt: Date;
    size: number;
    type: string;
    // Enhanced Metadata
    processed?: boolean;
    pageCount?: number;
    hierarchy?: any; // Cached JSON tree of structure
    summary?: string; // AI generated summary
}

export interface ChatMessageEntry {
    id?: number;
    role: 'user' | 'assistant';
    content: string;
    createdAt: Date;
    documentId?: number; // Linked to a specific document context if applicable
}

export interface LearnerProfile {
    id: number;
    userId: string; // 'U000'
    name: string;
    learningStyle: 'visual' | 'text' | 'analogy' | 'auditory';
    preferredTime: 'morning' | 'evening';
    availableHoursPerWeek: number;
    semester: string; // "1" matched from Onboarding
    branch: string; // "Computer Science"
    goals: string[]; // From other sources or defaulted
    metrics: {
        streak: number;
        lastStudySession: Date;
    };
}

export interface SubjectMastery {
    id?: number;
    topicId: string; // 'limits'
    subject: string; // 'Math'
    masteryScore: number; // 0-100
    confidenceScore: number; // 0-100
    level: number; // 1-5 (Novice to Expert)
    xp: number; // Accumulated XP
    lastRevised: Date;
    nextReviewDate: Date;
}

export interface TaskEntry {
    id?: number;
    title: string;
    completed: boolean;
    date: Date; // For specific date tasks
    type: 'task';
}

export interface HobbyEntry {
    id?: number;
    name: string; // "Guitar"
    frequency: 'daily' | 'weekly';
    durationMinutes: number;
    completedDates: Date[]; // Track streaks
    type: 'hobby';
}

export interface QuestionEntry {
    id?: number;
    topicId: string; // 'limits'
    difficulty: 'easy' | 'medium' | 'hard';
    question: string;
    options: string[];
    correctAnswer: string;
    explanation: string;
    source: 'synthetic' | 'document';
    documentId?: number; // Linked if source is document
}

export interface QuizResultEntry {
    id?: number;
    topic: string; // "Physics - Kinematics"
    score: number; // Percentage
    totalQuestions: number;
    correctAnswers: number;
    date: Date;
    questions?: QuestionEntry[]; // Snapshot of questions asked
}

export interface VectorEntry {
    id?: number;
    documentId: number;
    text: string;
    vector: number[]; // 384-dimensional embedding
    pageNumber?: number;
    segmentId: number;
}

export interface NoteEntry {
    id?: number;
    title: string;
    content: string;
    subject: string;
    color?: string; // e.g. "bg-yellow-100"
    createdAt: Date;
    updatedAt: Date;
    tags?: string[];
}

export interface Deck {
    id?: number;
    title: string;
    subject: string;
    documentId?: string;
    createdAt: number;
}

export interface Flashcard {
    id?: number;
    deckId: number;
    front: string;
    back: string;
    interval: number;
    repetition: number;
    easeFactor: number;
    nextReview: number;
}

export interface AnalyticsEvent {
    id?: number;
    userId?: string;
    eventType: string;
    timestamp: number;
    topicId: string;
    documentId?: string;
    data: any;
}

// --- Database Definition ---
export class AppDatabase extends Dexie {
    timetable!: EntityTable<TimetableEntry, 'id'>;
    documents!: EntityTable<DocumentEntry, 'id'>;
    chatHistory!: EntityTable<ChatMessageEntry, 'id'>;
    learnerProfile!: EntityTable<LearnerProfile, 'id'>;
    subjectMastery!: EntityTable<SubjectMastery, 'id'>;
    tasks!: EntityTable<TaskEntry, 'id'>;
    hobbies!: EntityTable<HobbyEntry, 'id'>;
    quizResults!: EntityTable<QuizResultEntry, 'id'>;
    questions!: EntityTable<QuestionEntry, 'id'>;

    // New Non-LLM Core Tables
    analytics!: EntityTable<AnalyticsEvent, 'id'>;
    flashcardDecks!: EntityTable<Deck, 'id'>;

    embeddings!: EntityTable<VectorEntry, 'id'>;
    notes!: EntityTable<NoteEntry, 'id'>;

    // Document Intelligence
    sections!: EntityTable<DocumentSection, 'id'>;
    figures!: EntityTable<DocumentFigure, 'id'>;
    chunks!: EntityTable<DocumentChunk, 'id'>;
    focusSessions!: EntityTable<FocusSession, 'id'>;

    // Timetable Meta
    timetableMeta!: EntityTable<TimetableMeta, 'id'>;

    constructor() {
        super('MentoraDB');

        // Core Schema
        this.version(4).stores({
            timetable: '++id, day, startTime, endTime, subject',
            documents: '++id, title, subject, createdAt, size, type',
            chatHistory: '++id, role, createdAt, documentId',
            learnerProfile: '++id, userId',
            subjectMastery: '++id, topicId, subject, nextReviewDate',
            tasks: '++id, date, completed',
            hobbies: '++id, name',
            quizResults: '++id, topic, date, score',
            questions: '++id, topicId, difficulty'
        });

        // Version 5: Adaptation & Analytics
        this.version(5).stores({
            analytics: '++id, eventType, timestamp, topicId',
            flashcardDecks: '++id, documentId, subject',
            flashcards: '++id, deckId, nextReview'
        });


        // Version 6: Vector Embeddings
        this.version(6).stores({
            embeddings: '++id, documentId, segmentId'
        });

        // Version 7: Notes
        this.version(7).stores({
            notes: '++id, title, subject, updatedAt'
        });

        // Version 8: Document Intelligence Engine
        this.version(8).stores({
            // Sections: hierarchical structure
            sections: '++id, documentId, parentId, level',
            // Figures: extracted images/charts
            figures: '++id, documentId, type, pageNumber',
            // Chunks: semantic units for RAG
            chunks: '++id, documentId, sectionId, *keywords'
        });

        // Version 9: Focus Sessions & Gamification
        this.version(9).stores({
            focusSessions: '++id, startTime, subject'
        });

        // Version 10: Timetable Image Meta
        this.version(10).stores({
            timetableMeta: 'id' // Singleton table, ID always 1?
        });
    }
}

export interface TimetableMeta {
    id: number;
    imageBlob?: Blob;
    imageBase64?: string; // Fallback for robust storage
    uploadedAt: Date;
}


export interface FocusSession {
    id?: number;
    startTime: Date;
    durationMinutes: number;
    subject: string;
    completed: boolean;
    xpEarned: number;
}

// --- Document Intelligence Interfaces ---

export interface DocumentSection {
    id?: number;
    documentId: number;
    title: string;
    level: number; // 1=H1, 2=H2...
    parentId: number | null;
    content: string; // The text content of this section specifically
    pageStart: number;
    pageEnd: number;
    order: number; // To maintain reading order
}

export interface DocumentFigure {
    id?: number;
    documentId: number;
    blob: Blob;
    caption: string;
    pageNumber: number;
    type: 'figure' | 'image' | 'table';
    context?: string; // Surrounding text/context
}

export interface DocumentChunk {
    id?: number;
    documentId: number;
    sectionId: number | null;
    content: string;
    keywords: string[];
    embedding?: number[]; // Optional direct vector here, or link to vectors table
    metadata?: any;
}


export interface NoteEntry {
    id?: number;
    title: string;
    content: string;
    subject: string;
    color?: string; // e.g. "bg-yellow-100"
    createdAt: Date;
    updatedAt: Date;
    tags?: string[];
}

export const db = new AppDatabase();
