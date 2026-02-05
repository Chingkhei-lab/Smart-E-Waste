import { useNavigate } from 'react-router-dom';
import {
    TrendingUp, Leaf, Droplet, Zap, TreePine, Award,
    BarChart3, ArrowLeft, Calendar, Target
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useEwasteStore } from '@/store/ewasteStore';
import { LineChart, Line, BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { cn } from '@/lib/utils';

export default function ImpactDashboard() {
    const navigate = useNavigate();
    const { currentUser } = useEwasteStore();

    if (!currentUser) return null;

    // Calculate environmental equivalents
    const co2Saved = currentUser.co2Saved;
    const treesEquivalent = Math.round(co2Saved / 20); // 1 tree absorbs ~20kg CO2/year
    const waterSaved = currentUser.recyclingHistory.length * 50; // 50L per device
    const energySaved = currentUser.recyclingHistory.length * 15; // 15 kWh per device

    // Generate trend data (last 7 days)
    const getLast7Days = () => {
        const days = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            days.push({
                day: date.toLocaleDateString('en-US', { weekday: 'short' }),
                date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
            });
        }
        return days;
    };

    const last7Days = getLast7Days();

    // Map recycling history to days
    const trendData = last7Days.map(({ day, date }) => {
        const dayRecords = currentUser.recyclingHistory.filter(record => {
            const recordDate = new Date(record.depositedAt);
            return recordDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) === date;
        });

        const co2 = dayRecords.reduce((sum, r) => sum + (r.weight / 1000) * 2.5, 0);
        const items = dayRecords.length;
        const points = dayRecords.reduce((sum, r) => sum + r.pointsEarned, 0);

        return { day, co2: Math.round(co2 * 10) / 10, items, points };
    });

    // Category breakdown
    const categoryData = currentUser.recyclingHistory.reduce((acc, record) => {
        const category = record.itemType;
        if (!acc[category]) {
            acc[category] = { category, count: 0, points: 0 };
        }
        acc[category].count++;
        acc[category].points += record.pointsEarned;
        return acc;
    }, {} as Record<string, { category: string; count: number; points: number }>);

    const categoryChartData = Object.values(categoryData);

    // Stats comparison
    const avgUserItems = 8; // Mock average
    const avgUserCO2 = 15; // Mock average
    const vsAvgItems = currentUser.recyclingHistory.length - avgUserItems;
    const vsAvgCO2 = co2Saved - avgUserCO2;

    return (
        <div className="min-h-screen bg-gray-50 pb-6">
            {/* Header */}
            <div className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white p-6 rounded-b-3xl shadow-lg">
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
                        <BarChart3 className="h-7 w-7" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold">Your Impact</h1>
                        <p className="text-emerald-100">Environmental contribution</p>
                    </div>
                </div>

                {/* Main Stats */}
                <div className="grid grid-cols-2 gap-3 mt-6">
                    <div className="bg-white/10 backdrop-blur rounded-2xl p-4">
                        <Leaf className="h-6 w-6 mb-2 text-emerald-200" />
                        <p className="text-3xl font-bold">{co2Saved}kg</p>
                        <p className="text-sm text-emerald-100">CO₂ Saved</p>
                    </div>
                    <div className="bg-white/10 backdrop-blur rounded-2xl p-4">
                        <Award className="h-6 w-6 mb-2 text-emerald-200" />
                        <p className="text-3xl font-bold">{currentUser.recyclingHistory.length}</p>
                        <p className="text-sm text-emerald-100">Items Recycled</p>
                    </div>
                </div>
            </div>

            <div className="px-4 space-y-4 mt-6">
                {/* Environmental Equivalents */}
                <Card>
                    <CardContent className="p-4">
                        <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <TreePine className="h-5 w-5 text-emerald-600" />
                            Environmental Equivalents
                        </h2>
                        <div className="grid grid-cols-3 gap-3">
                            <div className="text-center p-3 bg-green-50 rounded-xl">
                                <TreePine className="h-6 w-6 text-green-600 mx-auto mb-1" />
                                <p className="text-2xl font-bold text-green-900">{treesEquivalent}</p>
                                <p className="text-xs text-green-700">Trees Planted</p>
                            </div>
                            <div className="text-center p-3 bg-blue-50 rounded-xl">
                                <Droplet className="h-6 w-6 text-blue-600 mx-auto mb-1" />
                                <p className="text-2xl font-bold text-blue-900">{waterSaved}L</p>
                                <p className="text-xs text-blue-700">Water Saved</p>
                            </div>
                            <div className="text-center p-3 bg-amber-50 rounded-xl">
                                <Zap className="h-6 w-6 text-amber-600 mx-auto mb-1" />
                                <p className="text-2xl font-bold text-amber-900">{energySaved}</p>
                                <p className="text-xs text-amber-700">kWh Saved</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* CO₂ Savings Trend */}
                <Card>
                    <CardContent className="p-4">
                        <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-emerald-600" />
                            CO₂ Savings (Last 7 Days)
                        </h2>
                        <ResponsiveContainer width="100%" height={200}>
                            <AreaChart data={trendData}>
                                <defs>
                                    <linearGradient id="colorCO2" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                <XAxis dataKey="day" tick={{ fontSize: 12 }} stroke="#6b7280" />
                                <YAxis tick={{ fontSize: 12 }} stroke="#6b7280" />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'white',
                                        border: '1px solid #e5e7eb',
                                        borderRadius: '8px',
                                        fontSize: '12px'
                                    }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="co2"
                                    stroke="#10b981"
                                    strokeWidth={2}
                                    fill="url(#colorCO2)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Items by Category */}
                {categoryChartData.length > 0 && (
                    <Card>
                        <CardContent className="p-4">
                            <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <Calendar className="h-5 w-5 text-purple-600" />
                                Items by Category
                            </h2>
                            <ResponsiveContainer width="100%" height={200}>
                                <BarChart data={categoryChartData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                    <XAxis dataKey="category" tick={{ fontSize: 12 }} stroke="#6b7280" />
                                    <YAxis tick={{ fontSize: 12 }} stroke="#6b7280" />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: 'white',
                                            border: '1px solid #e5e7eb',
                                            borderRadius: '8px',
                                            fontSize: '12px'
                                        }}
                                    />
                                    <Bar dataKey="count" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                )}

                {/* Points Trend */}
                <Card>
                    <CardContent className="p-4">
                        <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <Target className="h-5 w-5 text-amber-600" />
                            Points Earned (Last 7 Days)
                        </h2>
                        <ResponsiveContainer width="100%" height={200}>
                            <LineChart data={trendData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                <XAxis dataKey="day" tick={{ fontSize: 12 }} stroke="#6b7280" />
                                <YAxis tick={{ fontSize: 12 }} stroke="#6b7280" />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'white',
                                        border: '1px solid #e5e7eb',
                                        borderRadius: '8px',
                                        fontSize: '12px'
                                    }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="points"
                                    stroke="#f59e0b"
                                    strokeWidth={3}
                                    dot={{ fill: '#f59e0b', r: 4 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Comparison */}
                <Card>
                    <CardContent className="p-4">
                        <h2 className="font-bold text-gray-900 mb-4">vs. Average User</h2>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                                <span className="text-sm text-gray-600">Items Recycled</span>
                                <Badge
                                    variant="outline"
                                    className={cn(
                                        "font-semibold",
                                        vsAvgItems > 0 ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-gray-100 text-gray-600"
                                    )}
                                >
                                    {vsAvgItems > 0 ? '+' : ''}{vsAvgItems} items
                                </Badge>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                                <span className="text-sm text-gray-600">CO₂ Saved</span>
                                <Badge
                                    variant="outline"
                                    className={cn(
                                        "font-semibold",
                                        vsAvgCO2 > 0 ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-gray-100 text-gray-600"
                                    )}
                                >
                                    {vsAvgCO2 > 0 ? '+' : ''}{vsAvgCO2}kg
                                </Badge>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
