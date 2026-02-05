import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    User, LogOut, Award, Gift, CreditCard, ArrowRightLeft,
    ChevronRight, Wallet, ShoppingBag, Coffee, Smartphone,
    Zap, Ticket, BadgeCheck, History, Settings, Bell
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useEwasteStore } from '@/store/ewasteStore';
import { cn } from '@/lib/utils';

// Reward tiers
const REWARD_TIERS = [
    { name: 'Bronze', minPoints: 0, maxPoints: 500, color: 'from-amber-600 to-amber-700', icon: '🥉' },
    { name: 'Silver', minPoints: 500, maxPoints: 2000, color: 'from-gray-400 to-gray-500', icon: '🥈' },
    { name: 'Gold', minPoints: 2000, maxPoints: 5000, color: 'from-yellow-400 to-yellow-500', icon: '🥇' },
    { name: 'Platinum', minPoints: 5000, maxPoints: 10000, color: 'from-purple-400 to-purple-600', icon: '💎' },
    { name: 'Diamond', minPoints: 10000, maxPoints: Infinity, color: 'from-cyan-400 to-blue-500', icon: '👑' },
];

// Redeem options
const REDEEM_OPTIONS = [
    { id: 'coffee', name: 'Free Coffee', points: 100, icon: Coffee, description: 'Any cafe partner', category: 'food' },
    { id: 'mobile-recharge', name: '₹50 Mobile Recharge', points: 200, icon: Smartphone, description: 'Any operator', category: 'recharge' },
    { id: 'shopping-50', name: '₹100 Shopping Voucher', points: 350, icon: ShoppingBag, description: 'Amazon/Flipkart', category: 'shopping' },
    { id: 'movie', name: 'Movie Ticket', points: 400, icon: Ticket, description: 'BookMyShow', category: 'entertainment' },
    { id: 'electricity', name: '₹100 Bill Payment', points: 400, icon: Zap, description: 'Any utility bill', category: 'bills' },
    { id: 'shopping-200', name: '₹250 Shopping Voucher', points: 800, icon: ShoppingBag, description: 'Premium brands', category: 'shopping' },
];

// Exchange rates - 1 point = ₹1
const EXCHANGE_OPTIONS = [
    { id: 'upi', name: 'UPI Transfer', rate: 1.0, minPoints: 100, icon: Wallet, description: '₹1 per point' },
    { id: 'bank', name: 'Bank Transfer', rate: 1.0, minPoints: 500, icon: CreditCard, description: '₹1 per point' },
    { id: 'charity', name: 'Donate to Charity', rate: 1.5, minPoints: 50, icon: Gift, description: '₹1.50 per point (150% value)' },
];

type TabType = 'overview' | 'redeem' | 'exchange' | 'history';

