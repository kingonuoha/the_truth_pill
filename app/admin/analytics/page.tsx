"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState } from "react";
import {
    TrendingUp,
    Users,
    Eye,
    Smartphone,
    Globe,
    MousePointer2,
    Calendar,
    ChevronDown,
    Activity,
    Shield
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn, getTimeAgo } from "@/lib/utils";
import { Doc } from "@/convex/_generated/dataModel";
import dynamic from "next/dynamic";

const TrafficChart = dynamic(() => import("@/components/analytics/traffic-chart").then(mod => mod.TrafficChart), {
    ssr: false,
    loading: () => <div className="h-full w-full bg-gray-50 rounded-xl animate-pulse border border-gray-100" />
});

const ReferrerChart = dynamic(() => import("@/components/analytics/referrer-chart").then(mod => mod.ReferrerChart), {
    ssr: false,
    loading: () => <div className="h-full w-full bg-gray-50 rounded-xl animate-pulse border border-gray-100" />
});

const DeviceChart = dynamic(() => import("@/components/analytics/device-chart").then(mod => mod.DeviceChart), {
    ssr: false,
    loading: () => <div className="h-40 w-40 bg-gray-50 rounded-full animate-pulse border border-gray-100" />
});

interface PopularArticle {
    id: string;
    title: string;
    uniqueViews: number;
    avgReadTime: number;
    engagementRate: number;
}

type RealTimeVisit = Doc<"pageVisits">;

interface ChartTooltipProps {
    active?: boolean;
    payload?: readonly { value: number | string; name: string;[key: string]: unknown }[];
    label?: string | number;
}

const COLORS = ["#2563eb", "#7c3aed", "#0891b2", "#4f46e5", "#db2777"];

const CustomTooltip = ({ active, payload, label }: ChartTooltipProps) => {
    if (active && payload && payload.length) {
        const val = payload[0].value;
        return (
            <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border border-gray-200 dark:border-gray-800 p-4 rounded-xl shadow-2xl transition-colors duration-500">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-1">
                    {label ? new Date(label).toLocaleDateString(undefined, { dateStyle: 'medium' }) : ''}
                </p>
                <p className="text-lg font-serif font-black text-gray-950 dark:text-white transition-colors">
                    {val} <span className="text-xs font-black uppercase tracking-widest text-blue-600 dark:text-blue-500">Visits</span>
                </p>
            </div>
        );
    }
    return null;
};

