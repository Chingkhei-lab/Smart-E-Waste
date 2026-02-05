import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useNavigate, useLocation } from 'react-router-dom';
import { Toaster } from 'sonner';
import { Leaf, MapPin, User, BarChart2, Home, Recycle, Wallet, Gift, CreditCard, ArrowRight, TrendingUp, Smartphone, Laptop, Tablet, Watch, Cable, Users, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEwasteStore } from '@/store/ewasteStore';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// User Components
import ScanningView from '@/components/ScanningView';
import AnalysisView from '@/components/AnalysisView';
import RewardView from '@/components/RewardView';
import BinsMap from '@/components/BinsMap';
import ProfilePage from '@/components/ProfilePage';
import ChallengesView from '@/components/ChallengesView';
import ImpactDashboard from '@/components/ImpactDashboard';
import LeaderboardView from '@/components/LeaderboardView';

// Nav item type
interface NavItem {
    path: string;
    label: string;
    icon: React.ElementType;
}

const navItems: NavItem[] = [
    { path: '/', label: 'Home', icon: Home },
    { path: '/scan', label: 'Recycle', icon: Recycle },
    { path: '/bins', label: 'Bins', icon: MapPin },
    { path: '/profile', label: 'Profile', icon: User },
];

// User Layout with bottom navigation
const UserLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { currentUser } = useEwasteStore();
    const location = useLocation();

    // Check if current path matches nav item
    const isActive = (path: string) => {
        if (path === '/') return location.pathname === '/';
        return location.pathname.startsWith(path);
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-24">
            {/* Header */}
            <header className="sticky top-0 z-40 bg-white border-b">
                <div className="flex items-center justify-between px-4 py-3">
                    <Link to="/" className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg bg-emerald-500 flex items-center justify-center">
                            <Leaf className="h-5 w-5 text-white" />
                        </div>
                        <span className="font-bold text-lg text-gray-900">EcoBin</span>
                    </Link>

                    <div className="flex items-center gap-3">
                        <div className="text-right hidden sm:block">
                            <p className="text-sm font-medium text-gray-900">{currentUser?.name}</p>
                            <p className="text-xs text-gray-500">{currentUser?.points} pts</p>
                        </div>
                        <Link to="/profile">
                            <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center">
                                <User className="h-5 w-5 text-emerald-600" />
                            </div>
                        </Link>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="p-4 lg:p-6 max-w-4xl mx-auto">
                {children}
            </main>

            {/* Bottom Navigation - Dynamic active state */}
            <nav className="fixed bottom-0 left-0 right-0 bg-white border-t z-[500] pb-[env(safe-area-inset-bottom)]">
                <div className="flex items-center justify-around max-w-md mx-auto py-2">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const active = isActive(item.path);

                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className="flex flex-col items-center px-4 relative"
                            >
                                {active ? (
                                    // Elevated active button
                                    <>
                                        <div className="h-14 w-14 -mt-7 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/30 transition-all">
                                            <Icon className="h-6 w-6 text-white" />
                                        </div>
                                        <span className="text-xs mt-1 text-emerald-600 font-medium">{item.label}</span>
                                    </>
                                ) : (
                                    // Inactive button
                                    <>
                                        <div className="h-10 w-10 flex items-center justify-center">
                                            <Icon className="h-5 w-5 text-gray-400" />
                                        </div>
                                        <span className="text-xs mt-1 text-gray-500">{item.label}</span>
                                    </>
                                )}
                            </Link>
                        );
                    })}
                </div>
            </nav>
        </div>
    );
};

