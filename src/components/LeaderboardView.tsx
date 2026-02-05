import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Trophy, Medal, Crown, User, Users,
    ArrowLeft
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useEwasteStore } from '@/store/ewasteStore';
import { cn } from '@/lib/utils';

type LeaderboardPeriod = 'weekly' | 'monthly' | 'allTime';

interface LeaderboardEntry {
    userId: string;
    userName: string;
    points: number;
    itemsRecycled: number;
    rank: number;
    avatar?: string;
}

// Generate mock leaderboard data
const generateLeaderboard = (currentUser: any, period: LeaderboardPeriod): LeaderboardEntry[] => {
    const mockUsers = [
        { name: 'Priya Sharma', points: 2850, items: 28 },
        { name: 'Rahul Verma', points: 2650, items: 24 },
        { name: 'Ananya Patel', points: 2400, items: 22 },
        { name: 'Arjun Singh', points: 2200, items: 20 },
        { name: 'Sneha Reddy', points: 2100, items: 19 },
        { name: 'Vikram Kumar', points: 1950, items: 18 },
        { name: 'Kavya Nair', points: 1800, items: 16 },
        { name: 'Rohan Gupta', points: 1650, items: 15 },
        { name: 'Ishita Joshi', points: 1500, items: 14 },
        { name: 'Aditya Mehta', points: 1350, items: 12 }
    ];

    // Adjust points based on period
    const multiplier = period === 'weekly' ? 0.3 : period === 'monthly' ? 0.7 : 1;

    const leaderboard: LeaderboardEntry[] = mockUsers.map((user, idx) => ({
        userId: `user-${idx}`,
        userName: user.name,
        points: Math.round(user.points * multiplier),
        itemsRecycled: Math.round(user.items * multiplier),
        rank: idx + 1
    }));

    // Insert current user
    if (currentUser) {
        const userPoints = Math.round(currentUser.points * multiplier);
        const userItems = Math.round(currentUser.recyclingHistory.length * multiplier);

        // Find rank based on points
        let userRank = leaderboard.findIndex(entry => entry.points < userPoints) + 1;
        if (userRank === 0) userRank = leaderboard.length + 1;

        const currentUserEntry: LeaderboardEntry = {
            userId: currentUser.id,
            userName: currentUser.name,
            points: userPoints,
            itemsRecycled: userItems,
            rank: userRank
        };

        // Insert at correct position
        if (userRank <= leaderboard.length) {
            leaderboard.splice(userRank - 1, 0, currentUserEntry);
            // Update ranks
            leaderboard.forEach((entry, idx) => entry.rank = idx + 1);
        } else {
            leaderboard.push(currentUserEntry);
        }
    }

    return leaderboard.slice(0, 50); // Top 50
};

