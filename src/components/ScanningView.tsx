import { useState, useCallback, useRef, useEffect } from 'react';
import Webcam from 'react-webcam';
import * as tf from '@tensorflow/tfjs';
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import {
    Scan, Camera, Zap, AlertTriangle, CheckCircle2,
    Settings, Keyboard, History, Flashlight, X, Smartphone, List, Loader2
} from 'lucide-react';
import { useEwasteStore } from '@/store/ewasteStore';
import { aiClassifier } from '@/services/aiClassifier';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

export default function ScanningView() {
    const [isScanning, setIsScanning] = useState(false);
    const [scanProgress, setScanProgress] = useState(0);
    const [showChecklist, setShowChecklist] = useState(() => {
        return localStorage.getItem('hideSafetyCheck') !== 'true';
    });
    const [flashlightOn, setFlashlightOn] = useState(false);
    const [showManual, setShowManual] = useState(false);
    const [dontAskAgain, setDontAskAgain] = useState(false);
    const [showHistory, setShowHistory] = useState(false);

    // AI / Camera State
    const webcamRef = useRef<Webcam>(null);
    const [model, setModel] = useState<cocoSsd.ObjectDetection | null>(null);
    const [detectedObject, setDetectedObject] = useState<{ class: string; score: number } | null>(null);
    const [isModelLoading, setIsModelLoading] = useState(true);

    const setScanResult = useEwasteStore(state => state.setScanResult);
    const currentUser = useEwasteStore(state => state.currentUser);
    const navigate = useNavigate();
    const requestRef = useRef<number>();

    // Lazy Load TensorFlow Model - only when user is ready to scan
    useEffect(() => {
        // Don't load model if safety checklist is still showing
        if (showChecklist) return;

        let isMounted = true;
        const loadModel = async () => {
            try {
                // Set backend to WebGL for performance, fallback to CPU if needed
                await tf.ready();
                const loadedModel = await cocoSsd.load({ base: 'lite_mobilenet_v2' });
                if (isMounted) {
                    setModel(loadedModel);
                    setIsModelLoading(false);
                    console.log('Coco-SSD model loaded');
                }
            } catch (err) {
                console.error('Failed to load TF model', err);
                if (isMounted) setIsModelLoading(false);
            }
        };

        // Only load if not already loaded or loading
        if (!model && isModelLoading) {
            loadModel();
        }

        return () => { isMounted = false; };
    }, [showChecklist, model, isModelLoading]);


    // Throttled Object Detection Loop with Memory Management
    useEffect(() => {
        let intervalId: NodeJS.Timeout;
        let isDetecting = false;

        const detectFrame = async () => {
            // Skip if already detecting or currently scanning
            if (isDetecting || isScanning) return;

            if (
                model &&
                webcamRef.current &&
                webcamRef.current.video &&
                webcamRef.current.video.readyState === 4
            ) {
                isDetecting = true;
                try {
                    const video = webcamRef.current.video;

                    // Use tf.tidy to automatically dispose tensors
                    const predictions = await tf.tidy(() => {
                        return model.detect(video);
                    });

                    if (predictions.length > 0) {
                        const relevant = predictions.find(p =>
                            ['cell phone', 'laptop', 'tv', 'remote', 'keyboard', 'mouse', 'monitor'].includes(p.class)
                        ) || predictions[0];

                        if (relevant.score > 0.5) {
                            setDetectedObject({ class: relevant.class, score: relevant.score });
                        } else {
                            setDetectedObject(null);
                        }
                    } else {
                        setDetectedObject(null);
                    }
                } catch (e) {
                    console.error("Detection error:", e);
                } finally {
                    isDetecting = false;
                }
            }
        };

        if (model && !isModelLoading) {
            // Run detection every 1000ms (1 second) to reduce CPU/memory usage
            intervalId = setInterval(detectFrame, 1000);
        }

        return () => {
            if (intervalId) clearInterval(intervalId);
            isDetecting = false;
        };
    }, [model, isModelLoading, isScanning]);


    const [checklist, setChecklist] = useState([
        { id: 1, text: 'SIM/SD cards removed', checked: false },
        { id: 2, text: 'Clean from grease/dirt', checked: false },
    ]);

    const allChecked = checklist.every(item => item.checked);

    const toggleCheck = (id: number) => {
        setChecklist(prev => prev.map(item =>
            item.id === id ? { ...item, checked: !item.checked } : item
        ));
    };

    const handleChecklistSubmit = () => {
        if (dontAskAgain) {
            localStorage.setItem('hideSafetyCheck', 'true');
        }
        setShowChecklist(false);
    };

    const handleScanStart = useCallback(async () => {
        if (isScanning) return;

        setIsScanning(true);
        setScanProgress(0);

        // Visual scan effect
        const duration = 1500;
        const startTime = Date.now();

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setScanProgress(eased * 100);

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                // Scan complete

                // Use detected object if available, otherwise fallback to demo
                let result;
                if (detectedObject) {
                    result = aiClassifier.classifyReal(detectedObject.class, detectedObject.score);
                } else {
                    // Fallback to demo if nothing detected
                    result = aiClassifier.classifyDemo();
                }

                setScanResult(result);
                setIsScanning(false);
                navigate('/analysis');
            }
        };

        requestAnimationFrame(animate);
    }, [isScanning, setScanResult, navigate, detectedObject]);

    const videoConstraints = {
        width: 720,
        height: 1280,
        facingMode: "environment"
    };

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Scan E-Waste</h1>
                    <p className="text-gray-500">Analyze your device for recycling</p>
                </div>
                <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setShowChecklist(true)}
                    className="relative"
                >
                    <AlertTriangle className="h-5 w-5 text-amber-500" />
                    {!allChecked && (
                        <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full animate-pulse" />
                    )}
                </Button>
            </div>

            {/* Main Scanner Area */}
            <div className="relative h-[65vh] rounded-3xl overflow-hidden bg-slate-900 shadow-2xl ring-1 ring-slate-900/5">
                {/* CSS Animations */}
                <style>{`
                    @keyframes scanLine {
                        0% { transform: translateY(-100%); opacity: 0; }
                        10% { opacity: 1; }
                        90% { opacity: 1; }
                        100% { transform: translateY(100vh); opacity: 0; }
                    }
                    .scan-line {
                        position: absolute; left: 0; right: 0; height: 3px;
                        background: linear-gradient(90deg, transparent 0%, #10b981 20%, #34d399 50%, #10b981 80%, transparent 100%);
                        box-shadow: 0 0 20px #10b981, 0 0 40px #10b981;
                        animation: scanLine 2s ease-in-out infinite;
                    }
                `}</style>

                {/* Real Camera Feed */}
                <div className="absolute inset-0 bg-black">
                    {isModelLoading && (
                        <div className="absolute inset-0 flex items-center justify-center z-10 text-white">
                            <div className="flex flex-col items-center gap-2">
                                <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
                                <span className="text-sm">Loading AI Model...</span>
                            </div>
                        </div>
                    )}
                    <Webcam
                        audio={false}
                        ref={webcamRef}
                        screenshotFormat="image/jpeg"
                        videoConstraints={videoConstraints}
                        className="absolute inset-0 w-full h-full object-cover"
                        onUserMediaError={(err) => console.error("Webcam Error:", err)}
                    />
                </div>

                {/* Overlay Gradient */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/60 pointer-events-none" />

                {/* Guide Frame */}
                {/* Central Focus Area */}
                <div className="absolute inset-0 flex items-center justify-center p-8 pointer-events-none">
                    <div className={cn(
                        "relative w-full max-w-sm aspect-[3/4] rounded-3xl border-2 transition-all duration-500",
                        isScanning ? "border-emerald-500 shadow-[0_0_50px_rgba(16,185,129,0.3)]" : "border-white/20"
                    )}>
                        {/* Corner Markers */}
                        <div className="absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-white/80 rounded-tl-xl" />
                        <div className="absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 border-white/80 rounded-tr-xl" />
                        <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 border-white/80 rounded-bl-xl" />
                        <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-white/80 rounded-br-xl" />

                        {/* Scanning Animation */}
                        {isScanning && (
                            <div className="absolute inset-0 overflow-hidden rounded-2xl">
                                <div className="scan-line" style={{ top: `${scanProgress}%` }} />
                                <div className="absolute inset-0 bg-emerald-500/10 animate-pulse" />
                            </div>
                        )}

                        {/* Detection Bounding Box Indicator (Simple Center) */}
                        {!isScanning && detectedObject && (
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 border-2 border-yellow-400 bg-yellow-400/20 px-3 py-1 rounded text-yellow-200 text-xs font-mono uppercase tracking-widest animate-pulse">
                                Target Locked
                            </div>
                        )}
                    </div>
                </div>

                {/* Top Controls */}
                <div className="absolute top-4 right-4 flex flex-col gap-2 z-20">
                    <Button
                        variant="ghost"
                        size="icon"
                        className={cn(
                            "rounded-full bg-black/40 text-white backdrop-blur hover:bg-black/60",
                            flashlightOn && "bg-yellow-500/20 text-yellow-400"
                        )}
                        onClick={() => setFlashlightOn(!flashlightOn)}
                    >
                        <Zap className="h-5 w-5" fill={flashlightOn ? "currentColor" : "none"} />
                    </Button>
                </div>

                {/* Status Text centered */}
                <div className="absolute top-8 left-0 right-0 text-center pointer-events-none z-20">
                    <Badge variant="outline" className="bg-black/50 text-white border-white/10 backdrop-blur px-4 py-1.5 transition-all">
                        {isScanning
                            ? 'Analyzing Device...'
                            : detectedObject
                                ? `Detected: ${detectedObject.class} (${Math.round(detectedObject.score * 100)}%)`
                                : isModelLoading
                                    ? 'Initializing AI...'
                                    : 'Align device within frame'}
                    </Badge>
                </div>

                {/* Bottom Trigger Area */}
                <div className="absolute bottom-0 left-0 right-0 p-8 flex items-center justify-between bg-gradient-to-t from-black/80 to-transparent pt-20 z-20">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="text-white/80 hover:text-white hover:bg-white/10"
                    >
                        <Settings className="h-6 w-6" />
                    </Button>

                    <button
                        onClick={handleScanStart}
                        disabled={isScanning || isModelLoading}
                        className={cn(
                            "group relative h-20 w-20 rounded-full flex items-center justify-center transition-all duration-300",
                            isScanning ? "scale-90" : "hover:scale-105",
                            isModelLoading && "opacity-50 cursor-not-allowed"
                        )}
                    >
                        <div className={cn(
                            "absolute inset-0 rounded-full border-4 transition-all duration-300",
                            isScanning ? "border-emerald-500 animate-spin border-t-transparent" : "border-white"
                        )} />
                        <div className={cn(
                            "h-16 w-16 rounded-full bg-white transition-all duration-200",
                            isScanning ? "bg-emerald-500 scale-75" : "group-hover:scale-90"
                        )} />
                        <Camera className={cn(
                            "absolute h-8 w-8 transition-colors",
                            isScanning ? "text-white" : "text-black"
                        )} />
                    </button>

                    <Button
                        variant="ghost"
                        size="icon"
                        className="text-white/80 hover:text-white hover:bg-white/10"
                        onClick={() => setShowManual(true)}
                    >
                        <Keyboard className="h-6 w-6" />
                    </Button>
                </div>
            </div>

            {/* Checklist Overlay */}
            {showChecklist && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in"
                    onClick={() => setShowChecklist(false)}
                >
                    <Card className="w-full max-w-sm overflow-hidden" onClick={(e) => e.stopPropagation()}>
                        <div className="bg-amber-50 p-4 border-b border-amber-100 flex items-start gap-3">
                            <div className="bg-amber-100 p-2 rounded-lg">
                                <AlertTriangle className="h-5 w-5 text-amber-600" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-semibold text-amber-900">Safety Check</h3>
                                <p className="text-sm text-amber-700">Please prepare your device before recycling</p>
                            </div>
                            <button onClick={() => setShowChecklist(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <CardContent className="p-4 space-y-3">
                            {checklist.map((item) => (
                                <div
                                    key={item.id}
                                    onClick={() => toggleCheck(item.id)}
                                    className={cn(
                                        "flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all",
                                        item.checked
                                            ? "bg-emerald-50 border-emerald-200"
                                            : "bg-gray-50 border-gray-100 hover:bg-gray-100"
                                    )}
                                >
                                    <div className={cn(
                                        "h-6 w-6 rounded-full border-2 flex items-center justify-center transition-colors",
                                        item.checked
                                            ? "bg-emerald-500 border-emerald-500"
                                            : "border-gray-300 bg-white"
                                    )}>
                                        {item.checked && <CheckCircle2 className="h-4 w-4 text-white" />}
                                    </div>
                                    <span className={cn(
                                        "font-medium",
                                        item.checked ? "text-emerald-900" : "text-gray-600"
                                    )}>
                                        {item.text}
                                    </span>
                                </div>
                            ))}

                            <div className="flex items-center gap-2 px-1">
                                <input
                                    type="checkbox"
                                    id="dontAskAgain"
                                    checked={dontAskAgain}
                                    onChange={(e) => setDontAskAgain(e.target.checked)}
                                    className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                                />
                                <label htmlFor="dontAskAgain" className="text-sm text-gray-500">
                                    Don't show this again
                                </label>
                            </div>

                            <Button
                                className="w-full mt-4 bg-emerald-600 hover:bg-emerald-700"
                                disabled={!allChecked}
                                onClick={handleChecklistSubmit}
                            >
                                {allChecked ? 'Ready to Scan' : `Complete ${checklist.filter(i => !i.checked).length} items`}
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* History Overlay */}
            {showHistory && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in"
                    onClick={() => setShowHistory(false)}
                >
                    <Card className="w-full max-w-sm h-[70vh] flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
                        <div className="bg-white p-4 border-b flex items-center justify-between sticky top-0">
                            <div className="flex items-center gap-2">
                                <History className="h-5 w-5 text-gray-500" />
                                <h3 className="font-semibold text-gray-900">Recent Scans</h3>
                            </div>
                            <button onClick={() => setShowHistory(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <CardContent className="p-4 space-y-3 overflow-y-auto flex-1">
                            {currentUser?.recyclingHistory.length === 0 ? (
                                <div className="text-center py-12">
                                    <div className="bg-gray-100 h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Scan className="h-8 w-8 text-gray-400" />
                                    </div>
                                    <p className="text-gray-500 font-medium">No history found</p>
                                    <p className="text-sm text-gray-400 mt-1">Items you confirm will appear here</p>
                                </div>
                            ) : (
                                currentUser?.recyclingHistory.slice().reverse().map((record, idx) => (
                                    <div
                                        key={idx}
                                        className="flex items-center justify-between p-3 rounded-xl border border-gray-100 hover:border-emerald-200 hover:bg-emerald-50/50 transition-all"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center">
                                                <Smartphone className="h-5 w-5 text-emerald-600" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-900 capitalize">{record.itemType}</p>
                                                <p className="text-xs text-gray-500">
                                                    {new Date(record.depositedAt).toLocaleDateString('en-IN', {
                                                        day: 'numeric',
                                                        month: 'short'
                                                    })} • {record.weight}g
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                                                +{record.pointsEarned} pts
                                            </Badge>
                                        </div>
                                    </div>
                                ))
                            )}
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-4">
                <Card className="bg-emerald-50 border-emerald-100 cursor-pointer hover:bg-emerald-100 transition-colors" onClick={() => setShowManual(true)}>
                    <CardContent className="p-4 flex flex-col items-center text-center gap-2">
                        <Keyboard className="h-8 w-8 text-emerald-600" />
                        <div>
                            <p className="font-semibold text-emerald-900">Manual Entry</p>
                            <p className="text-xs text-emerald-700">Enter device details manually</p>
                        </div>
                    </CardContent>
                </Card>
                <Card
                    className="cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => setShowHistory(true)}
                >
                    <CardContent className="p-4 flex flex-col items-center text-center gap-2">
                        <History className="h-8 w-8 text-gray-500" />
                        <div>
                            <p className="font-semibold text-gray-900">Recent Scans</p>
                            <p className="text-xs text-gray-500">View previous items</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
