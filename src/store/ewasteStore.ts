import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ClassificationResult, RecycleRecord, Badge, User, RewardData } from '@/types/ewaste';
import { DeviceType } from '@/types/ewaste';
import { valueEngine } from '@/services/valueEngine';

interface EwasteState {
    // User state (persisted)
    currentUser: User | null;

    // Session state (not persisted)
    currentScan: ClassificationResult | null;
    currentCondition: number;
    pendingReward: RewardData | null;

    // Actions
    setUser: (user: User) => void;
    registerUser: (name: string, email: string, password: string) => { success: boolean; error?: string };
    loginUser: (email: string, password: string) => { success: boolean; error?: string };
    setScanResult: (result: ClassificationResult) => void;
    setCondition: (condition: number) => void;
    confirmDisposal: (confirmed: boolean, manualType?: DeviceType) => void;
    completeSession: () => void;
    resetSession: () => void;
    logout: () => void;
    seedDemoData: () => void;
}

export const useEwasteStore = create<EwasteState>()(
    persist(
        (set, get) => ({
            currentUser: null,
            currentScan: null,
            currentCondition: 0.5,
            pendingReward: null,

            setUser: (user) => set({ currentUser: user }),

            registerUser: (name, email, password) => {
                // Get existing users from localStorage
                const usersData = localStorage.getItem('ewaste-users');
                const users: Record<string, { name: string; email: string; password: string }> = usersData ? JSON.parse(usersData) : {};

                // Check if email already exists
                if (users[email.toLowerCase()]) {
                    return { success: false, error: 'Email already registered' };
                }

                // Validate email format
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(email)) {
                    return { success: false, error: 'Invalid email format' };
                }

                // Validate password
                if (password.length < 6) {
                    return { success: false, error: 'Password must be at least 6 characters' };
                }

                // Store user credentials
                users[email.toLowerCase()] = { name, email, password };
                localStorage.setItem('ewaste-users', JSON.stringify(users));

                // Create user profile
                const newUser: User = {
                    id: `user-${Date.now()}`,
                    name,
                    email,
                    points: 0,
                    badges: [],
                    recyclingHistory: [],
                    co2Saved: 0,
                    favoriteCategory: DeviceType.SMARTPHONE
                };

                set({ currentUser: newUser });
                return { success: true };
            },

            loginUser: (email, password) => {
                // Get existing users from localStorage
                const usersData = localStorage.getItem('ewaste-users');
                const users: Record<string, { name: string; email: string; password: string }> = usersData ? JSON.parse(usersData) : {};

                const userCreds = users[email.toLowerCase()];

                // Check if user exists
                if (!userCreds) {
                    return { success: false, error: 'Email not found' };
                }

                // Check password
                if (userCreds.password !== password) {
                    return { success: false, error: 'Incorrect password' };
                }

                // Check if user profile exists in store
                const { currentUser } = get();
                if (currentUser && currentUser.email === email) {
                    return { success: true };
                }

                // Create/restore user profile
                const user: User = {
                    id: `user-${email.toLowerCase()}`,
                    name: userCreds.name,
                    email: userCreds.email,
                    points: 0,
                    badges: [],
                    recyclingHistory: [],
                    co2Saved: 0,
                    favoriteCategory: DeviceType.SMARTPHONE
                };

                set({ currentUser: user });
                return { success: true };
            },

            setScanResult: (result) => set({ currentScan: result }),

            setCondition: (condition) => set({ currentCondition: condition }),

            confirmDisposal: (confirmed, manualType) => {
                const { currentScan, currentCondition, currentUser } = get();
                if (!currentScan) return;

                const finalType = confirmed ? currentScan.deviceType : (manualType || currentScan.deviceType);

                // Calculate value
                const { breakdown } = valueEngine.calculateValue(
                    finalType,
                    currentScan.suggestedCategory,
                    currentScan.estimatedWeight,
                    currentCondition
                );

                // Calculate points
                const points = valueEngine.calculatePoints(
                    currentScan.estimatedWeight,
                    currentScan.suggestedCategory
                );

                // Check for new badges
                const newBadges = currentUser
                    ? valueEngine.checkBadges(
                        currentUser.points + points,
                        currentUser.recyclingHistory,
                        currentUser.badges.map(b => b.name)
                    )
                    : [];

                set({
                    pendingReward: {
                        points,
                        weight: currentScan.estimatedWeight,
                        materialBonus: breakdown.materialBonus,
                        newBadges,
                        valueBreakdown: breakdown
                    }
                });
            },

            completeSession: () => {
                const { pendingReward, currentUser, currentScan } = get();
                if (!pendingReward || !currentUser || !currentScan) return;

                const newRecord: RecycleRecord = {
                    id: `rec-${Date.now()}`,
                    itemType: currentScan.deviceType,
                    weight: Math.round(currentScan.estimatedWeight * 1000), // Convert to grams
                    pointsEarned: pendingReward.points,
                    depositedAt: new Date(),
                    binId: 'BIN-DEMO-001'
                };

                const newBadges: Badge[] = pendingReward.newBadges.map(name => ({
                    id: `badge-${Date.now()}-${name.replace(/\s/g, '')}`,
                    name,
                    description: getBadgeDescription(name),
                    icon: getBadgeIcon(name),
                    earnedAt: new Date()
                }));

                const co2Saved = valueEngine.estimateCO2Saved(
                    currentScan.estimatedWeight,
                    currentScan.deviceType
                );

                set({
                    currentUser: {
                        ...currentUser,
                        points: currentUser.points + pendingReward.points,
                        badges: [...currentUser.badges, ...newBadges],
                        recyclingHistory: [newRecord, ...currentUser.recyclingHistory],
                        co2Saved: currentUser.co2Saved + co2Saved
                    },
                    currentScan: null,
                    currentCondition: 0.5,
                    pendingReward: null
                });

                // Update challenge progress
                try {
                    const { useChallengeStore } = require('@/store/challengeStore');
                    const { updateProgress } = useChallengeStore.getState();

                    // Update scan challenge
                    updateProgress('daily-scan-1', 1);
                    updateProgress('weekly-items-5', 1);

                    // Update points challenge
                    updateProgress('daily-points-100', pendingReward.points);
                    updateProgress('monthly-points-1000', pendingReward.points);
                } catch (e) {
                    console.error('Failed to update challenge progress:', e);
                }
            },

            resetSession: () => set({
                currentScan: null,
                currentCondition: 0.5,
                pendingReward: null
            }),

            logout: () => set({ currentUser: null, currentScan: null, pendingReward: null }),

            seedDemoData: () => {
                const { currentUser } = get();
                if (!currentUser) return;

                // Generate demo recycling history (last 30 days)
                const demoHistory: RecycleRecord[] = [];
                const deviceTypes: DeviceType[] = [DeviceType.SMARTPHONE, DeviceType.LAPTOP, DeviceType.TABLET, DeviceType.BATTERY, DeviceType.CHARGER];

                for (let i = 0; i < 15; i++) {
                    const daysAgo = Math.floor(Math.random() * 30);
                    const date = new Date();
                    date.setDate(date.getDate() - daysAgo);

                    const deviceType = deviceTypes[Math.floor(Math.random() * deviceTypes.length)];
                    const points = Math.floor(Math.random() * 400) + 100;

                    demoHistory.push({
                        id: `rec-demo-${i}`,
                        itemType: deviceType,
                        weight: Math.floor(Math.random() * 500) + 100,
                        pointsEarned: points,
                        depositedAt: date,
                        binId: `BIN-DEMO-${Math.floor(Math.random() * 5) + 1}`
                    });
                }

                // Generate demo badges
                const demoBadges: Badge[] = [
                    {
                        id: 'badge-first',
                        name: 'First Steps',
                        description: 'Recycled your first device',
                        icon: '🌱',
                        earnedAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000)
                    },
                    {
                        id: 'badge-eco-warrior',
                        name: 'Eco Warrior',
                        description: 'Recycled 10 devices',
                        icon: '🌍',
                        earnedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000)
                    },
                    {
                        id: 'badge-tech-saver',
                        name: 'Tech Saver',
                        description: 'Saved 5kg of e-waste',
                        icon: '💚',
                        earnedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)
                    },
                    {
                        id: 'badge-champion',
                        name: 'Recycling Champion',
                        description: 'Earned 2000 points',
                        icon: '🏆',
                        earnedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
                    }
                ];

                // Calculate totals
                const totalPoints = demoHistory.reduce((sum, r) => sum + r.pointsEarned, 0) + 500;
                const totalCO2 = demoHistory.reduce((sum, r) => sum + (r.weight / 1000) * 2.5, 0) + 12;

                set({
                    currentUser: {
                        ...currentUser,
                        points: totalPoints,
                        badges: demoBadges,
                        recyclingHistory: demoHistory,
                        co2Saved: Math.round(totalCO2)
                    }
                });
            }
        }),
        {
            name: 'ewaste-storage',
            partialize: (state) => ({
                currentUser: state.currentUser
            })
        }
    )
);

