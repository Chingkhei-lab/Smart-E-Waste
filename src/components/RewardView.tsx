import { useEffect, useState } from 'react';
import { motion, useSpring, useTransform, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Trophy, Leaf, ArrowRight, MapPin, Hash, Smartphone, CheckCircle2, Monitor, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useEwasteStore } from '@/store/ewasteStore';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';

// Mock Bin Simulator Component
const BinSimulator = ({ code, onVerify, onClose }: { code: string, onVerify: () => void, onClose: () => void }) => {
    const [input, setInput] = useState('');
    const [status, setStatus] = useState<'idle' | 'verifying' | 'success' | 'error'>('idle');

    const handleKey = (key: string) => {
        if (input.length < 6) {
            setInput(prev => prev + key);
        }
    };

    const handleClear = () => setInput('');
    const handleSubmit = () => {
        if (input === code.replace('-', '')) {
            setStatus('verifying');
            // 5 second delay for verification simulation
            setTimeout(() => {
                setStatus('success');
                setTimeout(onVerify, 2000);
            }, 5000);
        } else {
            setStatus('error');
            setTimeout(() => {
                setStatus('idle');
                setInput('');
            }, 1000);
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in"
            onClick={onClose}
        >
            <div className="bg-slate-900 w-full max-w-sm rounded-3xl overflow-hidden border border-slate-700 shadow-2xl" onClick={(e) => e.stopPropagation()}>
                {/* Bin Header */}
                <div className="bg-slate-800 p-4 flex justify-between items-center border-b border-slate-700">
                    <div className="flex items-center gap-2">
                        <Monitor className="text-emerald-400 h-5 w-5" />
                        <span className="text-white font-medium">Smart Bin Interface</span>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-white"><X className="h-5 w-5" /></button>
                </div>

                {/* Bin Screen Content */}
                <div className="p-6 text-center space-y-6">
                    {status === 'idle' || status === 'error' ? (
                        <>
                            <div className="h-20 bg-slate-950 rounded-xl border-2 border-slate-700 flex items-center justify-center mb-6">
                                <span className={cn(
                                    "text-4xl font-mono tracking-[0.5em] text-emerald-400",
                                    status === 'error' && "text-red-500 animate-pulse"
                                )}>
                                    {input.padEnd(6, '•')}
                                </span>
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                                    <button
                                        key={num}
                                        onClick={() => handleKey(num.toString())}
                                        className="h-14 bg-slate-800 rounded-lg text-xl font-bold text-white hover:bg-slate-700 active:scale-95 transition-all"
                                    >
                                        {num}
                                    </button>
                                ))}
                                <button
                                    onClick={handleClear}
                                    className="h-14 bg-red-900/30 text-red-400 rounded-lg font-bold hover:bg-red-900/50"
                                >
                                    CLR
                                </button>
                                <button
                                    onClick={() => handleKey('0')}
                                    className="h-14 bg-slate-800 rounded-lg text-xl font-bold text-white hover:bg-slate-700"
                                >
                                    0
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    className="h-14 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-500"
                                >
                                    OK
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="py-12 flex flex-col items-center">
                            {status === 'verifying' ? (
                                <>
                                    <div className="relative mb-6">
                                        <div className="h-24 w-24 border-4 border-slate-700 rounded-full" />
                                        <div className="absolute inset-0 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                                        <Smartphone className="absolute inset-0 m-auto h-10 w-10 text-emerald-500 animate-pulse" />
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-2">Verifying Product...</h3>
                                    <p className="text-slate-400 text-sm animate-pulse">Analyzing waste via internal camera</p>

                                    {/* Progress Bar Simulation */}
                                    <div className="w-full h-1 bg-slate-800 mt-6 rounded-full overflow-hidden">
                                        <div className="h-full bg-emerald-500 animate-[progress_5s_ease-in-out_forwards]" style={{ width: '0%' }} />
                                    </div>
                                    <style>{`
                                        @keyframes progress {
                                            0% { width: 0%; }
                                            100% { width: 100%; }
                                        }
                                    `}</style>
                                </>
                            ) : (
                                <>
                                    <div className="h-20 w-20 bg-emerald-500 rounded-full flex items-center justify-center mb-6 animate-in zoom-in duration-300">
                                        <CheckCircle2 className="h-12 w-12 text-white" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-white mb-2">Verified!</h3>
                                    <p className="text-slate-400">Waste accepted & points sent</p>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default function RewardView() {
    const { pendingReward, currentScan, completeSession, currentUser } = useEwasteStore();
    const navigate = useNavigate();
    const [step, setStep] = useState<'instruction' | 'simulator' | 'success'>('instruction');
    const [depositCode] = useState(() => Math.floor(100000 + Math.random() * 900000).toString());

    // Spring animation for counter
    const springPoints = useSpring(0, {
        stiffness: 50,
        damping: 20,
        mass: 1
    });

    const displayPoints = useTransform(springPoints, (latest) => Math.floor(latest));
    const [currentPoints, setCurrentPoints] = useState(0);

    // Redirect if no pending reward
    useEffect(() => {
        if (!pendingReward) {
            navigate('/scan');
        }
    }, [pendingReward, navigate]);

    // Handle Success State (Confetti & Points)
    useEffect(() => {
        if (step !== 'success') return;

        // Trigger confetti burst
        const duration = 3000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };
        const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

        const interval = setInterval(() => {
            const timeLeft = animationEnd - Date.now();
            if (timeLeft <= 0) {
                clearInterval(interval);
                return;
            }
            const particleCount = 50 * (timeLeft / duration);
            confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }, colors: ['#10b981', '#34d399', '#fbbf24', '#f59e0b'] });
            confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }, colors: ['#10b981', '#34d399', '#fbbf24', '#f59e0b'] });
        }, 250);

        // Animate counter
        springPoints.set(pendingReward?.points || 0);
        const unsubscribe = displayPoints.on('change', (v) => setCurrentPoints(v));
        return () => {
            clearInterval(interval);
            unsubscribe();
        };
    }, [step, pendingReward, springPoints, displayPoints]);

    const handleComplete = () => {
        completeSession();
        navigate('/');
    };

    if (!pendingReward || !currentScan) return null;

    return (
        <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-t from-emerald-500/10 via-transparent to-transparent" />

            {step === 'simulator' && (
                <BinSimulator
                    code={depositCode}
                    onVerify={() => setStep('success')}
                    onClose={() => setStep('instruction')}
                />
            )}

            <AnimatePresence mode="wait">
                {step === 'instruction' && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="w-full max-w-sm space-y-6 text-center relative z-10"
                    >
                        <div className="bg-white rounded-3xl p-6 shadow-2xl overflow-hidden relative">
                            {/* Decorative top pattern */}
                            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-emerald-400 to-emerald-600" />

                            <div className="flex items-center justify-center mb-6 mt-2">
                                <div className="bg-emerald-100 p-4 rounded-full border-4 border-emerald-50">
                                    <Hash className="h-8 w-8 text-emerald-600" />
                                </div>
                            </div>

                            <h2 className="text-2xl font-bold text-gray-900 mb-2">Deposit Code</h2>
                            <p className="text-gray-500 mb-6 px-4">Enter this code on the Smart Bin screen to unlock the deposit door.</p>

                            <div className="bg-slate-900 p-6 rounded-2xl mb-6 shadow-inner">
                                <div className="text-4xl font-mono font-bold tracking-widest text-emerald-400 tabular-nums">
                                    {depositCode.slice(0, 3)}-{depositCode.slice(3)}
                                </div>
                                <p className="text-slate-500 text-xs mt-2 uppercase tracking-wide">Valid for 15:00 minutes</p>
                            </div>

                            <div className="space-y-3">
                                <Button
                                    className="w-full bg-emerald-600 hover:bg-emerald-700 h-12 text-lg shadow-lg shadow-emerald-500/20"
                                    onClick={() => navigate('/bins')}
                                >
                                    <MapPin className="mr-2 h-5 w-5" />
                                    Find Nearby Bin
                                </Button>
                                <Button
                                    variant="outline"
                                    className="w-full border-emerald-200 text-emerald-700 hover:bg-emerald-50 h-12"
                                    onClick={() => setStep('simulator')}
                                >
                                    <Monitor className="mr-2 h-4 w-4" />
                                    Launch Bin Simulator
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                )}

                {step === 'success' && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="w-full max-w-sm text-center relative z-10"
                    >
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', duration: 0.5 }}
                            className="mb-8 relative inline-block"
                        >
                            <div className="absolute inset-0 bg-emerald-500 blur-3xl opacity-20" />
                            <Trophy className="h-32 w-32 text-yellow-400 drop-shadow-2xl relative z-10" />
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                                className="absolute -top-4 -right-4"
                            >
                                <Leaf className="h-12 w-12 text-emerald-400" />
                            </motion.div>
                        </motion.div>

                        <h1 className="text-4xl font-bold text-white mb-2">Verified!</h1>
                        <p className="text-emerald-100 mb-8 text-lg">Smart Bin confirmed your deposit.</p>

                        <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 mb-8 border border-white/20">
                            <p className="text-emerald-200 text-sm font-medium uppercase tracking-wider mb-2">You Earned</p>
                            <div className="flex items-center justify-center gap-2">
                                <span className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-yellow-400 to-amber-500 font-mono">
                                    {currentPoints}
                                </span>
                                <span className="text-2xl font-bold text-amber-400 mt-4">PTS</span>
                            </div>
                        </div>

                        <Button
                            className="w-full bg-white text-emerald-900 hover:bg-emerald-50 h-14 text-lg font-bold shadow-xl shadow-emerald-900/20"
                            onClick={handleComplete}
                        >
                            Collect Reward <ArrowRight className="ml-2 h-5 w-5" />
                        </Button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
