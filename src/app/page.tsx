'use client';

import { useState } from 'react';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import { Separator } from '@/components/ui/separator';

import { ChatView } from '@/components/views/chat-view';
import { CodeView } from '@/components/views/code-view';
import { MathView } from '@/components/views/math-view';
import { TimetableView } from '@/components/views/timetable-view';
import { DocumentView } from '@/components/views/document-view';
import { DashboardView } from '@/components/views/dashboard-view';
import { QuizView } from "@/components/views/quiz-view";
import { FlashcardsView } from "@/components/views/flashcards-view";
// import { AuthView } from "@/components/views/auth-view";
import { OnboardingView } from "@/components/views/onboarding-view";
import { SettingsView } from "@/components/views/settings-view";
import { GradePredictorView } from "@/components/views/grade-predictor-view";
import { RLSchedulerView } from "@/components/views/rl-scheduler-view";
import { useLocalAuth } from '@/lib/auth-context';
import { useUser } from '@clerk/nextjs';
import { Loader2 } from "lucide-react";

export default function Dashboard() {
  const { isUserLoading, needsOnboarding, user: localUser } = useLocalAuth();
  const { user: clerkUser } = useUser();
  const [activeTab, setActiveTab] = useState("dashboard");

  // Determine effective user (Clerk or Local/Dev)
  const user = localUser || clerkUser;

  // Wait for auth to initialize
  if (isUserLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground animate-pulse">Initializing...</p>
        </div>
      </div>
    );
  }

  // New User Flow
  if (needsOnboarding) {
    return <OnboardingView />;
  }

  // If not logged in, show Auth Screen (Handled by Middleware now)
  // if (!user) return <AuthView />;

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <DashboardView />;
      case 'timetable': return <TimetableView />;
      case 'documents': return <DocumentView />;
      case 'chat': return <ChatView />;
      case 'math': return <MathView />;
      case 'gym': return <QuizView />;
      case 'flashcards': return <FlashcardsView />;
      case 'code': return <CodeView />;
      case 'predictor': return <GradePredictorView />;
      case 'rl-agent': return <RLSchedulerView />;
      case 'settings': return <SettingsView />;
      default: return <DashboardView />;
    }
  }

  const getPageTitle = (tab: string) => {
    const titles: Record<string, string> = {
      dashboard: 'Dashboard',
      timetable: 'Schedule',
      documents: 'Documents',
      chat: 'AI Tutor',
      math: 'Math Solver',
      gym: 'The Gym',
      flashcards: 'Pulse (Flashcards)',
      predictor: 'Grade Predictor (Neuro)',
      'rl-agent': 'Smart Scheduler (Q-Learning)',
      code: 'Code Lab',
      settings: 'Profile & Settings'
    };
    return titles[tab] || 'Dashboard';
  }

  return (
    <SidebarProvider>
      <AppSidebar activeTab={activeTab} onTabChange={setActiveTab} />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <h2 className="text-lg font-semibold">{getPageTitle(activeTab)}</h2>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <div className="min-h-[100vh] flex-1 rounded-xl bg-muted/30 md:min-h-min mt-4">
            {renderContent()}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
