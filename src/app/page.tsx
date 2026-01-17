'use client';

import { useState, useEffect } from 'react';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import { Separator } from '@/components/ui/separator';

import { TimetableView } from '@/components/views/timetable-view';
import { TrackerView } from '@/components/views/tracker-view';
import { DocumentView } from '@/components/views/document-view';
import { DashboardView } from '@/components/views/dashboard-view';
import { QuizView } from "@/components/views/quiz-view";
import { FlashcardsView } from "@/components/views/flashcards-view";
import { OnboardingView } from "@/components/views/onboarding-view";
import { SettingsView } from "@/components/views/settings-view";
import { SmartAgentView } from "@/components/views/smart-agent-view";
import { StudioView } from "@/components/views/studio-view";
import { GradePredictorView } from '@/components/views/grade-predictor-view';
import { useLocalAuth } from '@/lib/auth-context';
import { useSearchParams } from 'next/navigation';
import { AITutorFloating } from '@/components/widgets/ai-tutor-floating';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { useUser } from '@clerk/nextjs';

function DashboardContent() {
  const { isUserLoading, needsOnboarding, user: localUser } = useLocalAuth();
  const { user: clerkUser } = useUser();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('view') || 'dashboard';
  const [activeTab, setActiveTab] = useState(initialTab);

  // Sync tab if URL param changes (e.g. back button)
  useEffect(() => {
    const view = searchParams.get('view');
    if (view && view !== activeTab) {
      setActiveTab(view);
    }
  }, [searchParams, activeTab]);

  // Determine effective user (Clerk or Local/Dev)
  const _user = localUser || clerkUser;

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
    return (
      <>
        {/* Core Views: Keep-Alive for instant switching */}
        <div className={activeTab === 'dashboard' ? 'block' : 'hidden'}><DashboardView /></div>
        <div className={activeTab === 'timetable' ? 'block' : 'hidden'}><TimetableView /></div>
        <div className={activeTab === 'tracker' ? 'block' : 'hidden'}><TrackerView /></div>
        <div className={activeTab === 'flashcards' ? 'block' : 'hidden'}><FlashcardsView /></div>

        {/* Secondary Views: Also Keep-Alive for speed */}
        <div className={activeTab === 'documents' ? 'block' : 'hidden'}><DocumentView /></div>
        <div className={activeTab === 'studio' ? 'block' : 'hidden'}><StudioView /></div>
        <div className={activeTab === 'quiz' ? 'block' : 'hidden'}><QuizView /></div>
        <div className={activeTab === 'predictor' ? 'block' : 'hidden'}><GradePredictorView /></div>
        <div className={activeTab === 'smart-agent' ? 'block' : 'hidden'}><SmartAgentView /></div>
        <div className={activeTab === 'settings' ? 'block' : 'hidden'}><SettingsView /></div>
      </>
    );
  }

  const getPageTitle = (tab: string) => {
    const titles: Record<string, string> = {
      dashboard: 'Dashboard',
      timetable: 'Schedule',
      tracker: 'Tracker (Tasks & Habits)',
      documents: 'Documents',
      studio: 'The Lab (Math & Code)',
      quiz: 'Quiz',
      flashcards: 'Pulse (Flashcards)',
      predictor: 'Grade Predictor (Neuro)',
      'smart-agent': 'Smart Agent (AI Assistant)',
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
          <div className="flex items-center gap-2 mr-4">
            <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-blue-500">Mentora</span>
          </div>
          <Separator orientation="vertical" className="mr-2 h-4 hidden md:block" />
          <h2 className="text-lg font-semibold">{getPageTitle(activeTab)}</h2>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <div className="min-h-[100vh] flex-1 rounded-xl bg-muted/30 md:min-h-min mt-4">
            {renderContent()}
          </div>
        </div>
      </SidebarInset>
      <AITutorFloating />
    </SidebarProvider>
  );
}

export default function Dashboard() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
      <DashboardContent />
    </Suspense>
  );
}
