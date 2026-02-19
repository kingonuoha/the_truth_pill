"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
    FileText,
    Eye,
    MessageSquare,
    Plus,
    Sparkles,
    ArrowUpRight,
    ArrowDownRight,
    Clock,
    UserPlus,
    MessageCircle,
    Activity,
    ChevronRight,
    TrendingUp,
    Users
} from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import {
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area
} from "recharts";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";

export default function AdminDashboard() {
    const { data: session } = useSession();
    const stats = useQuery(api.admin.getDashboardStats);
    const activity = useQuery(api.admin.getRecentActivity, { limit: 8 });
    const trafficStats = useQuery(api.analytics.getTrafficStats, { days: 7 });

    const isLoading = !stats || !activity || !trafficStats;

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 transition-colors duration-500">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center border border-blue-100 dark:border-blue-900/50 shadow-sm relative overflow-hidden">
                    <div className="absolute inset-0 bg-blue-600/10 animate-pulse" />
                    <Activity className="text-blue-600 dark:text-blue-400 animate-pulse" size={24} />
                </div>
                <p className="text-gray-400 dark:text-gray-500 font-bold text-[10px] uppercase tracking-[0.2em] animate-pulse">Synchronizing command center...</p>
            </div>
        );
    }

    // Format traffic data for chart
    const chartData = trafficStats.chartData.map((d: { date: string; visits: number }) => ({
        name: new Date(d.date).toLocaleDateString(undefined, { weekday: 'short' }),
        views: d.visits
    }));

    return (
        <div className="space-y-10 pb-12 font-sans">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-serif font-black text-gray-950 dark:text-white tracking-tight italic transition-colors">Pulse</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1 font-medium font-sans">
                        Control console for <span className="text-gray-950 dark:text-blue-400 font-bold">The Truth Pill</span>.
                        Welcome back, <span className="text-blue-600 dark:text-blue-500 font-bold">{session?.user?.name || 'Administrator'}</span>.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Link
                        href="/admin/ai-drafts"
                        className="flex items-center gap-2.5 px-5 py-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 font-black text-[10px] uppercase tracking-widest text-gray-950 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-700 transition-all active:scale-95 shadow-sm"
                    >
                        <Sparkles size={16} className="text-purple-500" />
                        AI Laboratory
                    </Link>
                    <Link
                        href="/admin/articles/new"
                        className="bg-blue-600 dark:bg-blue-500 text-white px-5 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2.5 hover:bg-blue-700 dark:hover:bg-blue-600 shadow-xl shadow-blue-600/20 transition-all active:scale-95"
                    >
                        <Plus size={16} />
                        New Transmission
                    </Link>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    label="Circulation"
                    value={stats.articles.published.toString()}
                    subValue={`${stats.articles.total} Total Entities`}
                    icon={FileText}
                    trend="+12.4%"
                    trendUp={true}
                    color="blue"
                />
                <StatCard
                    label="AI Resonance"
                    value={stats.articles.aiDrafts.toString()}
                    subValue="Awaiting Review"
                    icon={Sparkles}
                    color="purple"
                />
                <StatCard
                    label="Reach Intensity"
                    value={(stats.totalViews / 1000).toFixed(1) + "k"}
                    subValue="Article Impressions"
                    icon={Eye}
                    trend={`${trafficStats.isTrendUp ? '+' : ''}${trafficStats.trend}%`}
                    trendUp={trafficStats.isTrendUp}
                    color="blue"
                />
                <StatCard
                    label="Public Discourse"
                    value={stats.pendingCommentsCount.toString()}
                    subValue="Moderation Queue"
                    icon={MessageSquare}
                    trend="-2.1%"
                    trendUp={false}
                    color="cyan"
                />
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
                {/* Analytics Chart */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="bg-white dark:bg-gray-900 p-8 md:p-10 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm relative overflow-hidden group transition-all duration-500">
                        <div className="flex items-center justify-between mb-12">
                            <div>
                                <h3 className="text-2xl font-serif font-black text-gray-950 dark:text-white flex items-center gap-3 italic transition-colors">
                                    <TrendingUp size={24} className="text-blue-600 dark:text-blue-400" />
                                    Reach Dynamics
                                </h3>
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500 mt-1">7-Day signal volume analysis</p>
                            </div>
                            <Link
                                href="/admin/analytics"
                                className="bg-gray-50 dark:bg-gray-800 hover:bg-white dark:hover:bg-gray-700 border border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600 rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400 hover:text-gray-950 dark:hover:text-white transition-all active:scale-95"
                            >
                                Detailed Observatory
                            </Link>
                        </div>

                        <div className="h-[340px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData}>
                                    <defs>
                                        <linearGradient id="gradient-primary" x1="0" y1="0" x2="1" y2="0">
                                            <stop offset="0%" stopColor="#2563eb" />
                                            <stop offset="100%" stopColor="#7c3aed" />
                                        </linearGradient>
                                        <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#2563eb" stopOpacity={0.15} />
                                            <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-gray-100 dark:text-gray-800 transition-colors" />
                                    <XAxis
                                        dataKey="name"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 800 }}
                                        dy={12}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 800 }}
                                        dx={-10}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            borderRadius: '16px',
                                            border: '1px solid #f1f5f9',
                                            boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.05)',
                                            fontSize: '10px',
                                            fontWeight: '900',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.1em'
                                        }}
                                        cursor={{ stroke: '#2563eb', strokeWidth: 2, strokeDasharray: '4 4' }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="views"
                                        stroke="url(#gradient-primary)"
                                        strokeWidth={4}
                                        fillOpacity={1}
                                        fill="url(#colorViews)"
                                        animationDuration={1500}
                                        activeDot={{ r: 6, strokeWidth: 0, fill: "#2563eb" }}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Secondary Metrics */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-gray-950 dark:bg-black text-white p-8 rounded-2xl group relative overflow-hidden shadow-2xl border border-transparent dark:border-gray-900 transition-all duration-500">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/10 blur-3xl rounded-full -mr-16 -mt-16" />
                            <div className="relative z-10 flex items-center justify-between">
                                <div>
                                    <p className="text-gray-500 dark:text-gray-600 text-[10px] font-black uppercase tracking-[0.2em] mb-2">Audience Base</p>
                                    <h4 className="text-4xl font-serif font-black">{stats.usersCount}</h4>
                                    <div className="flex items-center gap-2 mt-4">
                                        <span className="bg-green-500/10 text-green-400 text-[10px] px-2.5 py-1 rounded-lg font-black flex items-center tracking-widest">
                                            <ArrowUpRight size={12} className="mr-1" />
                                            14% ACCRETION
                                        </span>
                                    </div>
                                </div>
                                <div className="w-12 h-12 bg-white/5 rounded-xl border border-white/10 flex items-center justify-center text-gray-400 dark:text-gray-500 font-bold transition-all">
                                    <Users size={24} />
                                </div>
                            </div>
                        </div>
                        <div className="bg-white dark:bg-gray-900 p-8 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm group relative overflow-hidden transition-all duration-500">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-600/5 blur-3xl rounded-full -mr-16 -mt-16" />
                            <div className="relative z-10 flex items-center justify-between">
                                <div>
                                    <p className="text-gray-400 dark:text-gray-500 text-[10px] font-black uppercase tracking-[0.2em] mb-2">Conversion Core</p>
                                    <h4 className="text-4xl font-serif font-black text-gray-950 dark:text-white">2.4%</h4>
                                    <div className="flex items-center gap-2 mt-4">
                                        <span className="bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] px-2.5 py-1 rounded-lg font-black flex items-center tracking-widest border border-blue-100 dark:border-blue-900/50">
                                            <TrendingUp size={12} className="mr-1" />
                                            OPTIMIZED
                                        </span>
                                    </div>
                                </div>
                                <div className="w-12 h-12 bg-blue-50 dark:bg-blue-500/10 rounded-xl border border-blue-100 dark:border-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
                                    <Sparkles size={24} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Recent Activity */}
                <div className="space-y-4">
                    <div className="bg-white dark:bg-gray-900 p-8 md:p-10 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm h-full flex flex-col transition-all duration-500">
                        <div className="flex items-center justify-between mb-10 pb-6 border-b border-gray-50 dark:border-gray-800">
                            <div>
                                <h3 className="text-2xl font-serif font-black text-gray-950 dark:text-white italic">Live Stream</h3>
                                <p className="text-[10px] text-gray-400 dark:text-gray-500 font-black uppercase tracking-widest mt-1">Real-time pulses</p>
                            </div>
                            <Link
                                href="/admin/activity"
                                className="w-10 h-10 bg-gray-50 dark:bg-gray-800 rounded-xl flex items-center justify-center text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-all active:scale-90"
                            >
                                <ChevronRight size={20} />
                            </Link>
                        </div>

                        <div className="space-y-4 flex-1">
                            {activity.map((item: { id: string; type: string; content: string; timestamp: number }) => (
                                <ActivityItem key={item.id} item={item} />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatCard({
    label,
    value,
    subValue,
    icon: Icon,
    trend,
    trendUp,
    color
}: {
    label: string,
    value: string,
    subValue: string,
    icon: React.ElementType,
    trend?: string,
    trendUp?: boolean,
    color: 'blue' | 'purple' | 'cyan'
}) {
    const variants = {
        blue: "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-900/50",
        purple: "bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-100 dark:border-purple-900/50",
        cyan: "bg-cyan-50 dark:bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-100 dark:border-cyan-900/50"
    };

    return (
        <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm hover:border-blue-200 dark:hover:border-blue-800 transition-all duration-500 group relative overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-8">
                <div className={cn("w-12 h-12 rounded-xl border flex items-center justify-center transition-all duration-500 group-hover:scale-110", variants[color])}>
                    <Icon size={20} />
                </div>
                {trend && (
                    <span className={cn(
                        "text-[9px] font-black flex items-center px-2 py-1 rounded-lg transition-all tracking-widest uppercase",
                        trendUp ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-red-50 text-red-600 border border-red-100'
                    )}>
                        {trendUp ? <ArrowUpRight size={10} className="mr-1" /> : <ArrowDownRight size={10} className="mr-1" />}
                        {trend}
                    </span>
                )}
            </div>

            <div className="mt-auto">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500 mb-1 group-hover:text-gray-950 dark:group-hover:text-white transition-colors">{label}</p>
                <h3 className="text-4xl font-serif font-black text-gray-950 dark:text-white tracking-tight leading-none mb-4 transition-colors">{value}</h3>
                <div className="flex items-center gap-2 pt-4 border-t border-gray-50 dark:border-gray-800">
                    <div className={cn("w-1.5 h-1.5 rounded-full", variants[color].split(' ')[1])} />
                    <p className="text-[9px] font-black uppercase text-gray-400 dark:text-gray-500 tracking-widest">{subValue}</p>
                </div>
            </div>
        </div>
    );
}

function ActivityItem({ item }: { item: { type: string; content: string; timestamp: number } }) {
    const icons = {
        comment: <MessageCircle size={14} />,
        signup: <UserPlus size={14} />,
        article: <FileText size={14} />
    };

    const variants = {
        comment: "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-900/50",
        signup: "bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400 border-green-100 dark:border-green-900/50",
        article: "bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-100 dark:border-purple-900/50"
    };

    return (
        <div className="flex gap-4 p-4 rounded-xl border border-transparent hover:border-gray-100 dark:hover:border-gray-800 hover:bg-gray-50/50 dark:hover:bg-gray-800 transition-all group">
            <div className={cn("w-10 h-10 border rounded-xl flex items-center justify-center flex-shrink-0 transition-all shadow-sm group-hover:scale-110 group-active:scale-95", variants[item.type as keyof typeof variants] || "bg-gray-50 dark:bg-gray-800 text-gray-400 dark:text-gray-500 border-gray-100 dark:border-gray-700 font-bold")}>
                {icons[item.type as keyof typeof icons] || <Activity size={14} />}
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-[11px] font-bold text-gray-900 dark:text-gray-100 leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">
                    {item.content}
                </p>
                <div className="flex items-center gap-2 mt-2">
                    <Clock size={10} className="text-gray-400 dark:text-gray-500" />
                    <span className="text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                        {formatDistanceToNow(item.timestamp)} ago
                    </span>
                </div>
            </div>
        </div>
    );
}