export default function AnalyticsPage() {
    const [days, setDays] = useState(30);
    const [isFilterOpen, setIsFilterOpen] = useState(false);



    const trafficStats = useQuery(api.analytics.getTrafficStats, { days });
    const geoStats = useQuery(api.analytics.getGeographicStats);
    const deviceStats = useQuery(api.analytics.getDeviceStats);
    const topContent = useQuery(api.analytics.getTopContent);
    const realTimeActivity = useQuery(api.analytics.getRealTimeActivity);
    const referrerStats = useQuery(api.analytics.getReferrerStats, { days });

    const isLoading = !trafficStats || !geoStats || !deviceStats || !topContent || !realTimeActivity || !referrerStats;

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh] transition-colors duration-500">
                <div className="animate-pulse flex flex-col items-center gap-4 text-blue-600 dark:text-blue-500">
                    <Activity className="animate-spin" size={32} />
                    <p className="text-gray-500 dark:text-gray-400 font-medium font-sans">Decoding traffic patterns...</p>
                </div>
            </div>
        );
    }

    const totalUniqueVisitors = (geoStats as { country: string; count: number }[]).reduce((acc: number, curr: { count: number }) => acc + curr.count, 0);

    return (
        <div className="space-y-12 pb-20 font-sans">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-serif font-black text-gray-950 dark:text-white tracking-tight italic transition-colors">Signals</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1 font-medium font-sans flex items-center gap-2">
                        Real-time intelligence from <span className="text-blue-600 dark:text-blue-500 font-bold">The Truth Pill</span> network.
                    </p>
                </div>

                <div className="relative">
                    <button
                        onClick={() => setIsFilterOpen(!isFilterOpen)}
                        className="flex items-center gap-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 px-5 py-3 rounded-xl font-bold text-xs uppercase tracking-widest text-gray-600 dark:text-gray-400 hover:border-blue-200 dark:hover:border-blue-800 transition-all shadow-sm active:scale-95"
                    >
                        <Calendar size={16} className="text-blue-600 dark:text-blue-500" />
                        Last {days} Days
                        <ChevronDown size={14} className={cn("transition-transform duration-300", isFilterOpen && "rotate-180")} />
                    </button>

                    <AnimatePresence>
                        {isFilterOpen && (
                            <motion.div
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                className="absolute right-0 mt-3 w-48 bg-white dark:bg-gray-950 border border-gray-100 dark:border-gray-900 rounded-2xl shadow-2xl p-2 z-50 transition-colors duration-500"
                            >
                                {[7, 14, 30, 90].map((d) => (
                                    <button
                                        key={d}
                                        onClick={() => {
                                            setDays(d);
                                            setIsFilterOpen(false);
                                        }}
                                        className={cn(
                                            "w-full text-left px-4 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                                            days === d
                                                ? "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400"
                                                : "text-gray-400 dark:text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-900 hover:text-gray-600 dark:hover:text-gray-400"
                                        )}
                                    >
                                        {d} Days
                                    </button>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Primary Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                <StatCard
                    label="Total Traffic"
                    value={trafficStats.totalVisits.toLocaleString()}
                    icon={Users}
                    trend="+12.5%"
                    color="blue"
                />
                <StatCard
                    label="Unique Reach"
                    value={totalUniqueVisitors.toLocaleString()}
                    icon={Globe}
                    trend="+8.2%"
                    color="purple"
                />
                <StatCard
                    label="Engagement rate"
                    value="64.8%"
                    icon={TrendingUp}
                    trend="+2.4%"
                    color="blue"
                />
                <StatCard
                    label="Active sessions"
                    value={realTimeActivity.length.toString()}
                    icon={Activity}
                    trend="Live"
                    color="purple"
                />
            </div>

            {/* Main Area Chart */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-10 shadow-sm transition-all duration-500">
                <div className="flex items-center justify-between mb-12">
                    <div>
                        <h2 className="text-2xl font-serif font-black text-gray-950 dark:text-white transition-colors">Traffic Flow</h2>
                        <p className="text-gray-400 dark:text-gray-500 text-[10px] font-black uppercase tracking-[0.2em] mt-1">Volume trajectory over time</p>
                    </div>
                </div>
                <div className="h-[400px]">
                    <TrafficChart data={trafficStats.chartData} days={days} customTooltip={<CustomTooltip />} />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Secondary Metrics */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Referrer Sources */}
                        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-8 shadow-sm transition-all duration-500">
                            <h3 className="text-lg font-serif font-black text-gray-950 dark:text-white mb-6 flex items-center gap-3">
                                <MousePointer2 className="text-blue-600 dark:text-blue-500" size={20} />
                                Origin points
                            </h3>
                            <div className="h-[250px]">
                                <ReferrerChart data={referrerStats} />
                            </div>
                        </div>

                        {/* Device Breakdown */}
                        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-8 shadow-sm transition-all duration-500">
                            <h3 className="text-lg font-serif font-black text-gray-950 dark:text-white mb-6 flex items-center gap-3">
                                <Smartphone className="text-purple-600 dark:text-purple-500" size={20} />
                                Access points
                            </h3>
                            <div className="flex items-center gap-10">
                                <div className="h-[200px] w-1/2">
                                    <DeviceChart data={deviceStats.devices} colors={COLORS} />
                                </div>
                                <div className="space-y-4 w-1/2">
                                    {deviceStats.devices.map((d: { name: string; value: number }, i: number) => (
                                        <div key={d.name} className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                                                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-600">{d.name}</span>
                                            </div>
                                            <span className="text-sm font-black text-gray-950 dark:text-white transition-colors">{d.value}%</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Popular Content */}
                    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-8 shadow-sm transition-all duration-500">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-lg font-serif font-black text-gray-950 dark:text-white flex items-center gap-3">
                                <Eye className="text-blue-600 dark:text-blue-500" size={20} />
                                High impact content
                            </h3>
                        </div>
                        <div className="space-y-4">
                            {topContent.map((article: PopularArticle, i: number) => (
                                <div key={article.id} className="flex items-center justify-between p-4 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all group">
                                    <div className="flex items-center gap-4">
                                        <span className="text-xs font-black text-gray-300 dark:text-gray-700 w-4">{i + 1}</span>
                                        <div>
                                            <h4 className="text-sm font-serif font-black text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1">{article.title}</h4>
                                            <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mt-0.5">{article.uniqueViews.toLocaleString()} readers</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-8">
                                        <div className="text-right">
                                            <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest leading-none">Attention</p>
                                            <p className="text-sm font-black text-gray-950 dark:text-white mt-1">{(article.avgReadTime / 60).toFixed(1)}m</p>
                                        </div>
                                        <div className="text-right w-16">
                                            <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest leading-none">Resonance</p>
                                            <p className="text-sm font-black text-blue-600 dark:text-blue-500 mt-1">{article.engagementRate}%</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Column: Real-time Feed & Geo */}
                <div className="space-y-8">
                    {/* Live Feed */}
                    <div className="bg-gray-950 dark:bg-black border border-gray-800 rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden transition-all duration-500">
                        <div className="absolute top-0 right-0 p-8">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-green-500 animate-ping" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-green-500">Live</span>
                            </div>
                        </div>
                        <h3 className="text-lg font-serif font-black mb-8 flex items-center gap-3">
                            <Activity size={20} className="text-blue-500" />
                            Pulse stream
                        </h3>
                        <div className="space-y-6">
                            {realTimeActivity.slice(0, 10).map((visit: RealTimeVisit) => (
                                <div key={visit._id} className="flex gap-4 group">
                                    <div className="flex flex-col items-center gap-1 mt-1">
                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)] group-hover:scale-150 transition-transform" />
                                        <div className="w-px h-full bg-gray-800" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-gray-300 group-hover:text-white transition-colors">
                                            Visitor from <span className="text-blue-400">{visit.geoLocation?.country || 'Unknown Port'}</span>
                                        </p>
                                        <p className="text-[10px] text-gray-500 dark:text-gray-600 mt-1 flex items-center gap-2">
                                            Accessed {getTimeAgo(visit._creationTime)}
                                            <span className="w-1 h-1 rounded-full bg-gray-700" />
                                            {visit.device}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Geographic Stats */}
                    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-8 shadow-sm transition-all duration-500">
                        <h3 className="text-lg font-serif font-black text-gray-950 dark:text-white mb-8 flex items-center gap-3">
                            <Shield className="text-blue-600 dark:text-blue-500" size={20} />
                            Global footprint
                        </h3>
                        <div className="space-y-6">
                            {geoStats.slice(0, 5).map((geo: { country: string; count: number }) => (
                                <div key={geo.country}>
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-xs font-black uppercase tracking-[0.1em] text-gray-600 dark:text-gray-400">{geo.country || 'Undisclosed'}</span>
                                        <span className="text-xs font-serif font-black text-gray-950 dark:text-white">{geo.count}</span>
                                    </div>
                                    <div className="w-full h-1.5 bg-gray-50 dark:bg-gray-800 rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${(geo.count / totalUniqueVisitors) * 100}%` }}
                                            transition={{ duration: 1, ease: "easeOut" }}
                                            className="h-full bg-gradient-to-r from-blue-600 to-purple-600"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatCard({ label, value, icon: Icon, trend, color }: { label: string, value: string, icon: React.ElementType, trend: string, color: 'blue' | 'purple' }) {
    return (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-8 shadow-sm group hover:-translate-y-1 transition-all duration-500">
            <div className="flex items-center justify-between mb-6">
                <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500",
                    color === 'blue' ? "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50" : "bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-100 dark:border-purple-900/50"
                )}>
                    <Icon size={24} />
                </div>
                {trend === 'Live' ? (
                    <div className="flex items-center gap-1.5 bg-green-50 dark:bg-green-500/10 px-3 py-1 rounded-full border border-green-100 dark:border-green-900/50">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-green-600 dark:text-green-400">{trend}</span>
                    </div>
                ) : (
                    <span className="text-[10px] font-black uppercase tracking-widest text-green-500 bg-green-50 dark:bg-green-500/10 px-3 py-1 rounded-full border border-green-100 dark:border-green-900/50">
                        {trend}
                    </span>
                )}
            </div>
            <h3 className="text-3xl font-serif font-black text-gray-950 dark:text-white transition-colors tracking-tight">{value}</h3>
            <p className="text-gray-400 dark:text-gray-500 text-[10px] font-black uppercase tracking-[0.2em] mt-1">{label}</p>
        </div>
    );
}