// Home/Dashboard for users
const UserHome: React.FC = () => {
    const { currentUser } = useEwasteStore();
    const navigate = useNavigate();

    const handleRedeem = () => {
        toast.info("Opening Rewards Catalog...");
        navigate('/profile', { state: { activeTab: 'redeem' } });
    };

    const handleWithdraw = () => {
        toast.info("Opening Withdrawal Options...");
        navigate('/profile', { state: { activeTab: 'exchange' } });
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Welcome & Eco Quote */}
            <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 -mt-10 -mr-10 h-40 w-40 bg-white/10 rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-0 -mb-10 -ml-10 h-40 w-40 bg-black/10 rounded-full blur-3xl" />

                <div className="relative z-10">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h1 className="text-2xl font-bold">
                                Hello, {currentUser?.name?.split(' ')[0]}! 🌱
                            </h1>
                            <p className="text-emerald-100 text-sm opacity-90">
                                "The greatest threat to our planet is the belief that someone else will save it."
                            </p>
                        </div>
                    </div>

                    <Button
                        onClick={() => navigate('/scan')}
                        className="bg-white text-emerald-700 hover:bg-emerald-50 font-semibold shadow-sm w-full sm:w-auto"
                    >
                        <Recycle className="h-4 w-4 mr-2" />
                        Start Recycling
                    </Button>
                </div>
            </div>

            {/* Wallet & Rewards Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2 text-gray-900 font-semibold">
                        <Wallet className="h-5 w-5 text-emerald-600" />
                        Green Wallet
                    </div>
                    <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full font-medium">
                        1 Point = ₹1
                    </span>
                </div>

                <div className="flex flex-col gap-4">
                    <div>
                        <p className="text-sm text-gray-500">Available Balance</p>
                        <div className="flex items-baseline gap-2">
                            <h2 className="text-3xl font-bold text-gray-900">{currentUser?.points.toLocaleString()}</h2>
                            <span className="text-sm font-medium text-gray-400">Pts</span>
                            <span className="text-lg font-semibold text-emerald-600 ml-2">≈ ₹{(currentUser?.points || 0)}</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <Button variant="outline" className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800" onClick={handleRedeem}>
                            <Gift className="h-4 w-4 mr-2" />
                            Redeem
                        </Button>
                        <Button variant="outline" className="border-gray-200 text-gray-700 hover:bg-gray-50" onClick={handleWithdraw}>
                            <CreditCard className="h-4 w-4 mr-2" />
                            Withdraw
                        </Button>
                    </div>
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 gap-3">
                <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                            <Leaf className="h-4 w-4 text-blue-600" />
                        </div>
                    </div>
                    <p className="text-2xl font-bold text-blue-900">{currentUser?.co2Saved}kg</p>
                    <p className="text-xs text-blue-700 font-medium">Carbon Offset</p>
                </div>
                <div className="bg-amber-50 rounded-2xl p-4 border border-amber-100">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center">
                            <BarChart2 className="h-4 w-4 text-amber-600" />
                        </div>
                    </div>
                    <p className="text-2xl font-bold text-amber-900">{currentUser?.recyclingHistory.length}</p>
                    <p className="text-xs text-amber-700 font-medium">Items Saved</p>
                </div>
            </div>

            {/* Challenges Quick Access */}
            <div
                className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl p-4 shadow-lg cursor-pointer active:scale-95 transition-transform"
                onClick={() => navigate('/challenges')}
            >
                <div className="flex items-center justify-between text-white">
                    <div className="flex items-center gap-3">
                        <div className="h-12 w-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur">
                            <Trophy className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="font-bold text-lg">Daily Challenges</p>
                            <p className="text-sm text-purple-100">Complete tasks, earn rewards</p>
                        </div>
                    </div>
                    <ArrowRight className="h-6 w-6" />
                </div>
            </div>

            {/* Impact Dashboard Quick Access */}
            <div
                className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl p-4 shadow-lg cursor-pointer active:scale-95 transition-transform"
                onClick={() => navigate('/impact')}
            >
                <div className="flex items-center justify-between text-white">
                    <div className="flex items-center gap-3">
                        <div className="h-12 w-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur">
                            <BarChart2 className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="font-bold text-lg">Your Impact</p>
                            <p className="text-sm text-emerald-100">View detailed analytics</p>
                        </div>
                    </div>
                    <ArrowRight className="h-6 w-6" />
                </div>
            </div>

            {/* Leaderboard Quick Access */}
            <div
                className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl p-4 shadow-lg cursor-pointer active:scale-95 transition-transform"
                onClick={() => navigate('/leaderboard')}
            >
                <div className="flex items-center justify-between text-white">
                    <div className="flex items-center gap-3">
                        <div className="h-12 w-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur">
                            <Users className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="font-bold text-lg">Leaderboard</p>
                            <p className="text-sm text-blue-100">See top recyclers</p>
                        </div>
                    </div>
                    <ArrowRight className="h-6 w-6" />
                </div>
            </div>

            {/* Ways to Earn */}
            <WaysToEarn navigate={navigate} />
        </div>
    );
};


