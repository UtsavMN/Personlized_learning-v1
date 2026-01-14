import Dexie, { type EntityTable } from 'dexie';

interface TimetableEntry {
    id: number;
    day: string; // 'Monday', 'Tuesday', etc.
    startTime: string; // '09:00'
    endTime: string; // '10:00'
    subject: string;
    room?: string;
    type?: 'Lecture' | 'Lab' | 'Tutorial' | 'Other';
}

interface DocumentEntry {
    id: number;
    title: string;
    description: string;
    content: string; // Extracted text
    subject?: string; // e.g. "Math", "Physics"
    file?: Blob; // The actual PDF file
    createdAt: Date;
    size: number;
    type: string;
}

interface ChatMessageEntry {
    id?: number;
    role: 'user' | 'assistant';
    content: string;
    createdAt: Date;
    documentId?: number; // Linked to a specific document context if applicable
}

interface LearnerProfile {
    id: number;
    userId: string; // 'U000'
    name: string;
    learningStyle: 'visual' | 'text' | 'analogy' | 'auditory';
    preferredTime: 'morning' | 'evening';
    availableHoursPerWeek: number;
    goals: string[]; // From other sources or defaulted
    metrics: {
        streak: number;
        lastStudySession: Date;
    };
}

interface SubjectMastery {
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

interface TaskEntry {
    id?: number;
    title: string;
    completed: boolean;
    date: Date; // For specific date tasks
    type: 'task';
}

interface HobbyEntry {
    id?: number;
    name: string; // "Guitar"
    frequency: 'daily' | 'weekly';
    durationMinutes: number;
    completedDates: Date[]; // Track streaks
    type: 'hobby';
}

interface QuestionEntry {
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

interface QuizResultEntry {
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
    flashcards!: EntityTable<Flashcard, 'id'>;
    embeddings!: EntityTable<VectorEntry, 'id'>;

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
    });

        // Version 6: Vector Embeddings
        this.version(6).stores({
        embeddings: '++id, documentId, segmentId'
    });
    }
}

export const db = new AppDatabase();
