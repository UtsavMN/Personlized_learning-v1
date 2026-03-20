'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Layers, MonitorSmartphone, Lock, Database, Cpu, Brain, ArrowRight } from 'lucide-react';

export function ProjectArchitectureFlowchart() {
    return (
        <Card className="border-primary/30 bg-gradient-to-br from-background via-muted/20 to-primary/5 overflow-hidden mt-8 hidden md:block shadow-lg w-full">
            <CardHeader className="border-b bg-card/50 pb-6 relative z-10">
                <CardTitle className="flex items-center gap-3 text-2xl text-primary">
                    <Layers className="w-8 h-8" />
                    Deep Technical Architecture (Interactive Connective Flow)
                </CardTitle>
                <CardDescription className="text-base mt-2 max-w-3xl">
                    Hover over any isolated node to scale it up and read the underlying tech stack context.
                </CardDescription>
            </CardHeader>
            <CardContent className="p-0 relative h-[800px] w-full bg-grid-white/[0.02] bg-slate-950/[0.03] dark:bg-slate-950 overflow-hidden">
                {/* Background Grid Pattern */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />

                {/* SVG Connections Canvas */}
                <svg className="absolute inset-0 w-full h-full z-0 pointer-events-none" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                        <marker id="arrow-blue" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                            <path d="M 0 0 L 10 5 L 0 10 z" className="fill-blue-500/50" />
                        </marker>
                        <marker id="arrow-green" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                            <path d="M 0 0 L 10 5 L 0 10 z" className="fill-green-500/80" />
                        </marker>
                    </defs>

                    {/* Edge: Frontend -> Auth (Down) */}
                    <path d="M 18% 28% L 18% 45%" stroke="currentColor" className="text-blue-500/50 stroke-2" strokeDasharray="5,5" markerEnd="url(#arrow-blue)" />

                    {/* Edge: Frontend -> Backend (Right) */}
                    <path d="M 32% 16% C 40% 16%, 45% 42%, 50% 42%" fill="none" stroke="currentColor" className="text-blue-500/80 stroke-[3px]" markerEnd="url(#arrow-blue)" />

                    {/* Edge: Auth -> Backend (Right-Up) */}
                    <path d="M 32% 64% C 42% 64%, 45% 58%, 50% 58%" fill="none" stroke="currentColor" className="text-orange-500/80 stroke-[3px]" markerEnd="url(#arrow-blue)" />

                    {/* Edge: Backend -> DB (Right-Up) */}
                    <path d="M 70% 46% C 75% 46%, 76% 24%, 81% 24%" fill="none" stroke="currentColor" className="text-green-500/80 stroke-[3px]" markerEnd="url(#arrow-green)" />

                    {/* Edge: Backend -> GenAI (Straight Right) */}
                    <path d="M 70% 50% L 81% 50%" stroke="currentColor" className="text-purple-500/80 stroke-[3px]" markerEnd="url(#arrow-green)" />

                    {/* Edge: Backend -> ML (Right-Down) */}
                    <path d="M 70% 54% C 75% 54%, 76% 76%, 81% 76%" fill="none" stroke="currentColor" className="text-rose-500/80 stroke-[3px]" markerEnd="url(#arrow-green)" />
                </svg>

                {/* Nodes Container */}
                <div className="absolute inset-0 w-full h-full z-10">

                    {/* 1. Frontend */}
                    <FlowNode
                        icon={<MonitorSmartphone />} color="blue" title="1. Frontend UI Shell"
                        subtitle="Next.js 15 • React 19 • Tailwind"
                        description="The client uses Server-Side Rendering (SSR) to load heavily optimized HTML. React 19 hooks manage transient client state (modals, chats), styled completely via Tailwind CSS and Radix primitive UI elements."
                        className="left-[4%] top-[8%] w-[28%]"
                    />

                    {/* 2. Authentication */}
                    <FlowNode
                        icon={<Lock />} color="orange" title="2. Edge Authentication"
                        subtitle="Clerk JWT Auth • Next.js Middleware"
                        description="Before hits reach the core backend, Next.js Edge Middleware intercepts the route. It uses Clerk to validate secure HTTP-only session tokens, preventing unauthorized access to personalized learning databases."
                        className="left-[4%] top-[56%] w-[28%]"
                    />

                    {/* 3. Core Backend API */}
                    <FlowNode
                        icon={<Layers />} color="gray" title="3. Core Server Actions"
                        subtitle="Next.js Server Runtime (RPC)"
                        description="Rather than traditional REST endpoints, the backend is strictly defined by Next.js Server Actions. This creates an end-to-end typesafe bridge from the frontend directly to the server logic, encapsulating API keys securely."
                        className="left-[42%] top-[34%] w-[28%]"
                    />

                    {/* 4. Database */}
                    <FlowNode
                        icon={<Database />} color="green" title="4. Cloud Database"
                        subtitle="Turso (libSQL) • Drizzle ORM"
                        description="Raw schemas and types are strictly enforced using Drizzle ORM. Drizzle acts as the translation layer into Turso, a hyper-scalable serverless SQLite database optimized for Edge read speeds."
                        className="left-[77%] top-[8%] w-[21%]"
                    />

                    {/* 5. GenAI Brain */}
                    <FlowNode
                        icon={<Cpu />} color="purple" title="5. GenAI Intelligence"
                        subtitle="Gemini 2.5 • Firebase Genkit"
                        description="Handles the heavy cognitive load for unstructured data. Genkit orchestrates workflow pipelines, tapping into Google Gemini to process PDF documents for RAG (Retrieval-Augmented Generation) and auto-generates dynamic Flashcards/Quizzes based on syllabus density."
                        className="left-[77%] top-[34%] w-[21%]"
                    />

                    {/* 6. ML / Analytics */}
                    <FlowNode
                        icon={<Brain />} color="rose" title="6. Machine Learning"
                        subtitle="TensorFlow.js • Q-Learning Env"
                        description="Features two localized models: A Q-Learning Reinforcement Agent that dynamically re-routes the user's study timeline based on success/failure rewards, and a TensorFlow.js neural layer for grade predicting."
                        className="left-[77%] top-[60%] w-[21%]"
                    />

                </div>
            </CardContent>
        </Card>
    );
}

function FlowNode({ icon, color, title, subtitle, description, className }: { icon: React.ReactNode, color: 'blue' | 'orange' | 'green' | 'purple' | 'rose' | 'gray', title: string, subtitle: string, description: string, className: string }) {
    const colorMap = {
        blue: { bg: 'bg-blue-100 dark:bg-blue-900/40', text: 'text-blue-600 dark:text-blue-400', border: 'border-blue-500/50 hover:border-blue-500' },
        orange: { bg: 'bg-orange-100 dark:bg-orange-900/40', text: 'text-orange-600 dark:text-orange-400', border: 'border-orange-500/50 hover:border-orange-500' },
        green: { bg: 'bg-green-100 dark:bg-green-900/40', text: 'text-green-600 dark:text-green-400', border: 'border-green-500/50 hover:border-green-500' },
        purple: { bg: 'bg-purple-100 dark:bg-purple-900/40', text: 'text-purple-600 dark:text-purple-400', border: 'border-purple-500/50 hover:border-purple-500' },
        rose: { bg: 'bg-rose-100 dark:bg-rose-900/40', text: 'text-rose-600 dark:text-rose-400', border: 'border-rose-500/50 hover:border-rose-500' },
        gray: { bg: 'bg-slate-100 dark:bg-slate-800/60', text: 'text-slate-600 dark:text-slate-300', border: 'border-slate-400/50 hover:border-slate-400 dark:border-slate-500/50' },
    };

    return (
        <div className={`absolute group transition-all duration-[400ms] ease-[cubic-bezier(0.175,0.885,0.32,1.275)] origin-top hover:scale-[1.3] hover:z-50 ${className}`}>
            {/* Glossy Backdrop Blur */}
            <div className={`relative bg-card/80 backdrop-blur-xl border-2 shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.4)] rounded-2xl p-4 transition-all duration-300 ${colorMap[color].border}`}>
                <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl shrink-0 ${colorMap[color].bg} ${colorMap[color].text}`}>
                        {icon}
                    </div>
                    <div className="min-w-0">
                        <h3 className="font-bold text-[15px] truncate">{title}</h3>
                        <div className={`text-[12px] font-semibold truncate ${colorMap[color].text}`}>
                            {subtitle}
                        </div>
                    </div>
                </div>

                {/* Collapsed Description */}
                <div className="text-[12px] leading-relaxed text-muted-foreground mt-3 line-clamp-2 group-hover:hidden transition-all duration-300">
                    {description}
                </div>

                {/* Expanded Zoom Description */}
                <div className="hidden group-hover:block text-[11px] leading-relaxed text-foreground/90 mt-4 transition-all duration-500 animate-in fade-in slide-in-from-top-2 border-t pt-3">
                    {description}
                </div>
            </div>
        </div>
    );
}
