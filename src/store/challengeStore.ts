import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ChallengeType = 'daily' | 'weekly' | 'monthly';

export interface Challenge {
    id: string;
    title: string;
    description: string;
    type: ChallengeType;
    goal: number;
    progress: number;
    reward: number; // points
    icon: string;
    expiresAt: Date;
    completed: boolean;
    claimed: boolean;
}

interface ChallengeState {
    challenges: Challenge[];
    initializeChallenges: () => void;
    updateProgress: (challengeId: string, increment: number) => void;
    claimReward: (challengeId: string) => number;
    resetExpiredChallenges: () => void;
}

// Generate fresh challenges
const generateChallenges = (): Challenge[] => {
    const now = new Date();

    // Daily challenges (expire in 24 hours)
    const dailyExpiry = new Date(now);
    dailyExpiry.setHours(23, 59, 59, 999);

    // Weekly challenges (expire on Sunday)
    const weeklyExpiry = new Date(now);
    const daysUntilSunday = 7 - now.getDay();
    weeklyExpiry.setDate(now.getDate() + daysUntilSunday);
    weeklyExpiry.setHours(23, 59, 59, 999);

    // Monthly challenges (expire at end of month)
    const monthlyExpiry = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    return [
        // Daily Challenges
        {
            id: 'daily-scan-1',
            title: 'First Scan of the Day',
            description: 'Scan 1 device today',
            type: 'daily',
            goal: 1,
            progress: 0,
            reward: 50,
            icon: 'scan',
            expiresAt: dailyExpiry,
            completed: false,
            claimed: false
        },
        {
            id: 'daily-points-100',
            title: 'Point Collector',
            description: 'Earn 100 points today',
            type: 'daily',
            goal: 100,
            progress: 0,
            reward: 75,
            icon: 'star',
            expiresAt: dailyExpiry,
            completed: false,
            claimed: false
        },

        // Weekly Challenges
        {
            id: 'weekly-items-5',
            title: 'Weekly Recycler',
            description: 'Recycle 5 items this week',
            type: 'weekly',
            goal: 5,
            progress: 0,
            reward: 300,
            icon: 'recycle',
            expiresAt: weeklyExpiry,
            completed: false,
            claimed: false
        },
        {
            id: 'weekly-streak-3',
            title: 'Consistency Champion',
            description: 'Recycle on 3 different days',
            type: 'weekly',
            goal: 3,
            progress: 0,
            reward: 250,
            icon: 'fire',
            expiresAt: weeklyExpiry,
            completed: false,
            claimed: false
        },

        // Monthly Challenge
        {
            id: 'monthly-points-1000',
            title: 'Monthly Master',
            description: 'Earn 1000 points this month',
            type: 'monthly',
            goal: 1000,
            progress: 0,
            reward: 500,
            icon: 'trophy',
            expiresAt: monthlyExpiry,
            completed: false,
            claimed: false
        }
    ];
};

export const useChallengeStore = create<ChallengeState>()(
    persist(
        (set, get) => ({
            challenges: [],

            initializeChallenges: () => {
                const { challenges } = get();

                // Initialize if empty or reset expired
                if (challenges.length === 0) {
                    set({ challenges: generateChallenges() });
                } else {
                    get().resetExpiredChallenges();
                }
            },

            updateProgress: (challengeId: string, increment: number) => {
                set(state => ({
                    challenges: state.challenges.map(challenge => {
                        if (challenge.id === challengeId && !challenge.completed) {
                            const newProgress = Math.min(challenge.progress + increment, challenge.goal);
                            const completed = newProgress >= challenge.goal;

                            return {
                                ...challenge,
                                progress: newProgress,
                                completed
                            };
                        }
                        return challenge;
                    })
                }));
            },

            claimReward: (challengeId: string) => {
                let rewardPoints = 0;

                set(state => ({
                    challenges: state.challenges.map(challenge => {
                        if (challenge.id === challengeId && challenge.completed && !challenge.claimed) {
                            rewardPoints = challenge.reward;
                            return { ...challenge, claimed: true };
                        }
                        return challenge;
                    })
                }));

                return rewardPoints;
            },

            resetExpiredChallenges: () => {
                const now = new Date();
                const { challenges } = get();

                const hasExpired = challenges.some(c => new Date(c.expiresAt) < now);

                if (hasExpired) {
                    // Remove expired and regenerate
                    const activeChallenges = challenges.filter(c => new Date(c.expiresAt) >= now);
                    const newChallenges = generateChallenges();

                    // Merge: keep active, add new ones that don't exist
                    const merged = [...activeChallenges];
                    newChallenges.forEach(newChallenge => {
                        if (!merged.find(c => c.id === newChallenge.id)) {
                            merged.push(newChallenge);
                        }
                    });

                    set({ challenges: merged });
                }
            }
        }),
        {
            name: 'challenge-storage',
            partialize: (state) => ({
                challenges: state.challenges
            })
        }
    )
);