export default function LeaderboardView() {
    const navigate = useNavigate();
    const { currentUser } = useEwasteStore();
    const [period, setPeriod] = useState<LeaderboardPeriod>('weekly');
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [pullDistance, setPullDistance] = useState(0);
    const [touchStart, setTouchStart] = useState(0);

    useEffect(() => {
        if (currentUser) {
            setLeaderboard(generateLeaderboard(currentUser, period));
        }
    }, [currentUser, period]);

    // Pull to refresh handlers
    const handleTouchStart = (e: React.TouchEvent) => {
        setTouchStart(e.touches[0].clientY);
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        const currentTouch = e.touches[0].clientY;
        const distance = currentTouch - touchStart;

        // Only allow pull down when at top of page
        if (window.scrollY === 0 && distance > 0) {
            setPullDistance(Math.min(distance, 150));
        }
    };

    const handleTouchEnd = () => {
        if (pullDistance > 80) {
            setIsRefreshing(true);
            // Simulate refresh
            setTimeout(() => {
                if (currentUser) {
                    setLeaderboard(generateLeaderboard(currentUser, period));
                }
                setIsRefreshing(false);
                setPullDistance(0);
            }, 1000);
        } else {
            setPullDistance(0);
        }
    };

    const currentUserEntry = leaderboard.find(entry => entry.userId === currentUser?.id);
    const top3 = leaderboard.slice(0, 3);
    const rest = leaderboard.slice(3);

    const getRankIcon = (rank: number) => {
        if (rank === 1) return <Crown className="h-5 w-5 text-yellow-500" />;
        if (rank === 2) return <Medal className="h-5 w-5 text-gray-400" />;
        if (rank === 3) return <Medal className="h-5 w-5 text-amber-600" />;
        return null;
    };

    const getRankColor = (rank: number) => {
        if (rank === 1) return 'from-yellow-400 to-yellow-600';
        if (rank === 2) return 'from-gray-300 to-gray-500';
        if (rank === 3) return 'from-amber-400 to-amber-600';
        return 'from-gray-100 to-gray-200';
    };

    return (
        <div
            className="min-h-screen bg-gray-50 pb-6"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
        >
            {/* Pull to Refresh Indicator */}
            {pullDistance > 0 && (
                <div
                    className="fixed top-0 left-0 right-0 flex justify-center items-center z-50 transition-all"
                    style={{
                        height: `${pullDistance}px`,
                        opacity: pullDistance / 100
                    }}
                >
                    <div className="bg-white rounded-full p-3 shadow-lg">
                        {isRefreshing ? (
                            <div className="h-6 w-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <ArrowLeft className="h-6 w-6 text-purple-600 transform rotate-90" />
                        )}
                    </div>
                </div>
            )}
            {/* Header */}
            <div className="bg-gradient-to-br from-purple-600 to-pink-600 text-white p-6 rounded-b-3xl shadow-lg">
                <Button
                    variant="ghost"
                    size="icon"
                    className="text-white hover:bg-white/20 mb-4"
                    onClick={() => navigate('/')}
                >
                    <ArrowLeft className="h-5 w-5" />
                </Button>

                <div className="flex items-center gap-3 mb-4">
                    <div className="h-14 w-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur">
                        <Trophy className="h-7 w-7" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold">Leaderboard</h1>
                        <p className="text-purple-100">Top recyclers</p>
                    </div>
                </div>

                {/* Period Selector */}
                <div className="flex gap-2 bg-white/10 backdrop-blur rounded-xl p-1">
                    {(['weekly', 'monthly', 'allTime'] as LeaderboardPeriod[]).map((p) => (
                        <button
                            key={p}
                            onClick={() => setPeriod(p)}
                            className={cn(
                                "flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all",
                                period === p
                                    ? "bg-white text-purple-600 shadow-lg"
                                    : "text-white/80 hover:text-white"
                            )}
                        >
                            {p === 'allTime' ? 'All Time' : p.charAt(0).toUpperCase() + p.slice(1)}
                        </button>
                    ))}
                </div>

                {/* Weekly Rewards Banner */}
                {period === 'weekly' && (
                    <div className="mt-4 bg-white/10 backdrop-blur rounded-xl p-3">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-semibold text-white">🏆 Weekly Prizes</p>
                            <p className="text-xs text-white/80">Resets in 3 days</p>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                            <div className="bg-yellow-500/20 rounded-lg p-2 text-center border border-yellow-400/30">
                                <p className="text-lg font-bold text-yellow-300">750</p>
                                <p className="text-xs text-yellow-200">1st Place</p>
                            </div>
                            <div className="bg-gray-400/20 rounded-lg p-2 text-center border border-gray-300/30">
                                <p className="text-lg font-bold text-gray-200">500</p>
                                <p className="text-xs text-gray-300">2nd Place</p>
                            </div>
                            <div className="bg-amber-600/20 rounded-lg p-2 text-center border border-amber-500/30">
                                <p className="text-lg font-bold text-amber-300">300</p>
                                <p className="text-xs text-amber-200">3rd Place</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="px-4 space-y-4 mt-6">
                {/* Current User Rank */}
                {currentUserEntry && (
                    <Card className="border-2 border-emerald-500 shadow-lg">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="h-12 w-12 bg-emerald-100 rounded-full flex items-center justify-center">
                                        <User className="h-6 w-6 text-emerald-600" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-900">Your Rank</p>
                                        <p className="text-sm text-gray-500">{currentUserEntry.itemsRecycled} items recycled</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="flex items-center gap-2 justify-end mb-1">
                                        {getRankIcon(currentUserEntry.rank)}
                                        <p className="text-2xl font-bold text-gray-900">#{currentUserEntry.rank}</p>
                                    </div>
                                    <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                                        {currentUserEntry.points} pts
                                    </Badge>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Podium (Top 3) */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                    {/* 2nd Place */}
                    {top3[1] && (
                        <div className="flex flex-col items-center pt-8">
                            <div className={cn("h-16 w-16 rounded-full bg-gradient-to-br flex items-center justify-center shadow-lg mb-2", getRankColor(2))}>
                                <Medal className="h-8 w-8 text-white" />
                            </div>
                            <p className="text-xs font-semibold text-gray-900 text-center truncate w-full">{top3[1].userName.split(' ')[0]}</p>
                            <p className="text-lg font-bold text-gray-900">{top3[1].points}</p>
                            <Badge variant="outline" className="text-xs bg-gray-100 border-gray-200 mt-1">
                                #2
                            </Badge>
                            {period === 'weekly' && (
                                <Badge className="text-xs bg-gray-300 text-gray-900 mt-1 font-bold">
                                    +500 pts
                                </Badge>
                            )}
                        </div>
                    )}

                    {/* 1st Place */}
                    {top3[0] && (
                        <div className="flex flex-col items-center">
                            <Crown className="h-6 w-6 text-yellow-500 mb-1 animate-bounce" />
                            <div className={cn("h-20 w-20 rounded-full bg-gradient-to-br flex items-center justify-center shadow-xl mb-2", getRankColor(1))}>
                                <Trophy className="h-10 w-10 text-white" />
                            </div>
                            <p className="text-sm font-bold text-gray-900 text-center truncate w-full">{top3[0].userName.split(' ')[0]}</p>
                            <p className="text-xl font-bold text-yellow-600">{top3[0].points}</p>
                            <Badge className="text-xs bg-yellow-500 text-white mt-1">
                                #1
                            </Badge>
                            {period === 'weekly' && (
                                <Badge className="text-xs bg-yellow-400 text-yellow-900 mt-1 font-bold">
                                    +750 pts
                                </Badge>
                            )}
                        </div>
                    )}

                    {/* 3rd Place */}
                    {top3[2] && (
                        <div className="flex flex-col items-center pt-8">
                            <div className={cn("h-16 w-16 rounded-full bg-gradient-to-br flex items-center justify-center shadow-lg mb-2", getRankColor(3))}>
                                <Medal className="h-8 w-8 text-white" />
                            </div>
                            <p className="text-xs font-semibold text-gray-900 text-center truncate w-full">{top3[2].userName.split(' ')[0]}</p>
                            <p className="text-lg font-bold text-gray-900">{top3[2].points}</p>
                            <Badge variant="outline" className="text-xs bg-amber-50 border-amber-200 text-amber-700 mt-1">
                                #3
                            </Badge>
                            {period === 'weekly' && (
                                <Badge className="text-xs bg-amber-400 text-amber-900 mt-1 font-bold">
                                    +300 pts
                                </Badge>
                            )}
                        </div>
                    )}
                </div>

                {/* Rest of Leaderboard */}
                <div className="space-y-2">
                    <h2 className="font-bold text-gray-900 text-sm uppercase tracking-wider ml-1 flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        All Rankings
                    </h2>
                    {rest.map((entry) => {
                        const isCurrentUser = entry.userId === currentUser?.id;
                        return (
                            <Card
                                key={entry.userId}
                                className={cn(
                                    "transition-all",
                                    isCurrentUser && "ring-2 ring-emerald-500 bg-emerald-50/50"
                                )}
                            >
                                <CardContent className="p-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center font-bold text-gray-600">
                                                #{entry.rank}
                                            </div>
                                            <div>
                                                <p className={cn(
                                                    "font-semibold text-sm",
                                                    isCurrentUser ? "text-emerald-900" : "text-gray-900"
                                                )}>
                                                    {entry.userName}
                                                    {isCurrentUser && <span className="ml-2 text-xs text-emerald-600">(You)</span>}
                                                </p>
                                                <p className="text-xs text-gray-500">{entry.itemsRecycled} items</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-gray-900">{entry.points}</p>
                                            <p className="text-xs text-gray-500">points</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
