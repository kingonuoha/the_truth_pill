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
            <div className="bg-white/90 backdrop-blur-md border border-gray-200 p-4 rounded-xl shadow-2xl">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">
                    {label ? new Date(label).toLocaleDateString(undefined, { dateStyle: 'medium' }) : ''}
                </p>
                <p className="text-lg font-serif font-black text-gray-950">
                    {val} <span className="text-xs font-black uppercase tracking-widest text-blue-600">Visits</span>
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
        const timer = setInterval(() => setNow(Date.now()), 1000 * 60);
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
            <div className="flex items-center justify-center min-vh-60 min-h-[60vh]">
                <div className="animate-pulse flex flex-col items-center gap-4 text-blue-600">
                    <Activity className="animate-spin" size={32} />
                    <p className="text-gray-500 font-medium font-sans">Decoding traffic patterns...</p>
                </div>
            </div>
        );
    }

    const totalUniqueVisitors = (geoStats as { country: string; count: number }[]).reduce((acc: number, curr: { count: number }) => acc + curr.count, 0);

    return (
        <div className="space-y-12 pb-24 font-sans text-gray-950">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-serif font-black tracking-tight">Observatory</h1>
                    <p className="text-gray-500 mt-1 font-medium font-sans">Real-time insights and visitor behavior patterns.</p>
                </div>

                {/* Time Range Filter */}
                <div className="relative">
                    <button
                        onClick={() => setIsFilterOpen(!isFilterOpen)}
                        className="flex items-center gap-4 px-6 py-3 bg-white border border-gray-200 rounded-xl shadow-sm hover:border-blue-300 transition-all group"
                    >
                        <Calendar size={18} className="text-gray-400 group-hover:text-blue-600" />
                        <span className="text-xs font-black uppercase tracking-[0.15em] text-gray-950">Protocol: {days} Days</span>
                        <ChevronDown size={14} className={cn("text-gray-400 transition-transform duration-300", isFilterOpen && "rotate-180")} />
                    </button>

                    <AnimatePresence>
                        {isFilterOpen && (
                            <motion.div
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                className="absolute right-0 mt-3 w-56 bg-white border border-gray-200 rounded-xl shadow-2xl z-50 p-2 overflow-hidden"
                            >
                                {[7, 30, 90, 365].map((d) => (
                                    <button
                                        key={d}
                                        onClick={() => {
                                            setDays(d);
                                            setIsFilterOpen(false);
                                        }}
                                        className={cn(
                                            "w-full text-left px-4 py-3 rounded-lg text-xs font-black uppercase tracking-widest transition-all",
                                            days === d
                                                ? "bg-blue-600 text-white shadow-lg shadow-blue-100"
                                                : "hover:bg-blue-50 text-gray-500 hover:text-blue-600"
                                        )}
                                    >
                                        Last {d === 365 ? 'Year' : `${d} Days`}
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
                    title="Traffic Volume"
                    value={trafficStats.totalVisits.toLocaleString()}
                    icon={Eye}
                    trend={`${trafficStats.isTrendUp ? '+' : ''}${trafficStats.trend}%`}
                    trendUp={trafficStats.isTrendUp}
                    color="blue"
                />
                <StatCard
                    title="Unique Citizens"
                    value={totalUniqueVisitors.toLocaleString()}
                    icon={Users}
                    trend="+12.4%"
                    trendUp={true}
                    color="purple"
                />
                <StatCard
                    title="Dwell Duration"
                    value="4.2m"
                    icon={Clock}
                    trend="-2.1%"
                    trendUp={false}
                    color="cyan"
                />
                <StatCard
                    title="Data Integrity"
                    value="99.9%"
                    icon={Shield}
                    trend="Stable"
                    trendUp={true}
                    color="blue"
                />
            </div>

            {/* Main Traffic Chart */}
            <section className="bg-white p-10 rounded-xl border border-gray-200 shadow-sm relative overflow-hidden group">
                <div className="flex items-center justify-between mb-10">
                    <div>
                        <h2 className="text-2xl font-serif font-black text-gray-950 tracking-tight">Signal Analysis</h2>
                        <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.15em] mt-1.5">Visitor volume across temporal dimensions</p>
                    </div>
                </div>

                <div className="h-[450px] w-full">
                    <TrafficChart
                        data={trafficStats.chartData}
                        days={days}
                        customTooltip={<CustomTooltip />}
                    />
                </div>
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Referrer Stats */}
                <section className="bg-white p-10 rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="flex items-center justify-between mb-10">
                        <div>
                            <h2 className="text-2xl font-serif font-black text-gray-950 tracking-tight">Inflow Channels</h2>
                            <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.15em] mt-1.5">Primary navigational upstream sources</p>
                        </div>
                        <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center border border-blue-100 shadow-sm shadow-blue-50">
                            <MousePointer2 size={24} />
                        </div>
                    </div>

                    <div className="h-[300px] w-full">
                        <ReferrerChart data={referrerStats} />
                    </div>
                </section>

                {/* Device Distribution */}
                <section className="bg-white p-10 rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between mb-10">
                        <div>
                            <h2 className="text-2xl font-serif font-black text-gray-950 tracking-tight">Medium Split</h2>
                            <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.15em] mt-1.5">Hardware and software ecosystem breakdown</p>
                        </div>
                        <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center border border-purple-100 shadow-sm shadow-purple-50">
                            <Smartphone size={24} />
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-10">
                        <div className="h-[250px] w-[250px] shrink-0">
                            <DeviceChart data={deviceStats.devices} colors={COLORS} />
                        </div>
                        <div className="flex-1 space-y-5 w-full">
                            {deviceStats.devices.map((d: { name: string; value: number }, i: number) => (
                                <div key={d.name} className="flex items-center gap-4 group/device">
                                    <div className="w-2.5 h-2.5 rounded-full shadow-sm group-hover/device:scale-150 transition-transform duration-300" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                                    <span className="text-[10px] font-black uppercase tracking-[0.15em] text-gray-400 group-hover/device:text-gray-950 transition-colors">{d.name}</span>
                                    <div className="flex-1 h-px bg-gray-50 group-hover/device:bg-gray-100 transition-colors" />
                                    <span className="text-sm font-serif font-black text-gray-950 group-hover/device:text-blue-600 transition-colors">{d.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            </div>

            {/* Geographic & Content Performance Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Geographic Stats */}
                <section className="bg-white p-10 rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between mb-10">
                        <div>
                            <h2 className="text-2xl font-serif font-black text-gray-950 tracking-tight">Top Locations</h2>
                            <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.15em] mt-1.5">Geographic distribution of your audience</p>
                        </div>
                        <div className="w-12 h-12 bg-cyan-50 text-cyan-600 rounded-xl flex items-center justify-center border border-cyan-100 shadow-sm shadow-cyan-50">
                            <Globe size={24} />
                        </div>
                    </div>

                    <div className="space-y-6">
                        {(geoStats as { country: string; count: number }[]).slice(0, 5).map((geo: { country: string; count: number }, i: number) => (
                            <div key={geo.country} className="group/geo">
                                <div className="flex items-center justify-between mb-2.5">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center text-2xl shadow-sm border border-gray-100 group-hover/geo:scale-110 group-hover/geo:bg-white group-hover/geo:rotate-3 transition-all duration-500">
                                            {getFlag(geo.country)}
                                        </div>
                                        <div>
                                            <span className="text-base font-serif font-black text-gray-950 block leading-tight">{geo.country}</span>
                                            <span className="text-[9px] text-gray-400 font-black uppercase tracking-widest">{((geo.count / totalUniqueVisitors) * 100).toFixed(1)}% Capacity</span>
                                        </div>
                                    </div>
                                    <span className="text-[10px] font-black text-blue-600 bg-blue-50 border border-blue-100 px-3.5 py-1.5 rounded-xl shadow-sm">{geo.count} Hits</span>
                                </div>
                                <div className="ml-16 w-full max-w-[calc(100%-64px)] h-1.5 bg-gray-50 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${(geo.count / totalUniqueVisitors) * 100}%` }}
                                        transition={{ duration: 1.5, delay: i * 0.1 }}
                                        className="h-full bg-blue-600 rounded-full shadow-lg shadow-blue-100"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Content Performance */}
                <section className="bg-white p-10 rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
                    <div className="flex items-center justify-between mb-10">
                        <div>
                            <h2 className="text-2xl font-serif font-black text-gray-950 tracking-tight">Viral Pulse</h2>
                            <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.15em] mt-1.5">High performing articles by unique engagement</p>
                        </div>
                    </div>

                    <div className="space-y-4 flex-1">
                        {(topContent as PopularArticle[]).slice(0, 6).map((article: PopularArticle, i: number) => (
                            <div
                                key={article.id}
                                className="flex items-center gap-5 p-4 rounded-xl hover:bg-gray-50/80 transition-all group overflow-hidden border border-transparent hover:border-gray-100"
                            >
                                <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-xs font-black text-gray-400 group-hover:bg-gray-950 group-hover:text-white group-hover:border-gray-950 transition-all duration-500 shadow-sm">
                                    {i + 1}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-base font-serif font-black text-gray-950 group-hover:text-blue-600 transition-colors truncate tracking-tight">{article.title}</p>
                                    <div className="flex items-center gap-4 mt-1">
                                        <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-gray-400">
                                            <Eye size={12} className="text-blue-500" />
                                            {article.uniqueViews} Unique
                                        </div>
                                        <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-gray-400">
                                            <Clock size={12} className="text-purple-500" />
                                            {article.avgReadTime > 60
                                                ? `${Math.floor(article.avgReadTime / 60)}m`
                                                : `${article.avgReadTime}s`} Dwell
                                        </div>
                                        <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-green-600">
                                            <TrendingUp size={12} />
                                            {article.engagementRate.toFixed(1)}% Conversion
                                        </div>
                                    </div>
                                </div>
                                <button className="p-2.5 opacity-0 group-hover:opacity-100 bg-white border border-gray-100 rounded-xl text-blue-600 hover:bg-blue-600 hover:text-white transition-all shadow-sm active:scale-90 duration-300">
                                    <TrendingUp size={18} />
                                </button>
                            </div>
                        ))}
                    </div>
                </section>
            </div>

            {/* Real-Time Activity */}
            <section className="bg-gray-950 p-12 rounded-xl text-white shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-600/10 blur-[130px] rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-purple-600/10 blur-[130px] rounded-full translate-y-1/2 -translate-x-1/2" />

                <div className="relative z-10">
                    <div className="flex items-center justify-between mb-12">
                        <div className="flex items-center gap-5">
                            <div className="relative">
                                <div className="w-5 h-5 bg-blue-500 rounded-full animate-ping absolute inset-0 opacity-20" />
                                <div className="w-5 h-5 bg-blue-500 rounded-full relative shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-serif font-black tracking-tight">Live Stream</h2>
                                <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.2em] mt-1.5">Real-time reader synchronization</p>
                            </div>
                        </div>
                        <div className="bg-white/5 border border-white/10 px-5 py-2.5 rounded-xl flex items-center gap-3 backdrop-blur-sm">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Telemetry Operational</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {realTimeActivity.length === 0 ? (
                            <div className="col-span-full py-24 text-center border border-white/5 rounded-xl bg-white/[0.02] flex flex-col items-center justify-center">
                                <div className="w-16 h-16 rounded-2xl border-2 border-dashed border-gray-800 flex items-center justify-center mb-6 text-gray-700">
                                    <Clock size={24} />
                                </div>
                                <p className="text-gray-500 font-bold uppercase text-[10px] tracking-widest">Awaiting digital presence...</p>
                            </div>
                        ) : (
                            (realTimeActivity as unknown as RealTimeVisit[]).slice(0, 10).map((visit: RealTimeVisit, i: number) => {
                                const isVeryRecent = (now - visit.timestamp) < 5 * 60 * 1000;
                                return (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.98 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: i * 0.05 }}
                                        key={visit._id}
                                        className="flex items-center gap-5 p-6 bg-white/[0.03] border border-white/5 rounded-xl hover:bg-white/[0.07] hover:border-white/10 transition-all cursor-default group"
                                    >
                                        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-gray-800 to-gray-950 border border-white/5 flex items-center justify-center text-3xl shadow-inner group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500">
                                            {getFlag(visit.geoLocation?.country || "")}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-3 mb-1.5">
                                                <span className="text-sm font-black tracking-tight truncate">Citizen {visit.visitorId.slice(0, 8)}</span>
                                                {isVeryRecent && (
                                                    <span className="text-[8px] text-blue-400 font-black uppercase tracking-widest bg-blue-400/10 px-2 py-0.5 rounded-md border border-blue-400/20">Active Now</span>
                                                )}
                                            </div>
                                            <p className="text-[11px] text-gray-500 truncate font-mono italic opacity-60">
                                                {visit.url.replace(typeof window !== 'undefined' ? window.location.origin : '', "") || '/home'}
                                            </p>
                                        </div>
                                        <div className="text-right flex flex-col items-end gap-2 shrink-0">
                                            <div className="flex gap-1.5">
                                                <span className="text-[8px] font-black text-white bg-gray-800 px-2 py-1 rounded-md uppercase tracking-widest shadow-sm">{visit.device}</span>
                                            </div>
                                            <span className="text-[9px] text-gray-500 font-black uppercase tracking-widest flex items-center gap-1.5">
                                                <Clock size={10} className="text-gray-600" />
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
    color: "blue" | "purple" | "cyan"
}) {
    const iconColors = {
        blue: "bg-blue-50 text-blue-600 border-blue-100",
        purple: "bg-purple-50 text-purple-600 border-purple-100",
        cyan: "bg-cyan-50 text-cyan-600 border-cyan-100"
    };

    return (
        <div className="p-8 rounded-xl border border-gray-200 bg-white shadow-sm group hover:border-blue-300 hover:shadow-xl hover:shadow-blue-100/50 hover:-translate-y-1 transition-all duration-500">
            <div className="flex items-center justify-between mb-8">
                <div className={cn("w-14 h-14 rounded-xl flex items-center justify-center transition-all duration-500 border shadow-sm group-hover:rotate-6", iconColors[color])}>
                    <Icon size={28} />
                </div>
                {trend && (
                    <div className={cn(
                        "text-[10px] font-black px-3 py-1.5 rounded-xl border flex items-center gap-1.5 shadow-sm",
                        trendUp ? "bg-green-50 text-green-600 border-green-100" : "bg-red-50 text-red-600 border-red-100"
                    )}>
                        <TrendingUp size={12} className={cn(!trendUp && "rotate-180")} />
                        {trend}
                    </div>
                )}
            </div>
            <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-1.5 leading-none">{title}</p>
                <p className="text-4xl font-serif font-black text-gray-950 leading-none tracking-tight">{value}</p>
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
