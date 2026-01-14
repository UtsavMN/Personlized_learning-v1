
export interface SchedulerState {
    dayOfWeek: number; // 0-6
    energyLevel: number; // 1 (Low) - 3 (High)
    previousSubject: string;
}

export type SchedulerAction = 'Math' | 'Physics' | 'Chemistry' | 'Break';

const ACTIONS: SchedulerAction[] = ['Math', 'Physics', 'Chemistry', 'Break'];

export class RLScheduler {
    private qTable: Map<string, number[]>; // StateHash -> Q-Values for Actions
    private epsilon: number = 0.3; // Exploration rate (30% random actions)
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
    private getQValues(stateHash: string): number[] {
        if (!this.qTable.has(stateHash)) {
            // Initialize with 0s
            this.qTable.set(stateHash, new Array(ACTIONS.length).fill(0));
        }
        return this.qTable.get(stateHash)!;
    }

    // Epsilon-Greedy Policy
    public suggestAction(state: SchedulerState): SchedulerAction {
        const stateHash = this.getStateHash(state);
        const qValues = this.getQValues(stateHash);

        // Explore
        if (Math.random() < this.epsilon) {
            const randomIndex = Math.floor(Math.random() * ACTIONS.length);
            return ACTIONS[randomIndex];
        }

        // Exploit (Argmax)
        let maxVal = -Infinity;
        let maxIdx = 0;
        qValues.forEach((val, idx) => {
            if (val > maxVal) {
                maxVal = val;
                maxIdx = idx;
            }
        });

        return ACTIONS[maxIdx];
    }

    // Bellman Update
    public learn(state: SchedulerState, action: SchedulerAction, reward: number, nextState: SchedulerState) {
        const stateHash = this.getStateHash(state);
        const nextStateHash = this.getStateHash(nextState);
        const actionIdx = ACTIONS.indexOf(action);

        const currentQ = this.getQValues(stateHash);
        const nextQ = this.getQValues(nextStateHash);

        // Max Q for next state
        const maxNextQ = Math.max(...nextQ);

        // Q(s,a) = Q(s,a) + alpha * (R + gamma * maxQ(s',a') - Q(s,a))
        currentQ[actionIdx] = currentQ[actionIdx] + this.alpha * (reward + this.gamma * maxNextQ - currentQ[actionIdx]);

        this.qTable.set(stateHash, currentQ);
        this.save();
    }

    public save() {
        // Convert Map to JSON array of entries for storage
        const serialized = JSON.stringify(Array.from(this.qTable.entries()));
        localStorage.setItem('mentora_rl_qtable', serialized);
    }

    public load() {
        const serialized = localStorage.getItem('mentora_rl_qtable');
        if (serialized) {
            try {
                this.qTable = new Map(JSON.parse(serialized));
            } catch (e) {
                console.error("Failed to load Q-Table", e);
                this.qTable = new Map();
            }
        }
    }
}

export const rlScheduler = new RLScheduler();
