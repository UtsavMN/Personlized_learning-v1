'use server';

import { runWithRetry } from '@/ai/retry';
import { onboardingChatFlow } from '@/ai/flows/onboarding-chat';

export async function runOnboardingChat(history: any[]) {
    try {
        const result = await runWithRetry(
            () => onboardingChatFlow({ history })
        );
        return { success: true, data: result };
    } catch (error: any) {
        console.error('Onboarding Chat Error:', error);
        return { success: false, error: error.message };
    }
}