export default function ProfilePage() {
    const { currentUser, logout } = useEwasteStore();
    const navigate = useNavigate();
    const location = useLocation();

    // Initialize activeTab from state if available
    const [activeTab, setActiveTab] = useState<TabType>(() => {
        return (location.state as { activeTab?: TabType })?.activeTab || 'overview';
    });
    const [selectedRedeem, setSelectedRedeem] = useState<string | null>(null);
    const [selectedExchange, setSelectedExchange] = useState<string | null>(null);
    const [exchangeAmount, setExchangeAmount] = useState<number>(500);
    const [showRedeemSuccess, setShowRedeemSuccess] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    // Get current tier
    const currentTier = REWARD_TIERS.find(
        tier => (currentUser?.points ?? 0) >= tier.minPoints && (currentUser?.points ?? 0) < tier.maxPoints
    ) || REWARD_TIERS[0];

    const nextTier = REWARD_TIERS[REWARD_TIERS.indexOf(currentTier) + 1];
    const progressToNext = nextTier
        ? ((currentUser?.points ?? 0) - currentTier.minPoints) / (nextTier.minPoints - currentTier.minPoints) * 100
        : 100;

    const handleRedeem = (optionId: string) => {
        const option = REDEEM_OPTIONS.find(o => o.id === optionId);
        if (!option || !currentUser || currentUser.points < option.points) return;

        // In real app, this would call an API
        setShowRedeemSuccess(true);
        setTimeout(() => setShowRedeemSuccess(false), 3000);
        setSelectedRedeem(null);
    };

    const tabs = [
        { id: 'overview' as const, label: 'Overview', icon: User },
        { id: 'redeem' as const, label: 'Redeem', icon: Gift },
        { id: 'exchange' as const, label: 'Exchange', icon: ArrowRightLeft },
        { id: 'history' as const, label: 'History', icon: History },
    ];

    return (
        <div className="space-y-6 pb-6">
            {/* Success Toast */}
            {showRedeemSuccess && (
                <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-emerald-500 text-white px-6 py-3 rounded-xl shadow-lg flex items-center gap-2 animate-in slide-in-from-top">
                    <BadgeCheck className="h-5 w-5" />
                    <span className="font-medium">Reward redeemed successfully!</span>
                </div>
            )}

            {/* Profile Header with Tier */}
            <div className={cn(
                "relative rounded-2xl p-6 text-white overflow-hidden bg-gradient-to-br",
                currentTier.color
            )}>
                <div className="absolute top-0 right-0 text-8xl opacity-20 -mt-4 -mr-4">
                    {currentTier.icon}
                </div>

                <div className="flex items-center gap-4 mb-4">
                    <div className="h-16 w-16 rounded-full bg-white/20 backdrop-blur flex items-center justify-center text-2xl font-bold">
                        {currentUser?.name?.charAt(0)}
                    </div>
                    <div>
                        <h1 className="text-xl font-bold">{currentUser?.name}</h1>
                        <p className="text-white/80 text-sm">{currentUser?.email}</p>
                    </div>
                </div>

                <div className="flex items-center justify-between mb-2">
                    <span className="text-white/80 text-sm">{currentTier.name} Member</span>
                    {nextTier && (
                        <span className="text-white/80 text-sm">
                            {nextTier.minPoints - (currentUser?.points ?? 0)} pts to {nextTier.name}
                        </span>
                    )}
                </div>

                <Progress value={progressToNext} className="h-2 bg-white/20" />

                <div className="mt-4 flex items-center justify-between">
                    <div>
                        <p className="text-3xl font-bold">{currentUser?.points.toLocaleString()}</p>
                        <p className="text-white/80 text-sm">Available Points</p>
                    </div>
                    <Badge className="bg-white/20 text-white border-0 text-sm px-3 py-1">
                        ≈ ₹{(currentUser?.points ?? 0).toLocaleString()} value
                    </Badge>
                </div>

                {/* Demo Data Button */}
                <Button
                    onClick={() => {
                        useEwasteStore.getState().seedDemoData();
                        toast.success('Demo data loaded! 🎉', {
                            description: '15 items, 4 badges, and impressive stats added'
                        });
                    }}
                    className="w-full bg-white/20 hover:bg-white/30 text-white border-white/30 mt-3"
                    variant="outline"
                >
                    🎯 Load Demo Data (for presentation)
                </Button>
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4">
                {tabs.map(tab => {
                    const Icon = tab.icon;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={cn(
                                "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors",
                                activeTab === tab.id
                                    ? "bg-emerald-500 text-white"
                                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                            )}
                        >
                            <Icon className="h-4 w-4" />
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* Overview Tab */}
            {activeTab === 'overview' && (
                <div className="space-y-4">
                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-3">
                        <Card>
                            <CardContent className="p-4">
                                <p className="text-sm text-gray-500">Items Recycled</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {currentUser?.recyclingHistory.length}
                                </p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-4">
                                <p className="text-sm text-gray-500">CO₂ Saved</p>
                                <p className="text-2xl font-bold text-emerald-600">
                                    {currentUser?.co2Saved} kg
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Badges */}
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="font-semibold text-gray-900">Your Badges</h3>
                                <span className="text-sm text-gray-500">{currentUser?.badges.length} earned</span>
                            </div>
                            {currentUser?.badges.length === 0 ? (
                                <p className="text-gray-500 text-sm">Start recycling to earn badges!</p>
                            ) : (
                                <div className="flex flex-wrap gap-2">
                                    {currentUser?.badges.map((badge, idx) => (
                                        <div
                                            key={idx}
                                            className="flex items-center gap-1 bg-amber-50 text-amber-700 px-3 py-1.5 rounded-full text-sm"
                                        >
                                            <Award className="h-4 w-4" />
                                            {badge.name}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Quick Actions */}
                    <div className="space-y-2">
                        <button
                            onClick={() => setActiveTab('redeem')}
                            className="w-full flex items-center justify-between p-4 bg-white rounded-xl border hover:border-emerald-300 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center">
                                    <Gift className="h-5 w-5 text-emerald-600" />
                                </div>
                                <div className="text-left">
                                    <p className="font-medium text-gray-900">Redeem Rewards</p>
                                    <p className="text-sm text-gray-500">Gift cards, vouchers & more</p>
                                </div>
                            </div>
                            <ChevronRight className="h-5 w-5 text-gray-400" />
                        </button>

                        <button
                            onClick={() => setActiveTab('exchange')}
                            className="w-full flex items-center justify-between p-4 bg-white rounded-xl border hover:border-emerald-300 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                    <Wallet className="h-5 w-5 text-blue-600" />
                                </div>
                                <div className="text-left">
                                    <p className="font-medium text-gray-900">Withdraw to Wallet</p>
                                    <p className="text-sm text-gray-500">Convert points to cash</p>
                                </div>
                            </div>
                            <ChevronRight className="h-5 w-5 text-gray-400" />
                        </button>

                        <button className="w-full flex items-center justify-between p-4 bg-white rounded-xl border hover:border-gray-300 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                                    <Settings className="h-5 w-5 text-gray-600" />
                                </div>
                                <div className="text-left">
                                    <p className="font-medium text-gray-900">Settings</p>
                                    <p className="text-sm text-gray-500">Account preferences</p>
                                </div>
                            </div>
                            <ChevronRight className="h-5 w-5 text-gray-400" />
                        </button>
                    </div>

                    {/* Logout */}
                    <Button
                        variant="outline"
                        className="w-full text-red-600 border-red-200 hover:bg-red-50"
                        onClick={handleLogout}
                    >
                        <LogOut className="h-4 w-4 mr-2" />
                        Logout
                    </Button>
                </div>
            )}

            {/* Redeem Tab */}
            {activeTab === 'redeem' && (
                <div className="space-y-4">
                    <p className="text-gray-500 text-sm">
                        Exchange your points for rewards from our partners
                    </p>

                    <div className="grid gap-3">
                        {REDEEM_OPTIONS.map(option => {
                            const Icon = option.icon;
                            const canAfford = (currentUser?.points ?? 0) >= option.points;

                            return (
                                <Card
                                    key={option.id}
                                    className={cn(
                                        "cursor-pointer transition-all",
                                        selectedRedeem === option.id && "ring-2 ring-emerald-500",
                                        !canAfford && "opacity-50"
                                    )}
                                    onClick={() => canAfford && setSelectedRedeem(option.id)}
                                >
                                    <CardContent className="p-4">
                                        <div className="flex items-center gap-4">
                                            <div className={cn(
                                                "h-12 w-12 rounded-xl flex items-center justify-center",
                                                canAfford ? "bg-emerald-100" : "bg-gray-100"
                                            )}>
                                                <Icon className={cn(
                                                    "h-6 w-6",
                                                    canAfford ? "text-emerald-600" : "text-gray-400"
                                                )} />
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="font-semibold text-gray-900">{option.name}</h3>
                                                <p className="text-sm text-gray-500">{option.description}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className={cn(
                                                    "font-bold",
                                                    canAfford ? "text-emerald-600" : "text-gray-400"
                                                )}>
                                                    {option.points} pts
                                                </p>
                                                {!canAfford && (
                                                    <p className="text-xs text-red-500">
                                                        Need {option.points - (currentUser?.points ?? 0)} more
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        {selectedRedeem === option.id && (
                                            <div className="mt-4 pt-4 border-t">
                                                <Button
                                                    className="w-full bg-emerald-600 hover:bg-emerald-700"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleRedeem(option.id);
                                                    }}
                                                >
                                                    Redeem for {option.points} points
                                                </Button>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Exchange Tab */}
            {activeTab === 'exchange' && (
                <div className="space-y-4">
                    <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0">
                        <CardContent className="p-4">
                            <p className="text-blue-100 text-sm mb-1">Available Balance</p>
                            <p className="text-3xl font-bold">{currentUser?.points.toLocaleString()} pts</p>
                            <p className="text-blue-100 text-sm">= ₹{(currentUser?.points ?? 0).toLocaleString()} cash value</p>
                        </CardContent>
                    </Card>

                    <div className="space-y-3">
                        <p className="text-sm font-medium text-gray-700">Withdraw Method</p>

                        {EXCHANGE_OPTIONS.map(option => {
                            const Icon = option.icon;
                            const canWithdraw = (currentUser?.points ?? 0) >= option.minPoints;

                            return (
                                <Card
                                    key={option.id}
                                    className={cn(
                                        "cursor-pointer transition-all",
                                        selectedExchange === option.id && "ring-2 ring-blue-500",
                                        !canWithdraw && "opacity-50"
                                    )}
                                    onClick={() => canWithdraw && setSelectedExchange(option.id)}
                                >
                                    <CardContent className="p-4">
                                        <div className="flex items-center gap-4">
                                            <div className={cn(
                                                "h-12 w-12 rounded-xl flex items-center justify-center",
                                                option.id === 'charity' ? "bg-pink-100" : "bg-blue-100"
                                            )}>
                                                <Icon className={cn(
                                                    "h-6 w-6",
                                                    option.id === 'charity' ? "text-pink-600" : "text-blue-600"
                                                )} />
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="font-semibold text-gray-900">{option.name}</h3>
                                                <p className="text-sm text-gray-500">{option.description}</p>
                                            </div>
                                            {!canWithdraw && (
                                                <Badge variant="secondary" className="text-xs">
                                                    Min {option.minPoints} pts
                                                </Badge>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>

                    {selectedExchange && (
                        <Card>
                            <CardContent className="p-4 space-y-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                                        Amount to withdraw
                                    </label>
                                    <input
                                        type="range"
                                        min={EXCHANGE_OPTIONS.find(o => o.id === selectedExchange)?.minPoints ?? 100}
                                        max={currentUser?.points ?? 0}
                                        step={100}
                                        value={exchangeAmount}
                                        onChange={(e) => setExchangeAmount(parseInt(e.target.value))}
                                        className="w-full"
                                    />
                                    <div className="flex justify-between text-sm mt-1">
                                        <span className="text-gray-500">
                                            {EXCHANGE_OPTIONS.find(o => o.id === selectedExchange)?.minPoints} pts
                                        </span>
                                        <span className="font-medium text-blue-600">{exchangeAmount} pts</span>
                                        <span className="text-gray-500">{currentUser?.points} pts</span>
                                    </div>
                                </div>

                                <div className="bg-gray-50 rounded-xl p-4">
                                    <div className="flex justify-between mb-2">
                                        <span className="text-gray-500">Points to withdraw</span>
                                        <span className="font-medium">{exchangeAmount}</span>
                                    </div>
                                    <div className="flex justify-between mb-2">
                                        <span className="text-gray-500">Exchange rate</span>
                                        <span className="font-medium">
                                            ₹{EXCHANGE_OPTIONS.find(o => o.id === selectedExchange)?.rate ?? 0.10}/pt
                                        </span>
                                    </div>
                                    <div className="flex justify-between pt-2 border-t">
                                        <span className="font-medium text-gray-900">You'll receive</span>
                                        <span className="font-bold text-green-600">
                                            ₹{(exchangeAmount * (EXCHANGE_OPTIONS.find(o => o.id === selectedExchange)?.rate ?? 0.10)).toFixed(2)}
                                        </span>
                                    </div>
                                </div>

                                <Button className="w-full bg-blue-600 hover:bg-blue-700">
                                    Withdraw ₹{(exchangeAmount * (EXCHANGE_OPTIONS.find(o => o.id === selectedExchange)?.rate ?? 0.10)).toFixed(2)}
                                </Button>
                            </CardContent>
                        </Card>
                    )}
                </div>
            )}

            {/* History Tab */}
            {activeTab === 'history' && (
                <div className="space-y-3">
                    {currentUser?.recyclingHistory.length === 0 ? (
                        <div className="text-center py-12">
                            <History className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-500">No recycling history yet</p>
                            <p className="text-sm text-gray-400">Start recycling to see your history here</p>
                        </div>
                    ) : (
                        currentUser?.recyclingHistory.map((record, idx) => (
                            <Card key={record.id || idx}>
                                <CardContent className="p-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center">
                                                <Smartphone className="h-5 w-5 text-emerald-600" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-900 capitalize">{record.itemType}</p>
                                                <p className="text-sm text-gray-500">
                                                    {new Date(record.depositedAt).toLocaleDateString('en-IN', {
                                                        day: 'numeric',
                                                        month: 'short',
                                                        year: 'numeric'
                                                    })}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-emerald-600">+{record.pointsEarned} pts</p>
                                            <p className="text-sm text-gray-500">{record.weight}g</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}