const WaysToEarn = ({ navigate }: { navigate: (path: string) => void }) => {
    const [showAll, setShowAll] = useState(false);

    const earnOptions = [
        {
            id: 1,
            title: 'Recycle Old Phone',
            subtitle: 'High value item',
            points: 500,
            icon: Smartphone,
            color: 'text-emerald-600',
            bg: 'bg-emerald-100'
        },
        {
            id: 2,
            title: 'Weekly Streak',
            subtitle: 'Recycle 3 weeks in a row',
            points: 150,
            icon: TrendingUp,
            color: 'text-purple-600',
            bg: 'bg-purple-100'
        },
        {
            id: 3,
            title: 'Recycle Laptop',
            subtitle: 'Functioning or broken',
            points: 1000,
            icon: Laptop,
            color: 'text-blue-600',
            bg: 'bg-blue-100'
        },
        {
            id: 4,
            title: 'Recycle Tablet',
            subtitle: 'Any brand',
            points: 400,
            icon: Tablet,
            color: 'text-amber-600',
            bg: 'bg-amber-100'
        },
        {
            id: 5,
            title: 'Smartwatch / Band',
            subtitle: 'Fitness trackers etc',
            points: 200,
            icon: Watch,
            color: 'text-rose-600',
            bg: 'bg-rose-100'
        },
        {
            id: 6,
            title: 'Cables & Chargers',
            subtitle: 'Per kg',
            points: 50,
            icon: Cable,
            color: 'text-gray-600',
            bg: 'bg-gray-200'
        },
        {
            id: 7,
            title: 'Refer a Friend',
            subtitle: 'When they make first scan',
            points: 300,
            icon: Users,
            color: 'text-indigo-600',
            bg: 'bg-indigo-100'
        },
    ];

    const visibleOptions = showAll ? earnOptions : earnOptions.slice(0, 2);

    return (
        <div className="space-y-3">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider ml-1">Ways to Earn</h3>

            <div className="space-y-3">
                {visibleOptions.map((option) => {
                    const Icon = option.icon;
                    return (
                        <div
                            key={option.id}
                            className="bg-white p-4 rounded-xl border border-gray-100 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                            onClick={() => navigate('/scan')}
                        >
                            <div className="flex items-center gap-4">
                                <div className={`h-10 w-10 rounded-full flex items-center justify-center ${option.bg}`}>
                                    <Icon className={`h-5 w-5 ${option.color}`} />
                                </div>
                                <div>
                                    <p className="font-semibold text-gray-900">{option.title}</p>
                                    <p className="text-xs text-gray-500">{option.subtitle}</p>
                                </div>
                            </div>
                            <div className="flex items-center text-emerald-600 font-bold text-sm">
                                +{option.points} Pts <ArrowRight className="h-4 w-4 ml-1" />
                            </div>
                        </div>
                    );
                })}
            </div>

            <Button
                variant="ghost"
                className="w-full text-gray-500 hover:text-gray-900 hover:bg-gray-100"
                onClick={() => setShowAll(!showAll)}
            >
                {showAll ? 'Show Less' : `Show ${earnOptions.length - 2} More Ways`}
            </Button>
        </div>
    );
};


