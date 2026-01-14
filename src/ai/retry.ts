
export async function runWithRetry<T>(
    operation: () => Promise<T>,
    retries: number = 3,
    delay: number = 2000
): Promise<T> {
    try {
        return await operation();
    } catch (error: any) {
        if (retries > 0 && (
            error.message?.includes('429') ||
            error.status === 429 ||
            error.message?.includes('quota') ||
            error.message?.includes('fetch failed') ||
            error.message?.includes('ETIMEDOUT')
        )) {
            let waitTime = delay;

            // Try to parse "retry in X s" from error message (e.g. "Please retry in 28.07s")
            const match = error.message?.match(/retry in (\d+(\.\d+)?)s/);
            if (match && match[1]) {
                // Add 1 second buffer to be safe
                waitTime = Math.ceil((parseFloat(match[1]) + 1) * 1000);
                console.warn(`Rate limit detected. API requested wait of ${match[1]}s. Waiting ${waitTime}ms...`);
            } else {
                console.warn(`Rate limited. Retrying in ${delay}ms... (${retries} retries left)`);
            }

            await new Promise(resolve => setTimeout(resolve, waitTime));

            // If we waited a specific huge time, maybe reset the delay for next hop or just continue generic backoff?
            // Let's just pass next delay (doubled) but if we just waited 30s, the next delay being 4s is fine 
            // because likely the bucket is refilled.
            return runWithRetry(operation, retries - 1, delay * 2);
        }
        throw error;
    }
}