// Helper functions
function getBadgeDescription(name: string): string {
    const descriptions: Record<string, string> = {
        'Eco Starter': 'Earned your first 100 points',
        'Recycler': 'Reached 500 points',
        'Green Champion': 'Reached 1,000 points',
        'Eco Warrior': 'Reached 2,500 points',
        'Planet Guardian': 'Reached 5,000 points',
        'Sustainability Hero': 'Reached 10,000 points',
        'First Five': 'Recycled 5 items',
        'Double Digits': 'Recycled 10 items',
        'Quarter Century': 'Recycled 25 items',
        'Phone Recycler': 'Recycled 5 phones',
        'Battery Specialist': 'Recycled 10 batteries'
    };
    return descriptions[name] || 'Achievement unlocked!';
}

function getBadgeIcon(name: string): string {
    const icons: Record<string, string> = {
        'Eco Starter': 'leaf',
        'Recycler': 'recycle',
        'Green Champion': 'trophy',
        'Eco Warrior': 'shield',
        'Planet Guardian': 'globe',
        'Sustainability Hero': 'star',
        'First Five': 'check-circle',
        'Double Digits': 'award',
        'Quarter Century': 'medal',
        'Phone Recycler': 'smartphone',
        'Battery Specialist': 'battery'
    };
    return icons[name] || 'award';
}
