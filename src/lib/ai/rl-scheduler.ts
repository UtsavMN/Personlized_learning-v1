
export interface SchedulerState {
    dayOfWeek: number; // 0-6
    energyLevel: number; // 1 (Low) - 3 (High)
    previousSubject: string;
}

export type SchedulerAction = string;

export class RLScheduler {
    private qTable: Map<string, Record<string, number>>; // StateHash -> { Action: QValue }
    private epsilon: number = 0.3; // Exploration rate
    private alpha: number = 0.1; // Learning rate
    private gamma: number = 0.9; // Discount factor

    constructor() {
        this.qTable = new Map();
        this.load();
    }

    // Convert State to String Hash
    private getStateHash(state: SchedulerState): string {
        return `${state.dayOfWeek}-${state.energyLevel}-${state.previousSubject}`;
    }

    // Get Q-Values for a state (Initialize if new)
    private getQValues(stateHash: string): Record<string, number> {
        if (!this.qTable.has(stateHash)) {
            // Initialize with empty object. Actions will be added as needed.
            this.qTable.set(stateHash, {});
        }
        return this.qTable.get(stateHash)!;
    }

    // Epsilon-Greedy Policy
    public async suggestAction(state: SchedulerState, availableSubjects: string[]): Promise<SchedulerAction> {
        const stateHash = this.getStateHash(state);
        const qValues = this.getQValues(stateHash);

        // Define relevant actions: All subjects + Break
        const relevantActions = [...availableSubjects, 'Break'];

        // Ensure Q-Values exist for these actions (init to 0)
        relevantActions.forEach(action => {
            if (qValues[action] === undefined) {
                qValues[action] = 0;
            }
        });

        // Explore
        if (Math.random() < this.epsilon) {
            const randomIndex = Math.floor(Math.random() * relevantActions.length);
            return relevantActions[randomIndex];
        }

        // Exploit (Argmax)
        let maxVal = -Infinity;
        let bestAction = relevantActions[0] || 'Break';

        relevantActions.forEach(action => {
            const val = qValues[action];
            if (val > maxVal) {
                maxVal = val;
                bestAction = action;
            }
        });

        return bestAction;
    }

    // Bellman Update
    public learn(state: SchedulerState, action: SchedulerAction, reward: number, nextState: SchedulerState) {
        const stateHash = this.getStateHash(state);
        const nextStateHash = this.getStateHash(nextState);

        const currentQRecord = this.getQValues(stateHash);
        const nextQRecord = this.getQValues(nextStateHash);

        const currentVal = currentQRecord[action] || 0;

        // Max Q for next state (across all known actions in that state)
        const nextValues = Object.values(nextQRecord);
        const maxNextQ = nextValues.length > 0 ? Math.max(...nextValues) : 0;

        // Q(s,a) = Q(s,a) + alpha * (R + gamma * maxQ(s',a') - Q(s,a))
        const newVal = currentVal + this.alpha * (reward + this.gamma * maxNextQ - currentVal);

        currentQRecord[action] = newVal;
        this.save();
    }

    public save() {
        if (typeof window === 'undefined') return;
        // Convert Map to JSON array
        const serialized = JSON.stringify(Array.from(this.qTable.entries()));
        localStorage.setItem('mentora_rl_qtable_v2', serialized);
    }

    public load() {
        if (typeof window === 'undefined') return;

        // Try load V2
        const serialized = localStorage.getItem('mentora_rl_qtable_v2');
        if (serialized) {
            try {
                this.qTable = new Map(JSON.parse(serialized));
                this.sanitize(); // Clean up old data on load
                return;
            } catch (e) {
                console.error("Failed to load Q-Table V2", e);
            }
        }

        // Fallback: clear old incompatible data or start fresh
        // ignoring v1 table as it was number[]
        this.qTable = new Map();
    }

    private sanitize() {
        // Remove known mock subjects from all states
        const mockSubjects = ['Math', 'Physics', 'Chemistry', 'Phys', 'Chem', 'Brea']; // 'Brea' was a typo seen in logs
        for (const [state, actions] of this.qTable.entries()) {
            let changed = false;
            for (const mock of mockSubjects) {
                if (actions[mock] !== undefined) {
                    delete actions[mock];
                    changed = true;
                }
            }
            if (actions['Break'] === undefined && actions['Brea'] !== undefined) {
                // Fix typo if exists
                actions['Break'] = actions['Brea'];
                delete actions['Brea'];
                changed = true;
            }
            if (changed) {
                this.qTable.set(state, actions);
            }
        }
        this.save();
    }

    // --- Visualization ---
    // Return format: State -> [Math, Physics, Chem, Break] is broken now.
    // Changing to flexible record
    public getQTable(): Record<string, number[]> {
        // Adapt to old visualization format if possible, or we need to update visualizer.
        // For now, let's just return values array but it loses key info.
        // Better to return the map entries.
        // But the previous return type was Record<string, number[]>
        // I will hack it to return mostly 0s to avoid breaking the UI immediately, 
        // OR better, I updated the return type to any or updated the UI?
        // I'll update the UI in settings-view.tsx as well.
        return {};
    }

    public getQTableFull(): Record<string, Record<string, number>> {
        return Object.fromEntries(this.qTable);
    }

    public reset() {
        this.qTable.clear();
        if (typeof window !== 'undefined') {
            localStorage.removeItem('mentora_rl_qtable_v2');
        }
    }
}

export const rlScheduler = new RLScheduler();
