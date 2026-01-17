import { sqliteTable, text, integer, blob } from 'drizzle-orm/sqlite-core';

export const documents = sqliteTable('documents', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    title: text('title').notNull(),
    description: text('description'),
    subject: text('subject'),
    filePath: text('file_path').notNull(), // Path to file on disk
    fileType: text('file_type').notNull(),
    fileSize: integer('file_size').notNull(),
    content: text('content'), // Extracted text
    summary: text('summary'),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
    processed: integer('processed', { mode: 'boolean' }).default(false),
});

export const documentChunks = sqliteTable('document_chunks', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    documentId: integer('document_id').references(() => documents.id, { onDelete: 'cascade' }).notNull(),
    content: text('content').notNull(),
    pageStart: integer('page_start'),
    pageEnd: integer('page_end'),
    keywords: text('keywords'), // JSON string
    embedding: blob('embedding'), // Store vector as Float32Array blob
});

export const quizzes = sqliteTable('quizzes', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    title: text('title').notNull(),
    subject: text('subject'),
    documentId: integer('document_id').references(() => documents.id, { onDelete: 'set null' }),
    score: integer('score'),
    totalQuestions: integer('total_questions'),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

export const questions = sqliteTable('questions', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    quizId: integer('quiz_id').references(() => quizzes.id, { onDelete: 'cascade' }).notNull(),
    question: text('question').notNull(),
    options: text('options').notNull(), // JSON string array
    correctAnswer: text('correct_answer').notNull(),
    explanation: text('explanation'),
});

export const flashcardDecks = sqliteTable('flashcard_decks', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    title: text('title').notNull(),
    subject: text('subject'),
    documentId: integer('document_id').references(() => documents.id, { onDelete: 'set null' }),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

export const flashcards = sqliteTable('flashcards', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    deckId: integer('deck_id').references(() => flashcardDecks.id, { onDelete: 'cascade' }).notNull(),
    front: text('front').notNull(),
    back: text('back').notNull(),
    interval: integer('interval').default(0),
    repetition: integer('repetition').default(0),
    easeFactor: integer('ease_factor').default(250),
    nextReview: integer('next_review', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const learnerProfile = sqliteTable('learner_profile', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    userId: text('user_id').notNull().unique(),
    name: text('name').notNull(),
    email: text('email'),
    avatar: text('avatar'),
    onboarded: integer('onboarded', { mode: 'boolean' }).default(false),
    learningStyle: text('learning_style'),
    interests: text('interests'), // JSON string array
    goals: text('goals'), // JSON string array
    availableHoursPerWeek: integer('available_hours_per_week').default(10),
    preferredStudyTime: text('preferred_study_time'),
    streak: integer('streak').default(0),
    totalXp: integer('total_xp').default(0),
    level: integer('level').default(1),
    lastActiveDate: integer('last_active_date', { mode: 'timestamp' }),
    createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const subjectMastery = sqliteTable('subject_mastery', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    subject: text('subject').notNull(),
    topicId: text('topic_id').notNull(),
    masteryScore: integer('mastery_score').default(0),
    xp: integer('xp').default(0),
    lastAssessmentDate: integer('last_assessment_date', { mode: 'timestamp' }),
    confidenceHistory: text('confidence_history'), // JSON string array
});

export const timetable = sqliteTable('timetable', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    subject: text('subject').notNull(),
    day: text('day').notNull(),
    startTime: text('start_time').notNull(),
    endTime: text('end_time').notNull(),
    room: text('room'),
    type: text('type').default('Lecture'),
    active: integer('active', { mode: 'boolean' }).default(true),
});

export const tracker = sqliteTable('tracker', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    subject: text('subject').notNull(),
    description: text('description').notNull(),
    priority: text('priority').default('Medium'),
    status: text('status').default('Pending'),
    deadline: integer('deadline', { mode: 'timestamp' }),
});

export const timetableMeta = sqliteTable('timetable_meta', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    imageBase64: text('image_base64'),
    uploadedAt: integer('uploaded_at', { mode: 'timestamp' }),
});

export const habits = sqliteTable('habits', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    name: text('name').notNull(),
    frequency: text('frequency').default('daily'),
    durationMinutes: integer('duration_minutes').default(30),
    completedDates: text('completed_dates'), // JSON string array
    createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const notes = sqliteTable('notes', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    title: text('title'),
    content: text('content'),
    subject: text('subject').default('General'),
    color: text('color'),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
    createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const quizResults = sqliteTable('quiz_results', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    quizId: integer('quiz_id').references(() => quizzes.id),
    subject: text('subject').notNull(),
    score: integer('score').notNull(),
    totalQuestions: integer('total_questions').notNull(),
    correctAnswers: integer('correct_answers').notNull(),
    questions: text('questions'), // Full quiz context (JSON)
    completedAt: integer('completed_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const analytics = sqliteTable('analytics', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    event: text('event').notNull(),
    subject: text('subject'),
    data: text('data'), // JSON blob
    timestamp: integer('timestamp', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const chatHistory = sqliteTable('chat_history', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    role: text('role').notNull(), // 'user' | 'assistant'
    content: text('content').notNull(),
    context: text('context'), // JSON context blob
    timestamp: integer('timestamp', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const focusSessions = sqliteTable('focus_sessions', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    subject: text('subject').notNull(),
    startTime: integer('start_time', { mode: 'timestamp' }).$defaultFn(() => new Date()),
    durationMinutes: integer('duration_minutes').notNull(),
    completed: integer('completed', { mode: 'boolean' }).default(false),
    xpEarned: integer('xp_earned').default(0),
});
