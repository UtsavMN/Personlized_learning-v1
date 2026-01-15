'use client';

import { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { RLSchedulerView } from './rl-scheduler-view';
import { GradePredictorView } from './grade-predictor-view';
import { Brain, TrendingUp, Sparkles } from 'lucide-react';

export function SmartAgentView() {
    const [activeTab, setActiveTab] = useState('scheduler');

    return (
        <div className="h-full p-2 md:p-6 space-y-6 animate-in fade-in duration-500 flex flex-col">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 p-8 rounded-3xl bg-gradient-to-br from-blue-500/10 via-indigo-500/10 to-purple-500/10 border border-white/20 dark:border-white/5 backdrop-blur-xl shadow-xl shrink-0">
                <div className="space-y-4 w-full">
                    <div className="flex justify-between items-start w-full">
                        <div>
                            <div className="flex items-center gap-2 text-blue-500 dark:text-blue-400 mb-2">
                                <Sparkles className="w-5 h-5" />
                                <span className="font-semibold tracking-wide uppercase text-xs">AI Assistant</span>
                            </div>
                            <h2 className="text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-300 dark:to-purple-300">
                                Smart Agent
                            </h2>
                            <p className="text-muted-foreground mt-2 max-w-lg">
                                AI-powered scheduling and grade prediction to optimize your learning path.
                            </p>
                        </div>
                    </div>

                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className="bg-background/50 backdrop-blur-md border p-1 rounded-full w-full max-w-md mx-auto md:mx-0">
                            <TabsTrigger value="scheduler" className="rounded-full flex-1 data-[state=active]:bg-blue-100 dark:data-[state=active]:bg-blue-900/30 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-300">
                                <Brain className="w-4 h-4 mr-2" /> Scheduler
                            </TabsTrigger>
                            <TabsTrigger value="predictor" className="rounded-full flex-1 data-[state=active]:bg-purple-100 dark:data-[state=active]:bg-purple-900/30 data-[state=active]:text-purple-600 dark:data-[state=active]:text-purple-300">
                                <TrendingUp className="w-4 h-4 mr-2" /> Grade AI
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-hidden">
                {activeTab === 'scheduler' ? (
                    <div className="h-full overflow-y-auto pr-2">
                        <RLSchedulerView />
                    </div>
                ) : (
                    <div className="h-full overflow-y-auto pr-2">
                        <div className="p-1"> <GradePredictorView /> </div>
                    </div>
                )}
            </div>
        </div>
    );
}
