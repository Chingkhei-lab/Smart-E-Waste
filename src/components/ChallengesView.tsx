import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Trophy, Flame, Star, Recycle, Scan, Gift,
    ChevronRight, Clock, CheckCircle2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useChallengeStore, Challenge, ChallengeType } from '@/store/challengeStore';
import { useEwasteStore } from '@/store/ewasteStore';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const ICON_MAP: Record<string, React.ElementType> = {
    trophy: Trophy,
    fire: Flame,
    star: Star,
    recycle: Recycle,
    scan: Scan,
    gift: Gift
};

const TYPE_COLORS: Record<ChallengeType, { bg: string; text: string; border: string }> = {
    daily: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
    weekly: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
    monthly: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' }
};

export default function ChallengesView() {
    const navigate = useNavigate();
    const { challenges, initializeChallenges, claimReward, resetExpiredChallenges } = useChallengeStore();
    const { currentUser, setUser } = useEwasteStore();

    useEffect(() => {
        initializeChallenges();
        resetExpiredChallenges();
    }, [initializeChallenges, resetExpiredChallenges]);

    const handleClaimReward = (challenge: Challenge) => {
        if (!challenge.completed || challenge.claimed) return;

        const rewardPoints = claimReward(challenge.id);

        if (currentUser && rewardPoints > 0) {
            setUser({
                ...currentUser,
                points: currentUser.points + rewardPoints
            });

            toast.success(`🎉 Claimed ${rewardPoints} points!`, {
                description: challenge.title
            });
        }
    };

    const getTimeRemaining = (expiresAt: Date) => {
        const now = new Date();
        const expiry = new Date(expiresAt);
        const diff = expiry.getTime() - now.getTime();

        if (diff < 0) return 'Expired';

        const hours = Math.floor(diff / (1000 * 60 * 60));
        const days = Math.floor(hours / 24);

        if (days > 0) return `${days}d left`;
        if (hours > 0) return `${hours}h left`;
        return 'Ending soon';
    };

    const activeChallenges = challenges.filter(c => new Date(c.expiresAt) >= new Date());
    const dailyChallenges = activeChallenges.filter(c => c.type === 'daily');
    const weeklyChallenges = activeChallenges.filter(c => c.type === 'weekly');
    const monthlyChallenges = activeChallenges.filter(c => c.type === 'monthly');

    const renderChallenge = (challenge: Challenge) => {
        const Icon = ICON_MAP[challenge.icon] || Star;
        const colors = TYPE_COLORS[challenge.type];
        const progressPercent = (challenge.progress / challenge.goal) * 100;
        const timeLeft = getTimeRemaining(challenge.expiresAt);

        return (
            <Card
                key={challenge.id}
                className={cn(
                    "overflow-hidden transition-all",
                    challenge.completed && !challenge.claimed && "ring-2 ring-emerald-500 ring-offset-2"
                )}
            >
                <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                        {/* Icon */}
                        <div className={cn(
                            "h-12 w-12 rounded-xl flex items-center justify-center flex-shrink-0",
                            colors.bg
                        )}>
                            <Icon className={cn("h-6 w-6", colors.text)} />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-1">
                                <h3 className="font-semibold text-gray-900 text-sm leading-tight">
                                    {challenge.title}
                                </h3>
                                <Badge
                                    variant="outline"
                                    className={cn("text-xs capitalize flex-shrink-0", colors.border, colors.text, colors.bg)}
                                >
                                    {challenge.type}
                                </Badge>
                            </div>

                            <p className="text-xs text-gray-500 mb-3">{challenge.description}</p>

                            {/* Progress */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-gray-600">
                                        {challenge.progress}/{challenge.goal}
                                    </span>
                                    <span className="text-gray-400 flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        {timeLeft}
                                    </span>
                                </div>
                                <Progress value={progressPercent} className="h-2" />
                            </div>

                            {/* Reward & Action */}
                            <div className="flex items-center justify-between mt-3">
                                <div className="flex items-center gap-1 text-emerald-600 font-semibold text-sm">
                                    <Gift className="h-4 w-4" />
                                    +{challenge.reward} pts
                                </div>

                                {challenge.completed && !challenge.claimed ? (
                                    <Button
                                        size="sm"
                                        className="bg-emerald-600 hover:bg-emerald-700 h-8"
                                        onClick={() => handleClaimReward(challenge)}
                                    >
                                        <CheckCircle2 className="h-4 w-4 mr-1" />
                                        Claim
                                    </Button>
                                ) : challenge.claimed ? (
                                    <Badge variant="outline" className="bg-gray-50 text-gray-500 border-gray-200">
                                        Claimed ✓
                                    </Badge>
                                ) : (
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-8"
                                        onClick={() => navigate('/scan')}
                                    >
                                        Start
                                        <ChevronRight className="h-4 w-4 ml-1" />
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    };

    return (
        <div className="space-y-6 pb-6">
            {/* Header */}
            <div className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white p-6 rounded-b-3xl shadow-lg">
                <div className="flex items-center gap-3 mb-2">
                    <div className="h-12 w-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur">
                        <Trophy className="h-6 w-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold">Challenges</h1>
                        <p className="text-emerald-100 text-sm">Complete tasks, earn rewards</p>
                    </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-3 gap-3 mt-4">
                    <div className="bg-white/10 backdrop-blur rounded-xl p-3 text-center">
                        <p className="text-2xl font-bold">{activeChallenges.filter(c => c.completed).length}</p>
                        <p className="text-xs text-emerald-100">Completed</p>
                    </div>
                    <div className="bg-white/10 backdrop-blur rounded-xl p-3 text-center">
                        <p className="text-2xl font-bold">{activeChallenges.length}</p>
                        <p className="text-xs text-emerald-100">Active</p>
                    </div>
                    <div className="bg-white/10 backdrop-blur rounded-xl p-3 text-center">
                        <p className="text-2xl font-bold">
                            {activeChallenges.filter(c => c.completed && !c.claimed).reduce((sum, c) => sum + c.reward, 0)}
                        </p>
                        <p className="text-xs text-emerald-100">To Claim</p>
                    </div>
                </div>
            </div>

            <div className="px-4 space-y-6">
                {/* Daily Challenges */}
                {dailyChallenges.length > 0 && (
                    <div>
                        <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                            <Flame className="h-5 w-5 text-orange-500" />
                            Daily Challenges
                        </h2>
                        <div className="space-y-3">
                            {dailyChallenges.map(renderChallenge)}
                        </div>
                    </div>
                )}

                {/* Weekly Challenges */}
                {weeklyChallenges.length > 0 && (
                    <div>
                        <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                            <Star className="h-5 w-5 text-purple-500" />
                            Weekly Challenges
                        </h2>
                        <div className="space-y-3">
                            {weeklyChallenges.map(renderChallenge)}
                        </div>
                    </div>
                )}

                {/* Monthly Challenges */}
                {monthlyChallenges.length > 0 && (
                    <div>
                        <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                            <Trophy className="h-5 w-5 text-amber-500" />
                            Monthly Challenges
                        </h2>
                        <div className="space-y-3">
                            {monthlyChallenges.map(renderChallenge)}
                        </div>
                    </div>
                )}

                {activeChallenges.length === 0 && (
                    <div className="text-center py-12">
                        <div className="h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Trophy className="h-8 w-8 text-gray-400" />
                        </div>
                        <p className="text-gray-500 font-medium">No active challenges</p>
                        <p className="text-sm text-gray-400 mt-1">Check back soon for new challenges!</p>
                    </div>
                )}
            </div>
        </div>
    );
}
