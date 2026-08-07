"use client";

import { useQuery, usePaginatedQuery } from "convex/react";
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
    Shield,
    X,
    Loader2
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
    const [isSignalModalOpen, setIsSignalModalOpen] = useState(false);
    const [signalSearch, setSignalSearch] = useState("");
    const [signalType, setSignalType] = useState<"all" | "visit" | "article" | "reaction">("all");
    const [signalDateRange, setSignalDateRange] = useState(7);



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

    // Real trend for Total Traffic from getTrafficStats
    const trafficTrend = `${trafficStats.isTrendUp ? "+" : ""}${trafficStats.trend}%`;

    // Engagement rate computed from real top-content data (reactions / unique readers)
    const totalReactions = (topContent as { reactions?: number }[]).reduce((acc: number, a) => acc + (a.reactions || 0), 0);
    const engagementReach = (topContent as { uniqueViews?: number }[]).reduce((acc: number, a) => acc + (a.uniqueViews || 0), 0);
    const engagementRate = engagementReach > 0 ? ((totalReactions / engagementReach) * 100).toFixed(1) : "0";

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
                    trend={trafficTrend}
                    color="blue"
                />
                <StatCard
                    label="Unique Reach"
                    value={totalUniqueVisitors.toLocaleString()}
                    icon={Globe}
                    trend="—"
                    color="purple"
                />
                <StatCard
                    label="Engagement rate"
                    value={`${engagementRate}%`}
                    icon={TrendingUp}
                    trend="—"
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
                        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 shadow-sm transition-all duration-500">
                            <h3 className="text-lg font-serif font-black text-gray-950 dark:text-white mb-6 flex items-center gap-3">
                                <MousePointer2 className="text-blue-600 dark:text-blue-500" size={20} />
                                Origin points
                            </h3>
                            <div className="h-[220px]">
                                <ReferrerChart data={referrerStats} />
                            </div>
                        </div>

                        {/* Device Breakdown */}
                        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 shadow-sm transition-all duration-500">
                            <h3 className="text-base font-serif font-black text-gray-950 dark:text-white mb-6 flex items-center gap-3">
                                <Smartphone className="text-purple-600 dark:text-purple-500" size={20} />
                                Access points
                            </h3>
                            <div className="flex flex-col sm:flex-row items-center gap-4">
                                <div className="h-[180px] w-full sm:w-1/2 flex justify-center">
                                    <DeviceChart data={deviceStats.devices} colors={COLORS} />
                                </div>
                                <div className="space-y-3 w-full sm:w-1/2">
                                    {deviceStats.devices.map((d: { name: string; value: number }, i: number) => (
                                        <div key={d.name} className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                                                <span className="text-[9px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-600 truncate">{d.name}</span>
                                            </div>
                                            <span className="text-xs font-black text-gray-950 dark:text-white transition-colors">{d.value}%</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Popular Content */}
                    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 shadow-sm transition-all duration-500">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-lg font-serif font-black text-gray-950 dark:text-white flex items-center gap-3">
                                <Eye className="text-blue-600 dark:text-blue-500" size={20} />
                                High impact content
                            </h3>
                        </div>
                        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
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
                    <div className="bg-gray-950 dark:bg-black border border-gray-800 rounded-3xl p-6 text-white shadow-2xl relative overflow-hidden transition-all duration-500">
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
                        <div className="space-y-6 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                            {realTimeActivity.slice(0, 20).map((visit: RealTimeVisit) => (
                                <div key={visit._id} className="group relative">
                                    <div className="flex gap-4">
                                        <div className="flex flex-col items-center gap-1 mt-1">
                                            <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.5)] group-hover:scale-125 transition-transform" />
                                            <div className="w-px h-full bg-zinc-800" />
                                        </div>
                                        <div className="flex-1 pb-4 min-w-0">
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="min-w-0">
                                                    <p className="text-[10px] font-black tracking-tight text-zinc-100 group-hover:text-white transition-colors truncate">
                                                        <span className="text-zinc-500">FR:</span> {visit.geoLocation?.country || (visit.ipAddress === "127.0.0.1" ? "Local Node" : "Unknown")}
                                                    </p>
                                                    {visit.ipAddress === "127.0.0.1" && (
                                                        <span className="inline-block text-[7px] bg-blue-500/20 text-blue-400 px-1 py-0 rounded border border-blue-500/30 uppercase tracking-tighter mt-1">Live Port</span>
                                                    )}
                                                </div>
                                                <span className="text-[8px] font-black text-zinc-600 uppercase tracking-tighter shrink-0 mt-0.5">{getTimeAgo(visit._creationTime)}</span>
                                            </div>
                                            <p className="text-[10px] text-zinc-400 mt-1 line-clamp-1 italic font-serif opacity-70 group-hover:opacity-100 transition-opacity">
                                                Viewing {visit.url.replace(process.env.NEXT_PUBLIC_SITE_URL || '', '') || '/home'}
                                            </p>
                                            <div className="flex items-center gap-3 mt-2">
                                                <span className="text-[8px] font-black uppercase tracking-widest text-zinc-600 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800 group-hover:border-zinc-700 transition-colors">
                                                    {visit.device}
                                                </span>
                                                <span className="text-[8px] font-black uppercase tracking-widest text-zinc-600 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800 group-hover:border-zinc-700 transition-colors">
                                                    {visit.browser} / {visit.os}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Geographic Stats */}
                    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 shadow-sm transition-all duration-500">
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

            {/* Raw Activity Stream Card */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-8 shadow-sm transition-all duration-500">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                            <Activity className="text-blue-500" size={24} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-serif font-black text-gray-950 dark:text-white transition-colors">Raw Signal Stream</h2>
                            <p className="text-gray-400 dark:text-gray-500 text-[10px] font-black uppercase tracking-[0.2em] mt-1">Direct pulse from the network edge</p>
                        </div>
                    </div>
                    <button 
                        onClick={() => setIsSignalModalOpen(true)}
                        className="bg-gray-950 dark:bg-white text-white dark:text-gray-950 px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:opacity-90 transition-all shadow-xl shadow-gray-950/20 dark:shadow-white/10"
                    >
                        View Full Spectrum
                    </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {realTimeActivity.slice(0, 4).map((visit: RealTimeVisit) => (
                        <div key={visit._id} className="p-4 rounded-2xl bg-gray-50/50 dark:bg-gray-800/20 border border-gray-100 dark:border-white/5">
                            <div className="flex justify-between items-start mb-3">
                                <span className="text-[8px] font-black text-blue-600 dark:text-blue-500 uppercase tracking-widest">{visit.geoLocation?.country || "Earth"}</span>
                                <span className="text-[8px] font-bold text-gray-400 uppercase tracking-tighter">{getTimeAgo(visit._creationTime)}</span>
                            </div>
                            <p className="text-[11px] font-serif font-black text-gray-900 dark:text-white line-clamp-1 mb-2">{visit.url.replace(process.env.NEXT_PUBLIC_SITE_URL || '', '') || '/'}</p>
                            <div className="flex gap-2">
                                <span className="text-[7px] font-black uppercase px-2 py-0.5 bg-white dark:bg-gray-900 border border-gray-100 dark:border-white/5 rounded text-gray-400">
                                    {visit.device}
                                </span>
                                <span className="text-[7px] font-black uppercase px-2 py-0.5 bg-white dark:bg-gray-900 border border-gray-100 dark:border-white/5 rounded text-gray-400">
                                    {visit.os}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Signal Spectrum Modal */}
            <AnimatePresence>
                {isSignalModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-white/80 dark:bg-gray-950/80 backdrop-blur-2xl">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 40 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 40 }}
                            className="bg-white dark:bg-gray-900 w-full max-w-6xl h-[85vh] rounded-[3rem] overflow-hidden shadow-2xl border border-gray-200 dark:border-white/5 flex flex-col"
                        >
                            {/* Modal Header */}
                            <div className="p-10 border-b border-gray-100 dark:border-white/5">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                                    <div className="flex items-center gap-5">
                                        <div className="w-14 h-14 rounded-[1.5rem] bg-gray-950 dark:bg-white flex items-center justify-center">
                                            <Activity className="text-white dark:text-gray-950" size={28} />
                                        </div>
                                        <div>
                                            <h3 className="text-3xl font-serif font-black text-gray-950 dark:text-white tracking-tight italic">Signal Spectrum</h3>
                                            <p className="text-gray-400 dark:text-gray-500 text-[10px] font-black uppercase tracking-[0.2em] mt-1">Comprehensive raw intelligence database</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="relative group">
                                            <input 
                                                type="text" 
                                                value={signalSearch}
                                                onChange={(e) => setSignalSearch(e.target.value)}
                                                placeholder="Filter by Signal ID or URL..."
                                                className="bg-gray-50/50 dark:bg-gray-950/50 border border-gray-100 dark:border-white/5 rounded-2xl px-6 py-4 text-xs font-bold text-gray-900 dark:text-white outline-none w-full md:w-64 transition-all focus:ring-4 focus:ring-blue-500/10 placeholder:text-gray-400"
                                            />
                                        </div>
                                        <div className="flex bg-gray-50 dark:bg-white/5 p-1.5 rounded-2xl border border-gray-100 dark:border-white/5">
                                            {[
                                                { id: 'all', label: 'All Signals' },
                                                { id: 'visit', label: 'Page Visits' },
                                                { id: 'article', label: 'Article Views' },
                                                { id: 'reaction', label: 'Reactions' }
                                            ].map((t) => (
                                                <button
                                                    key={t.id}
                                                    onClick={() => setSignalType(t.id as "all" | "visit" | "article" | "reaction")}
                                                    className={cn(
                                                        "px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all",
                                                        signalType === t.id 
                                                            ? "bg-white dark:bg-gray-900 text-blue-600 dark:text-blue-500 shadow-sm" 
                                                            : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                                    )}
                                                >
                                                    {t.label}
                                                </button>
                                            ))}
                                        </div>
                                        <select 
                                            value={signalDateRange}
                                            onChange={(e) => setSignalDateRange(Number(e.target.value))}
                                            className="bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 rounded-2xl px-6 py-4 text-[9px] font-black uppercase tracking-widest text-gray-900 dark:text-white outline-none focus:ring-4 focus:ring-blue-500/10 transition-all appearance-none pr-10"
                                        >
                                            <option value={1}>Last 24 Hours</option>
                                            <option value={7}>Last 7 Days</option>
                                            <option value={30}>Last 30 Days</option>
                                            <option value={90}>Last 3 Months</option>
                                        </select>
                                        <button 
                                            onClick={() => setIsSignalModalOpen(false)}
                                            className="w-14 h-14 rounded-2xl bg-gray-50 dark:bg-white/5 flex items-center justify-center text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                                        >
                                            <X size={24} />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Modal Content - Table */}
                            <div className="flex-1 overflow-auto p-10 custom-scrollbar">
                                <RawSignalStream 
                                    key={`${signalSearch}-${signalType}-${signalDateRange}`}
                                    search={signalSearch}
                                    type={signalType}
                                    days={signalDateRange}
                                />
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

function RawSignalStream({ search, type, days }: { search: string; type: "all" | "visit" | "article" | "reaction"; days: number }) {
    const { results: rawVisits, status: paginationStatus, loadMore, isLoading } = usePaginatedQuery(
        api.analytics.getRawVisits,
        { search, type, days },
        { initialNumItems: 20 }
    );

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="animate-spin text-blue-500" size={32} />
            </div>
        );
    }

    if (rawVisits.length === 0 && !isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center">
                <Shield className="text-gray-200 dark:text-gray-800 mb-4" size={48} />
                <h4 className="text-lg font-serif font-black text-gray-950 dark:text-white">No Signals Detected</h4>
                <p className="text-sm text-gray-400 mt-1 uppercase tracking-widest font-black">Refine your spectrum filters</p>
            </div>
        );
    }

    return (
        <>
            <table className="w-full text-left border-separate border-spacing-y-4">
                <thead>
                    <tr className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">
                        <th className="px-6 py-4">Time Entry</th>
                        <th className="px-6 py-4">Destination</th>
                        <th className="px-6 py-4">Geographic Origin</th>
                        <th className="px-6 py-4">Node Profile</th>
                        <th className="px-6 py-4 text-right">Access Point</th>
                    </tr>
                </thead>
                <tbody>
                    {rawVisits.map((visit) => (
                        <tr key={visit._id} className="group bg-gray-50/30 dark:bg-gray-800/10 hover:bg-blue-50/30 dark:hover:bg-blue-500/5 transition-all duration-300 rounded-[2rem]">
                            <td className="px-6 py-6 font-mono text-[10px] font-black text-gray-400 first:rounded-l-[2rem]">
                                {new Date(visit.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                <span className="block text-[8px] font-white mt-1 opacity-50 tracking-tighter">
                                    {new Date(visit.timestamp).toLocaleDateString()}
                                </span>
                            </td>
                            <td className="px-6 py-6">
                                <p className="text-xs font-serif font-black text-gray-900 dark:text-white underline decoration-blue-500/30 underline-offset-4 decoration-2">
                                    {visit.url.replace(process.env.NEXT_PUBLIC_SITE_URL || '', '') || '/home'}
                                </p>
                                <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mt-1 opacity-60">Entry Node Index</p>
                            </td>
                            <td className="px-6 py-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center font-black text-[10px] text-gray-400">
                                        {(visit.geoLocation?.country || "??").substring(0, 2).toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-tight">{visit.geoLocation?.country || "Undisclosed"}</p>
                                        <p className="text-[8px] font-bold text-gray-400 leading-none">{visit.geoLocation?.city || "Satellite Link"}</p>
                                    </div>
                                </div>
                            </td>
                            <td className="px-6 py-6">
                                <div className="flex flex-wrap gap-2">
                                    <span className="text-[9px] font-black border border-gray-100 dark:border-white/5 bg-white dark:bg-gray-950 px-3 py-1 rounded-full text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                                        {visit.browser}
                                    </span>
                                    <span className="text-[9px] font-black border border-gray-100 dark:border-white/5 bg-white dark:bg-gray-950 px-3 py-1 rounded-full text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                                        {visit.os}
                                    </span>
                                </div>
                            </td>
                            <td className="px-6 py-6 text-right last:rounded-r-[2rem]">
                                <p className="text-[10px] font-mono font-black text-blue-600 dark:text-blue-500 tracking-tighter">
                                    {visit.ipAddress === "127.0.0.1" ? "::INTERNAL_DOCK" : visit.ipAddress}
                                </p>
                                <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mt-1 italic">{visit.device}</p>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Pagination Trigger */}
            {paginationStatus === "CanLoadMore" && (
                <div className="mt-12 flex justify-center pb-12">
                    <button 
                        onClick={() => loadMore(20)}
                        className="flex items-center gap-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all hover:scale-105 active:scale-95 shadow-sm"
                    >
                        Retrieve Deeper Signals
                        <ChevronDown size={14} />
                    </button>
                </div>
            )}
            
            {(paginationStatus as string) === "LoadingMore" && (
                <div className="mt-12 flex justify-center pb-12">
                    <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-blue-500 animate-pulse">
                        <Loader2 className="animate-spin" size={16} />
                        Synchronizing...
                    </div>
                </div>
            )}
            
            <div className="p-8 border-t border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-gray-950/20 backdrop-blur-md flex items-center justify-between rounded-3xl mt-8">
                <div className="flex items-center gap-8">
                    <div>
                        <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest leading-none">Spectrum Depth</p>
                        <p className="text-sm font-black text-gray-900 dark:text-white mt-1">{rawVisits.length} Nodes</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.4)]" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-500">Live Sync</span>
                </div>
            </div>
        </>
    );
}

function StatCard({ label, value, icon: Icon, trend, color }: { label: string, value: string, icon: React.ElementType, trend: string, color: 'blue' | 'purple' }) {
    return (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 shadow-sm group hover:-translate-y-1 transition-all duration-500">
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
