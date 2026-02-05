import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, AlertCircle, Smartphone, Laptop, Tablet, Battery, Cable, HelpCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useEwasteStore } from '@/store/ewasteStore';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { DeviceType } from '@/types/ewaste';

const DEVICE_ICONS: Record<DeviceType, React.ElementType> = {
    smartphone: Smartphone,
    laptop: Laptop,
    tablet: Tablet,
    battery: Battery,
    charger: Cable,
    cable: Cable,
    unknown: HelpCircle
};

const DEVICE_LABELS: Record<DeviceType, string> = {
    smartphone: 'Smartphone',
    laptop: 'Laptop',
    tablet: 'Tablet',
    battery: 'Battery',
    charger: 'Charger',
    cable: 'Cable',
    unknown: 'Unknown Device'
};

export default function AnalysisView() {
    const { currentScan, setCondition, confirmDisposal } = useEwasteStore();
    const navigate = useNavigate();
    const [condition, setLocalCondition] = useState(0.5);
    const [showManualSelect, setShowManualSelect] = useState(false);
    const [selectedManualType, setSelectedManualType] = useState<DeviceType | null>(null);

    if (!currentScan) {
        navigate('/scan');
        return null;
    }

    const handleConditionChange = (value: number) => {
        setLocalCondition(value);
        setCondition(value);
    };

    const handleConfirm = (confirmed: boolean, manualType?: DeviceType) => {
        confirmDisposal(confirmed, manualType);
        navigate('/reward');
    };

    const DeviceIcon = DEVICE_ICONS[currentScan.deviceType];

    const confidenceColor =
        currentScan.confidence > 85 ? 'text-emerald-400' :
            currentScan.confidence > 70 ? 'text-amber-400' :
                'text-rose-400';

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.08, delayChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: { type: 'spring', stiffness: 300, damping: 24 }
        }
    };

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="min-h-screen bg-slate-900 p-6 flex flex-col items-center justify-center"
        >
            {/* AI Result Card */}
            <motion.div
                variants={itemVariants}
                className="w-full max-w-md bg-slate-800/50 backdrop-blur-xl rounded-3xl p-8 border border-slate-700/50"
            >
                {/* Confidence Header */}
                <div className="flex items-center justify-between mb-6">
                    <span className="text-slate-400 text-sm font-medium uppercase tracking-wider">
                        AI Confidence
                    </span>
                    <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.3, type: 'spring' }}
                        className={`text-3xl font-bold ${confidenceColor}`}
                    >
                        {currentScan.confidence}%
                    </motion.span>
                </div>

                {/* Device Icon & Name */}
                <motion.div
                    variants={itemVariants}
                    className="flex items-center gap-4 mb-6"
                >
                    <motion.div
                        animate={{
                            rotate: [0, 10, -10, 0],
                            scale: [1, 1.1, 1]
                        }}
                        transition={{ duration: 0.5, delay: 0.4 }}
                        className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center"
                    >
                        <DeviceIcon className="w-8 h-8 text-white" />
                    </motion.div>
                    <div>
                        <motion.h2
                            variants={itemVariants}
                            className="text-2xl font-bold text-white capitalize"
                        >
                            {DEVICE_LABELS[currentScan.deviceType]}
                        </motion.h2>
                        <p className="text-slate-400 text-sm">
                            Est. Weight: {currentScan.estimatedWeight.toFixed(2)}kg
                        </p>
                    </div>
                </motion.div>

                {/* Conditional UI Based on Confidence */}
                <AnimatePresence mode="wait">
                    {currentScan.isAutoAccept ? (
                        <motion.div
                            key="auto"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 mb-6"
                        >
                            <div className="flex items-center gap-2 text-emerald-400">
                                <Check className="w-5 h-5" />
                                <span className="font-medium">High confidence match</span>
                            </div>
                        </motion.div>
                    ) : currentScan.needsConfirmation ? (
                        <motion.div
                            key="confirm"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 mb-6"
                        >
                            <div className="flex items-start gap-2 text-amber-400">
                                <AlertCircle className="w-5 h-5 mt-0.5" />
                                <div>
                                    <p className="font-medium">We think it's a {DEVICE_LABELS[currentScan.deviceType]}</p>
                                    <p className="text-sm text-amber-400/70">Is this correct?</p>
                                </div>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="manual"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-4 mb-6"
                        >
                            <div className="flex items-start gap-2 text-rose-400">
                                <AlertCircle className="w-5 h-5 mt-0.5" />
                                <div>
                                    <p className="font-medium">Low confidence detection</p>
                                    <p className="text-sm text-rose-400/70">Please select the device type manually</p>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Manual Selection */}
                <AnimatePresence>
                    {(showManualSelect || !currentScan.isAutoAccept && !currentScan.needsConfirmation) && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="mb-6 overflow-hidden"
                        >
                            <p className="text-slate-400 text-sm mb-3">Select device type:</p>
                            <div className="grid grid-cols-3 gap-2">
                                {(Object.keys(DEVICE_ICONS) as DeviceType[]).filter(t => t !== 'unknown').map((type) => {
                                    const Icon = DEVICE_ICONS[type];
                                    return (
                                        <button
                                            key={type}
                                            onClick={() => setSelectedManualType(type)}
                                            className={cn(
                                                "p-3 rounded-xl border transition-colors flex flex-col items-center gap-1",
                                                selectedManualType === type
                                                    ? "bg-emerald-500/20 border-emerald-500 text-emerald-400"
                                                    : "bg-slate-700/50 border-slate-600 text-slate-400 hover:border-slate-500"
                                            )}
                                        >
                                            <Icon className="w-5 h-5" />
                                            <span className="text-xs capitalize">{type}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Condition Slider */}
                <motion.div variants={itemVariants} className="mb-6">
                    <label className="text-slate-300 text-sm font-medium mb-2 block">
                        Device Condition
                    </label>
                    <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={condition}
                        onChange={(e) => handleConditionChange(parseFloat(e.target.value))}
                        className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                    />
                    <div className="flex justify-between text-xs text-slate-500 mt-1">
                        <span>Damaged</span>
                        <span className="text-emerald-400 font-medium">{Math.round(condition * 100)}%</span>
                        <span>Like New</span>
                    </div>
                </motion.div>

                {/* Action Buttons */}
                <motion.div variants={itemVariants} className="flex gap-3">
                    {currentScan.needsConfirmation && !showManualSelect && (
                        <Button
                            variant="outline"
                            className="flex-1 border-slate-600 text-slate-300"
                            onClick={() => setShowManualSelect(true)}
                        >
                            No, Change
                        </Button>
                    )}
                    <Button
                        className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 text-white"
                        onClick={() => {
                            if (showManualSelect || (!currentScan.isAutoAccept && !currentScan.needsConfirmation)) {
                                if (selectedManualType) {
                                    handleConfirm(false, selectedManualType);
                                }
                            } else {
                                handleConfirm(true);
                            }
                        }}
                        disabled={
                            (showManualSelect || (!currentScan.isAutoAccept && !currentScan.needsConfirmation)) &&
                            !selectedManualType
                        }
                    >
                        {currentScan.isAutoAccept ? 'Continue' : 'Confirm'}
                    </Button>
                </motion.div>
            </motion.div>
        </motion.div>
    );
}
