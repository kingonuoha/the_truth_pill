"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useEffect, useState } from "react";
import {
    TrendingUp,
    Users,
    Eye,
    Smartphone,
    Globe,
    Clock,
    MousePointer2,
    Calendar,
    ChevronDown,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn, getTimeAgo } from "@/lib/utils";
import { Doc } from "@/convex/_generated/dataModel";
import dynamic from "next/dynamic";

const TrafficChart = dynamic(() => import("@/components/analytics/traffic-chart").then(mod => mod.TrafficChart), {
    ssr: false,
    loading: () => <div className="h-full w-full bg-zinc-50 rounded-3xl animate-pulse" />
});

const ReferrerChart = dynamic(() => import("@/components/analytics/referrer-chart").then(mod => mod.ReferrerChart), {
    ssr: false,
    loading: () => <div className="h-full w-full bg-zinc-50 rounded-3xl animate-pulse" />
});

const DeviceChart = dynamic(() => import("@/components/analytics/device-chart").then(mod => mod.DeviceChart), {
    ssr: false,
    loading: () => <div className="h-40 w-40 bg-zinc-50 rounded-full animate-pulse" />
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

const COLORS = ["#0ea5e9", "#a855f7", "#3b82f6", "#8b5cf6", "#6366f1"];

const CustomTooltip = ({ active, payload, label }: ChartTooltipProps) => {
    if (active && payload && payload.length) {
        const val = payload[0].value;
        return (
            <div className="bg-white/90 backdrop-blur-md border border-zinc-200 p-4 rounded-2xl shadow-xl">
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1">
                    {label ? new Date(label).toLocaleDateString(undefined, { dateStyle: 'medium' }) : ''}
                </p>
                <p className="text-lg font-bold text-zinc-900">
                    {val} <span className="text-sm font-medium text-zinc-500">Visits</span>
                </p>
            </div>
        );
    }
    return null;
};

export default function AnalyticsPage() {
    const [days, setDays] = useState(30);
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [now, setNow] = useState(() => Date.now());

    useEffect(() => {
        const timer = setInterval(() => setNow(Date.now()), 1000 * 60); // Update every minute
        return () => clearInterval(timer);
    }, []);

    const trafficStats = useQuery(api.analytics.getTrafficStats, { days });
    const geoStats = useQuery(api.analytics.getGeographicStats);
    const deviceStats = useQuery(api.analytics.getDeviceStats);
    const topContent = useQuery(api.analytics.getTopContent);
    const realTimeActivity = useQuery(api.analytics.getRealTimeActivity);
    const referrerStats = useQuery(api.analytics.getReferrerStats, { days });

    const isLoading = !trafficStats || !geoStats || !deviceStats || !topContent || !realTimeActivity || !referrerStats;

    if (isLoading) {
        return (
            <div className="space-y-8 animate-pulse">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="h-32 bg-zinc-100 rounded-3xl" />
                    ))}
                </div>
                <div className="h-[400px] bg-zinc-100 rounded-3xl" />
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="h-[300px] bg-zinc-100 rounded-3xl" />
                    <div className="h-[300px] bg-zinc-100 rounded-3xl" />
                </div>
            </div>
        );
    }

    const totalUniqueVisitors = (geoStats as { country: string; count: number }[]).reduce((acc: number, curr: { count: number }) => acc + curr.count, 0);

    return (
        <div className="space-y-10 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-serif font-black text-zinc-900 tracking-tight">The Observatory</h1>
                    <p className="text-zinc-500 mt-1 font-medium">Real-time insights and visitor behavior patterns.</p>
                </div>

                {/* Time Range Filter */}
                <div className="relative">
                    <button
                        onClick={() => setIsFilterOpen(!isFilterOpen)}
                        className="flex items-center gap-3 px-5 py-2.5 bg-white border border-zinc-200 rounded-2xl shadow-sm hover:border-sky-blue transition-all group"
                    >
                        <Calendar size={18} className="text-zinc-400 group-hover:text-sky-blue" />
                        <span className="text-sm font-bold text-zinc-900">Last {days} Days</span>
                        <ChevronDown size={16} className={cn("text-zinc-400 transition-transform", isFilterOpen && "rotate-180")} />
                    </button>

                    <AnimatePresence>
                        {isFilterOpen && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 10 }}
                                className="absolute right-0 mt-3 w-48 bg-white border border-zinc-200 rounded-2xl shadow-2xl z-50 p-2 overflow-hidden"
                            >
                                {[7, 30, 90].map((d) => (
                                    <button
                                        key={d}
                                        onClick={() => {
                                            setDays(d);
                                            setIsFilterOpen(false);
                                        }}
                                        className={cn(
                                            "w-full text-left px-4 py-2.5 rounded-xl text-sm font-bold transition-colors",
                                            days === d ? "bg-zinc-900 text-white" : "hover:bg-zinc-50 text-zinc-600"
                                        )}
                                    >
                                        Last {d} Days
                                    </button>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Total Visits"
                    value={trafficStats.totalVisits.toLocaleString()}
                    icon={Eye}
                    trend={`${trafficStats.isTrendUp ? '+' : ''}${trafficStats.trend}%`}
                    trendUp={trafficStats.isTrendUp}
                    color="sky"
                />
                <StatCard
                    title="Unique Visitors"
                    value={totalUniqueVisitors.toLocaleString()}
                    icon={Users}
                    trend="+8.2%"
                    trendUp={true}
                    color="purple"
                />
                <StatCard
                    title="Avg. Engagement"
                    value="4.2m"
                    icon={Clock}
                    trend="-2.1%"
                    trendUp={false}
                    color="indigo"
                />
                <StatCard
                    title="Traffic Quality"
                    value="94%"
                    icon={TrendingUp}
                    trend="+1.2%"
                    trendUp={true}
                    color="blue"
                />
            </div>

            {/* Main Traffic Chart */}
            <section className="bg-white p-8 rounded-[2.5rem] border border-zinc-200/60 shadow-sm relative overflow-hidden group">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h2 className="text-xl font-bold text-zinc-900 group-hover:text-primary transition-colors">Traffic Overview</h2>
                        <p className="text-sm text-zinc-400">Visitor volume over the selected period</p>
                    </div>
                </div>

                <div className="h-[400px] w-full mt-4">
                    <TrafficChart
                        data={trafficStats.chartData}
                        days={days}
                        customTooltip={<CustomTooltip />}
                    />
                </div>

                <svg width="0" height="0">
                    <linearGradient id="gradient-primary" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#0ea5e9" />
                        <stop offset="100%" stopColor="#a855f7" />
                    </linearGradient>
                </svg>
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Referrer Stats */}
                <section className="bg-white p-8 rounded-[2.5rem] border border-zinc-200/60 shadow-sm overflow-hidden">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className="text-xl font-bold text-zinc-900">Traffic Sources</h2>
                            <p className="text-sm text-zinc-400">Where your readers are coming from</p>
                        </div>
                        <div className="p-3 bg-zinc-50 rounded-2xl">
                            <MousePointer2 size={20} className="text-zinc-400" />
                        </div>
                    </div>

                    <div className="h-[250px] w-full">
                        <ReferrerChart data={referrerStats} />
                    </div>
                </section>

                {/* Device Distribution */}
                <section className="bg-white p-8 rounded-[2.5rem] border border-zinc-200/60 shadow-sm">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className="text-xl font-bold text-zinc-900">Platform Split</h2>
                            <p className="text-sm text-zinc-400">Reader device and software breakdown</p>
                        </div>
                        <div className="p-3 bg-zinc-50 rounded-2xl">
                            <Smartphone size={20} className="text-zinc-400" />
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-8">
                        <div className="h-[200px] w-[200px]">
                            <DeviceChart data={deviceStats.devices} colors={COLORS} />
                        </div>
                        <div className="flex-1 space-y-4 w-full">
                            {deviceStats.devices.map((d: { name: string; value: number }, i: number) => (
                                <div key={d.name} className="flex items-center gap-3">
                                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                                    <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">{d.name}</span>
                                    <div className="flex-1 h-[2px] bg-zinc-50" />
                                    <span className="text-sm font-black text-zinc-900">{d.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            </div>

            {/* Geographic & Content Performance Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Geographic Stats */}
                <section className="bg-white p-8 rounded-[2.5rem] border border-zinc-200/60 shadow-sm">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className="text-xl font-bold text-zinc-900">Top Locations</h2>
                            <p className="text-sm text-zinc-400">Geographic distribution of your audience</p>
                        </div>
                        <div className="p-3 bg-zinc-50 rounded-2xl">
                            <Globe size={20} className="text-zinc-400" />
                        </div>
                    </div>

                    <div className="space-y-5">
                        {(geoStats as { country: string; count: number }[]).slice(0, 5).map((geo: { country: string; count: number }, i: number) => (
                            <div key={geo.country} className="group">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-2xl bg-zinc-50 flex items-center justify-center text-xl shadow-sm border border-zinc-100 group-hover:scale-110 group-hover:bg-white transition-all duration-300">
                                            {getFlag(geo.country)}
                                        </div>
                                        <div>
                                            <span className="text-sm font-bold text-zinc-900 block leading-none">{geo.country}</span>
                                            <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">{((geo.count / totalUniqueVisitors) * 100).toFixed(1)}% of total</span>
                                        </div>
                                    </div>
                                    <span className="text-xs font-black text-zinc-900 bg-zinc-50 px-3 py-1 rounded-full">{geo.count} visits</span>
                                </div>
                                <div className="w-full h-1.5 bg-zinc-50 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${(geo.count / totalUniqueVisitors) * 100}%` }}
                                        transition={{ duration: 1.5, delay: i * 0.1 }}
                                        className="h-full bg-gradient-to-r from-sky-blue to-school-purple rounded-full shadow-[0_0_10px_rgba(14,165,233,0.3)]"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Content Performance */}
                <section className="bg-white p-8 rounded-[2.5rem] border border-zinc-200/60 shadow-sm overflow-hidden flex flex-col">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className="text-xl font-bold text-zinc-900">Popular Content</h2>
                            <p className="text-sm text-zinc-400">High performing articles by unique views</p>
                        </div>
                    </div>

                    <div className="space-y-4 flex-1">
                        {(topContent as PopularArticle[]).slice(0, 6).map((article: PopularArticle, i: number) => (
                            <div
                                key={article.id}
                                className="flex items-center gap-4 p-4 rounded-2xl hover:bg-zinc-50 transition-all group overflow-hidden"
                            >
                                <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center text-xs font-black text-zinc-500 group-hover:bg-zinc-900 group-hover:text-white transition-colors">
                                    {i + 1}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-zinc-900 group-hover:text-sky-blue transition-colors truncate">{article.title}</p>
                                    <div className="flex items-center gap-3 mt-1">
                                        <div className="flex items-center gap-1 text-[10px] font-bold text-zinc-400">
                                            <Eye size={12} />
                                            {article.uniqueViews} Unique
                                        </div>
                                        <div className="w-1.5 h-1.5 rounded-full bg-zinc-200" />
                                        <div className="flex items-center gap-1 text-[10px] font-bold text-sky-blue">
                                            <Clock size={12} />
                                            {article.avgReadTime > 60
                                                ? `${Math.floor(article.avgReadTime / 60)}m ${article.avgReadTime % 60}s`
                                                : `${article.avgReadTime}s`} Avg Read
                                        </div>
                                        <div className="w-1.5 h-1.5 rounded-full bg-zinc-200" />
                                        <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-500">
                                            {article.engagementRate.toFixed(1)}% Conv.
                                        </div>
                                    </div>
                                </div>
                                <button className="p-2 opacity-0 group-hover:opacity-100 bg-white border border-zinc-200 rounded-xl hover:text-sky-blue transition-all">
                                    <TrendingUp size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                </section>
            </div>

            {/* Real-Time Activity */}
            <section className="bg-zinc-950 p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-school-purple/10 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-sky-blue/10 blur-[120px] rounded-full translate-y-1/2 -translate-x-1/2" />

                <div className="relative z-10">
                    <div className="flex items-center justify-between mb-10">
                        <div className="flex items-center gap-4">
                            <div className="relative">
                                <div className="w-4 h-4 bg-emerald-500 rounded-full animate-ping absolute inset-0" />
                                <div className="w-4 h-4 bg-emerald-500 rounded-full relative" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold">Live Stream</h2>
                                <p className="text-zinc-500 text-sm font-medium">Monitoring active reader sessions</p>
                            </div>
                        </div>
                        <div className="bg-white/5 border border-white/10 px-4 py-2 rounded-2xl flex items-center gap-2">
                            <span className="w-2 h-2 bg-emerald-500 rounded-full" />
                            <span className="text-xs font-bold uppercase tracking-widest text-zinc-300">Operational</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {realTimeActivity.length === 0 ? (
                            <div className="col-span-full py-20 text-center border border-white/5 rounded-[3rem] bg-white/[0.02] flex flex-col items-center justify-center">
                                <div className="w-12 h-12 rounded-full border-2 border-dashed border-zinc-800 flex items-center justify-center mb-4 text-zinc-700">
                                    <Clock size={20} />
                                </div>
                                <p className="text-zinc-500 font-medium">No visitor activity in the last hour.</p>
                            </div>
                        ) : (
                            (realTimeActivity as unknown as RealTimeVisit[]).slice(0, 10).map((visit: RealTimeVisit, i: number) => {
                                const isVeryRecent = (now - visit.timestamp) < 5 * 60 * 1000;
                                return (
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.05 }}
                                        key={visit._id}
                                        className="flex items-center gap-5 p-5 bg-white/[0.03] border border-white/5 rounded-[2rem] hover:bg-white/[0.07] hover:border-white/10 transition-all cursor-default group"
                                    >
                                        <div className="w-12 h-12 rounded-[1.2rem] bg-gradient-to-br from-zinc-800 to-zinc-900 border border-white/5 flex items-center justify-center text-2xl shadow-inner group-hover:scale-110 transition-transform">
                                            {getFlag(visit.geoLocation?.country || "")}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-sm font-bold truncate">Visitor {visit.visitorId.slice(0, 8)}</span>
                                                {isVeryRecent ? (
                                                    <span className="text-[10px] text-emerald-400 font-black uppercase tracking-widest bg-emerald-400/10 px-2 py-0.5 rounded-full">Live</span>
                                                ) : (
                                                    <span className="text-[10px] text-zinc-400 font-black uppercase tracking-widest bg-zinc-400/10 px-2 py-0.5 rounded-full">Active Recently</span>
                                                )}
                                            </div>
                                            <p className="text-xs text-zinc-500 truncate font-mono">{visit.url.replace(typeof window !== 'undefined' ? window.location.origin : '', "")}</p>
                                        </div>
                                        <div className="text-right flex flex-col items-end gap-1.5">
                                            <div className="flex gap-1.5">
                                                <span className="text-[9px] font-black text-white bg-zinc-800 px-2 py-0.5 rounded-lg uppercase tracking-tight">{visit.device}</span>
                                                <span className="text-[9px] font-black text-sky-400 bg-sky-400/10 px-2 py-0.5 rounded-lg uppercase tracking-tight max-w-[60px] truncate">{visit.browser}</span>
                                            </div>
                                            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-tight flex items-center gap-1">
                                                <Clock size={10} />
                                                {getTimeAgo(visit.timestamp)}
                                            </span>
                                        </div>
                                    </motion.div>
                                );
                            })
                        )}
                    </div>
                </div>
            </section>
        </div>
    );
}

function StatCard({
    title,
    value,
    icon: Icon,
    trend,
    trendUp,
    color
}: {
    title: string;
    value: string;
    icon: React.ElementType;
    trend: string;
    trendUp?: boolean;
    color: "sky" | "purple" | "indigo" | "blue"
}) {
    const colorClasses = {
        sky: "from-sky-50 to-white text-sky-600 border-sky-100",
        purple: "from-purple-50 to-white text-purple-600 border-purple-100",
        indigo: "from-indigo-50 to-white text-indigo-600 border-indigo-100",
        blue: "from-blue-50 to-white text-blue-600 border-blue-100",
    };

    const iconClasses = {
        sky: "bg-sky-100 text-sky-600",
        purple: "bg-purple-100 text-purple-600",
        indigo: "bg-indigo-100 text-indigo-600",
        blue: "bg-blue-100 text-blue-600",
    };

    return (
        <div className={cn(
            "p-8 rounded-[2.5rem] border bg-gradient-to-br shadow-sm group hover:shadow-lg hover:-translate-y-1 transition-all duration-500",
            colorClasses[color]
        )}>
            <div className="flex items-center justify-between mb-6">
                <div className={cn("p-4 rounded-[1.2rem] group-hover:scale-110 transition-transform duration-500 shadow-sm border border-black/5", iconClasses[color])}>
                    <Icon size={24} />
                </div>
                <div className={cn(
                    "text-[11px] font-black px-3 py-1.5 rounded-2xl flex items-center gap-1 shadow-sm",
                    trendUp ? "bg-emerald-100 text-emerald-600" : "bg-rose-100 text-rose-600"
                )}>
                    {trendUp ? <TrendingUp size={12} /> : <TrendingUp size={12} className="rotate-180" />}
                    {trend}
                </div>
            </div>
            <div>
                <p className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-2">{title}</p>
                <p className="text-3xl font-black text-zinc-900 tracking-tight">{value}</p>
            </div>
        </div>
    );
}

function getFlag(countryName: string) {
    const flags: Record<string, string> = {
        "United States": "🇺🇸",
        "United Kingdom": "🇬🇧",
        "Canada": "🇨🇦",
        "Germany": "🇩🇪",
        "France": "🇫🇷",
        "Nigeria": "🇳🇬",
        "India": "🇮🇳",
        "Australia": "🇦🇺",
        "Japan": "🇯🇵",
        "Brazil": "🇧🇷",
        "Unknown": "🏳️",
    };
    return flags[countryName] || "🏳️";
}