// Login & Signup Page
const LoginPage: React.FC = () => {
    const { registerUser, loginUser } = useEwasteStore();
    const navigate = useNavigate();
    const [isLogin, setIsLogin] = useState(true);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        if (isLogin) {
            // Login flow
            if (!formData.email || !formData.password) {
                setError('Please fill in all fields');
                setLoading(false);
                return;
            }

            const result = loginUser(formData.email, formData.password);
            if (result.success) {
                navigate('/');
            } else {
                setError(result.error || 'Login failed');
            }
        } else {
            // Signup flow
            if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
                setError('Please fill in all fields');
                setLoading(false);
                return;
            }

            if (formData.password !== formData.confirmPassword) {
                setError('Passwords do not match');
                setLoading(false);
                return;
            }

            const result = registerUser(formData.name, formData.email, formData.password);
            if (result.success) {
                navigate('/');
            } else {
                setError(result.error || 'Registration failed');
            }
        }

        setLoading(false);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError('');
    };

    const toggleMode = () => {
        setIsLogin(!isLogin);
        setError('');
        setFormData({ name: '', email: '', password: '', confirmPassword: '' });
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 p-4">
            <div className="max-w-md w-full">
                {/* Logo & Title */}
                <div className="text-center mb-8">
                    <div className="inline-flex h-16 w-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/30">
                        <Leaf className="h-8 w-8 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome to EcoBin</h1>
                    <p className="text-gray-600">
                        {isLogin ? 'Sign in to continue your eco journey' : 'Join us in saving the planet'}
                    </p>
                </div>

                {/* Auth Card */}
                <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8">
                    <div className="flex gap-2 mb-6 bg-gray-100 p-1 rounded-xl">
                        <button
                            onClick={() => setIsLogin(true)}
                            className={cn(
                                "flex-1 py-2.5 rounded-lg font-medium transition-all text-sm",
                                isLogin
                                    ? "bg-white text-emerald-600 shadow-sm"
                                    : "text-gray-600 hover:text-gray-900"
                            )}
                        >
                            Login
                        </button>
                        <button
                            onClick={() => setIsLogin(false)}
                            className={cn(
                                "flex-1 py-2.5 rounded-lg font-medium transition-all text-sm",
                                !isLogin
                                    ? "bg-white text-emerald-600 shadow-sm"
                                    : "text-gray-600 hover:text-gray-900"
                            )}
                        >
                            Sign Up
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {!isLogin && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    Full Name
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                                    placeholder="John Doe"
                                />
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                Email Address
                            </label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                                placeholder="you@example.com"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                Password
                            </label>
                            <input
                                type="password"
                                name="password"
                                value={formData.password}
                                onChange={handleInputChange}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                                placeholder="••••••••"
                            />
                            {!isLogin && (
                                <p className="text-xs text-gray-500 mt-1">Minimum 6 characters</p>
                            )}
                        </div>

                        {!isLogin && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    Confirm Password
                                </label>
                                <input
                                    type="password"
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                                    placeholder="••••••••"
                                />
                            </div>
                        )}

                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                                {error}
                            </div>
                        )}

                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white py-3 rounded-xl font-semibold shadow-lg shadow-emerald-500/30 transition-all"
                        >
                            {loading ? 'Please wait...' : isLogin ? 'Sign In' : 'Create Account'}
                        </Button>
                    </form>

                    {isLogin && (
                        <div className="mt-4 text-center">
                            <button className="text-sm text-emerald-600 hover:text-emerald-700 font-medium">
                                Forgot password?
                            </button>
                        </div>
                    )}

                    <div className="mt-6 text-center text-sm text-gray-600">
                        {isLogin ? "Don't have an account? " : "Already have an account? "}
                        <button
                            onClick={toggleMode}
                            className="text-emerald-600 hover:text-emerald-700 font-semibold"
                        >
                            {isLogin ? 'Sign up' : 'Sign in'}
                        </button>
                    </div>
                </div>

                <p className="text-center text-sm text-gray-500 mt-6">
                    By continuing, you agree to our Terms of Service and Privacy Policy
                </p>
            </div>
        </div>
    );
};

// Protected Route Wrapper
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { currentUser } = useEwasteStore();

    if (!currentUser) {
        return <Navigate to="/login" replace />;
    }

    return <>{children}</>;
};

function App() {
    return (
        <BrowserRouter>
            <Toaster position="top-right" richColors />
            <Routes>
                {/* Auth Routes */}
                <Route path="/login" element={<LoginPage />} />

                {/* User Routes */}
                <Route
                    path="/"
                    element={
                        <ProtectedRoute>
                            <UserLayout>
                                <UserHome />
                            </UserLayout>
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/scan"
                    element={
                        <ProtectedRoute>
                            <UserLayout>
                                <ScanningView />
                            </UserLayout>
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/analysis"
                    element={
                        <ProtectedRoute>
                            <UserLayout>
                                <AnalysisView />
                            </UserLayout>
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/reward"
                    element={
                        <ProtectedRoute>
                            <UserLayout>
                                <RewardView />
                            </UserLayout>
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/profile"
                    element={
                        <ProtectedRoute>
                            <UserLayout>
                                <ProfilePage />
                            </UserLayout>
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/challenges"
                    element={
                        <ProtectedRoute>
                            <UserLayout>
                                <ChallengesView />
                            </UserLayout>
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/impact"
                    element={
                        <ProtectedRoute>
                            <ImpactDashboard />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/leaderboard"
                    element={
                        <ProtectedRoute>
                            <LeaderboardView />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/bins"
                    element={
                        <ProtectedRoute>
                            <UserLayout>
                                <BinsMap />
                            </UserLayout>
                        </ProtectedRoute>
                    }
                />

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
