'use client';

import * as React from 'react';
import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarRail,
    SidebarFooter,
    useSidebar,
} from '@/components/ui/sidebar';
import {
    BookText,
    Calculator,
    CalendarClock,
    Code2,
    FileUp,
    LayoutDashboard,
    Dumbbell,
    GraduationCap,
    LogOut,
    User,
    Settings,
    Brain,
    TrendingUp,
    BrainCircuit
} from 'lucide-react';
import { UserButton } from "@clerk/nextjs";
import { useLocalAuth } from '@/lib/auth-context';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import { FactoryResetWidget } from '@/components/factory-reset';

export function AppSidebar({
    activeTab,
    onTabChange
}: {
    activeTab: string;
    onTabChange: (tab: string) => void;
}) {
    const { user, logout } = useLocalAuth();
    const { isMobile } = useSidebar();

    const items = [
        {
            label: "Learning",
            items: [
                { title: 'Dashboard', icon: LayoutDashboard, value: 'dashboard' },
                { title: 'Schedule', icon: CalendarClock, value: 'timetable' },
                { title: 'Documents', icon: FileUp, value: 'documents' },
            ]
        },
        {
            label: "Practice",
            items: [
                { title: 'The Gym', icon: Dumbbell, value: 'gym' },
                { title: 'Math Solver', icon: Calculator, value: 'math' },
                { title: 'Code Lab', icon: Code2, value: 'code' },
                { title: 'Pulse', icon: Brain, value: 'flashcards' },
                { title: 'Grade AI', icon: TrendingUp, value: 'predictor' },
                { title: 'Smart Agent', icon: BrainCircuit, value: 'rl-agent' },
            ]
        },
        {
            label: "Community",
            items: [
                { title: 'AI Tutor', icon: BookText, value: 'chat' },
                { title: 'Profile', icon: User, value: 'settings' },
            ]
        }
    ];

    return (
        <Sidebar collapsible="icon">
            <SidebarHeader>
                <div className="flex items-center gap-2 px-4 py-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                        <GraduationCap className="size-5" />
                    </div>
                    <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                        <span className="truncate font-semibold">NIE Guide</span>
                        <span className="truncate text-xs">Campus Assistant</span>
                    </div>
                </div>
            </SidebarHeader>

            <SidebarContent>
                {items.map((group) => (
                    <SidebarGroup key={group.label}>
                        <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
                        <SidebarGroupContent>
                            <SidebarMenu>
                                {group.items.map((item) => (
                                    <SidebarMenuItem key={item.value}>
                                        <SidebarMenuButton
                                            isActive={activeTab === item.value}
                                            onClick={() => onTabChange(item.value)}
                                            tooltip={item.title}
                                        >
                                            <item.icon />
                                            <span>{item.title}</span>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                ))}
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>
                ))}
            </SidebarContent>

            <SidebarFooter>
                <SidebarMenu>
                    <GamificationStats />
                    <div className="p-4 flex items-center gap-3">
                        {/* In Dev Mode, show local avatar. In Prod, show Clerk. */}
                        {user?.uid === 'dev_utsav' ? (
                            <div className="flex items-center gap-2">
                                <img src={user.photoURL || ""} className="w-8 h-8 rounded-full bg-muted" />
                                <div className="text-xs">
                                    <p className="font-semibold">{user.displayName}</p>
                                    <p className="text-muted-foreground">Dev Mode</p>
                                </div>
                            </div>
                        ) : (
                            <SignedIn>
                                <UserButton
                                    showName={true}
                                    appearance={{
                                        elements: {
                                            userButtonBox: "flex flex-row-reverse",
                                            userButtonOuterIdentifier: "font-semibold text-sm truncate pl-2",
                                            avatarBox: "h-9 w-9"
                                        }
                                    }}
                                />
                                <div className="text-xs text-muted-foreground">
                                    {user?.displayName}
                                </div>
                            </SignedIn>
                        )}
                    </div>
                </SidebarMenu>
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    );
}

import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";

function GamificationStats() {
    const stats = useLiveQuery(async () => {
        const mastery = await db.subjectMastery.toArray();
        const totalXP = mastery.reduce((sum: number, item: any) => sum + (item.xp || 0), 0);

        // Simple Level Formula: Level = Floor(Sqrt(XP / 100)) + 1
        // Level 1: 0-99, Level 2: 100-399, Level 3: 400-899
        let level = Math.floor(Math.sqrt(totalXP / 100)) + 1;

        // Calculate progress to next level
        const nextLevelXP = Math.pow(level, 2) * 100;
        const prevLevelXP = Math.pow(level - 1, 2) * 100;
        const progress = ((totalXP - prevLevelXP) / (nextLevelXP - prevLevelXP)) * 100;

        return { totalXP, level, progress };
    });

    if (!stats) return null;

    return (
        <div className="px-4 py-2 group-data-[collapsible=icon]:hidden">
            <div className="flex justify-between items-center text-xs mb-1">
                <span className="font-semibold text-primary">Lvl {stats.level}</span>
                <span className="text-muted-foreground">{Math.round(stats.totalXP)} XP</span>
            </div>
            <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                <div
                    className="h-full bg-yellow-500 transition-all duration-1000"
                    style={{ width: `${Math.min(100, Math.max(0, stats.progress))}%` }}
                />
            </div>
        </div>
    );
}
