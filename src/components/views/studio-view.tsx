'use client';

import { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { CodeView } from './code-view';
import { MathView } from './math-view';
import { FocusTimer } from '../focus-timer';
import { Code2, Calculator, FlaskConical, Timer } from 'lucide-react';

export function StudioView() {
    const [activeTab, setActiveTab] = useState('focus');

    return (
        <div className="h-full p-2 md:p-6 space-y-6 flex flex-col">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 p-8 rounded-3xl bg-gradient-to-br from-emerald-500/10 via-teal-500/10 to-cyan-500/10 border border-white/20 dark:border-white/5 backdrop-blur-xl shadow-xl shrink-0">
                <div className="space-y-4 w-full">
                    <div className="flex justify-between items-start w-full">
                        <div>
                            <div className="flex items-center gap-2 text-teal-500 dark:text-teal-400 mb-2">
                                <FlaskConical className="w-5 h-5" />
                                <span className="font-semibold tracking-wide uppercase text-xs">Problem Solving Studio</span>
                            </div>
                            <h2 className="text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-cyan-600 dark:from-emerald-300 dark:to-cyan-300">
                                The Lab
                            </h2>
                            <p className="text-muted-foreground mt-2 max-w-lg">
                                Solve complex problems with AI-assisted math and code environments.
                            </p>
                        </div>
                    </div>

                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className="bg-background/50 backdrop-blur-md border p-1 rounded-full w-full max-w-lg mx-auto md:mx-0">
                            <TabsTrigger value="focus" className="rounded-full flex-1 data-[state=active]:bg-orange-100 dark:data-[state=active]:bg-orange-900/30 data-[state=active]:text-orange-600 dark:data-[state=active]:text-orange-300">
                                <Timer className="w-4 h-4 mr-2" /> Focus Zone
                            </TabsTrigger>
                            <TabsTrigger value="math" className="rounded-full flex-1 data-[state=active]:bg-teal-100 dark:data-[state=active]:bg-teal-900/30 data-[state=active]:text-teal-600 dark:data-[state=active]:text-teal-300">
                                <Calculator className="w-4 h-4 mr-2" /> Math Solver
                            </TabsTrigger>
                            <TabsTrigger value="code" className="rounded-full flex-1 data-[state=active]:bg-cyan-100 dark:data-[state=active]:bg-cyan-900/30 data-[state=active]:text-cyan-600 dark:data-[state=active]:text-cyan-300">
                                <Code2 className="w-4 h-4 mr-2" /> Code Lab
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-hidden">
                {activeTab === 'focus' && (
                    <div className="h-full overflow-y-auto pr-2 pb-20 md:pb-0 flex items-center justify-center">
                        <FocusTimer />
                    </div>
                )}
                {activeTab === 'math' && (
                    <div className="h-full overflow-y-auto pr-2 pb-20 md:pb-0">
                        <MathView />
                    </div>
                )}
                {activeTab === 'code' && (
                    <div className="h-full overflow-y-auto pr-2 pb-20 md:pb-0">
                        <CodeView />
                    </div>
                )}
            </div>
        </div>
    );
}
