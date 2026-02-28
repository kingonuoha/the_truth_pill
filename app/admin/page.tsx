"use client";

import { useSession } from "next-auth/react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
    Activity,
    ArrowUpRight,
    ArrowDownRight,
    Plus,
    Sparkles,
    TrendingUp,
    Users,
    ChevronRight,
    Clock,
    MessageCircle,
    UserPlus,
    FileText,
    MessageSquare,
    Eye,
} from "lucide-react";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export default function AdminDashboard() {
    const { data: session } = useSession();
    const stats = useQuery(api.admin.getDashboardStats);
    const activity = useQuery(api.admin.getRecentActivity, { limit: 8 });
    const trafficStats = useQuery(api.analytics.getTrafficStats, { days: 7 });

    const isLoading = !stats || !activity || !trafficStats;

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 transition-colors duration-500">
                <div className="relative">
                    <div className="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 shadow-2xl overflow-hidden">
                        <Activity className="text-blue-500 animate-pulse" size={32} />
                    </div>
                    <div className="absolute inset-x-0 -bottom-8 flex justify-center">
                        <div className="flex gap-1">
                            <motion.div animate={{ scale: [1, 1.5, 1] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                            <motion.div animate={{ scale: [1, 1.5, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1.5 h-1.5 rounded-full bg-blue-500/60" />
                            <motion.div animate={{ scale: [1, 1.5, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1.5 h-1.5 rounded-full bg-blue-500/30" />
                        </div>
                    </div>
                </div>
                <p className="text-[10px] text-zinc-400 font-black uppercase tracking-[0.3em] ml-1">Loading Dashboard</p>
            </div>
        );
    }

    // Format traffic data for chart
    const chartData = trafficStats.chartData.map((d: { date: string; visits: number }) => ({
        name: new Date(d.date).toLocaleDateString(undefined, { weekday: 'short' }),
        views: d.visits
    }));

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-12 pb-20"
        >
            {/* Header Section */}
            <div className="relative group">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <div className="w-1.5 h-8 bg-blue-600 rounded-full" />
                            <h1 className="text-6xl font-serif font-black text-zinc-950 dark:text-white tracking-tighter leading-none italic">
                                Pulse
                            </h1>
                        </div>
                        <p className="text-zinc-500 dark:text-zinc-400 font-sans max-w-lg text-sm leading-relaxed">
                            Command & Control center for <span className="text-zinc-900 dark:text-white font-bold underline decoration-blue-500/30 underline-offset-4">The Truth Pill</span>.
                            Greetings, <span className="text-blue-600 dark:text-blue-400 font-black tracking-tight">{session?.user?.name || 'Administrator'}</span>.
                        </p>
                    </div>
                    <div className="flex items-center gap-4">
                        <Link
                            href="/admin/ai-drafts"
                            className="h-12 px-6 rounded-2xl flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.15em] bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 text-zinc-950 dark:text-white hover:border-zinc-300 dark:hover:border-zinc-700 hover:shadow-xl transition-all active:scale-95 group/btn"
                        >
                            <Sparkles size={16} className="text-purple-500 group-hover/btn:rotate-12 transition-transform" />
                            AI Drafts
                        </Link>
                        <Link
                            href="/admin/articles/new"
                            className="h-12 px-6 rounded-2xl flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.15em] bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-200 shadow-2xl shadow-zinc-950/20 dark:shadow-white/10 transition-all active:scale-95"
                        >
                            <Plus size={18} strokeWidth={3} />
                            New Post
                        </Link>
                    </div>
                </div>
            </div>

            {/* Metrics Ecosystem */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    label="Articles"
                    value={stats.articles.published.toString()}
                    subValue={`${stats.articles.total} Total Posts`}
                    icon={FileText}
                    trend="+12.4%"
                    trendUp={true}
                    color="blue"
                    delay={0.1}
                />
                <StatCard
                    label="AI Drafts"
                    value={stats.articles.aiDrafts.toString()}
                    subValue="Pending Review"
                    icon={Sparkles}
                    color="purple"
                    delay={0.2}
                />
                <StatCard
                    label="Total Views"
                    value={stats.totalReach.toLocaleString()}
                    subValue="Unique Visitors"
                    icon={Eye}
                    trend={`${trafficStats.isTrendUp ? '+' : ''}${trafficStats.trend}%`}
                    trendUp={trafficStats.isTrendUp}
                    color="blue"
                    delay={0.3}
                />
                <StatCard
                    label="New Comments"
                    value={stats.pendingCommentsCount.toString()}
                    subValue="Needs Moderation"
                    icon={MessageSquare}
                    trend="-2.1%"
                    trendUp={false}
                    color="cyan"
                    delay={0.4}
                />
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
                {/* Reach Dynamics Observatory */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="bg-white/40 dark:bg-zinc-950/40 backdrop-blur-3xl p-10 rounded-[3rem] border border-zinc-100 dark:border-zinc-800 shadow-sm relative group overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 blur-[100px] rounded-full -mr-32 -mt-32" />

                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-12 relative z-10">
                            <div className="space-y-1">
                                <h3 className="text-3xl font-serif font-black text-zinc-950 dark:text-white flex items-center gap-3 italic">
                                    Visitor Traffic
                                </h3>
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500 italic">Daily analysis of website visits</p>
                            </div>
                            <Link
                                href="/admin/analytics"
                                className="h-10 px-5 rounded-xl flex items-center gap-2 text-[9px] font-black uppercase tracking-widest bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-all active:scale-95"
                            >
                                Detailed Analytics
                                <ArrowUpRight size={12} />
                            </Link>
                        </div>

                        <div className="h-[400px] w-full relative z-10">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData}>
                                    <defs>
                                        <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1} />
                                            <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="6 6" vertical={false} stroke="currentColor" className="text-zinc-100 dark:text-zinc-800/50 transition-colors" />
                                    <XAxis
                                        dataKey="name"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 900 }}
                                        dy={15}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 900 }}
                                        dx={-10}
                                    />
                                    <Tooltip
                                        content={({ active, payload }) => {
                                            if (active && payload && payload.length) {
                                                return (
                                                    <div className="bg-zinc-950/90 backdrop-blur-xl border border-zinc-800 p-4 rounded-2xl shadow-2xl">
                                                        <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">{payload[0].payload.name}</p>
                                                        <p className="text-xl font-serif font-black text-white italic">{payload[0].value} <span className="text-[10px] not-italic text-zinc-500 ml-1">VIEWS</span></p>
                                                    </div>
                                                );
                                            }
                                            return null;
                                        }}
                                        cursor={{ stroke: '#2563eb', strokeWidth: 1, strokeDasharray: '4 4' }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="views"
                                        stroke="#2563eb"
                                        strokeWidth={4}
                                        fillOpacity={1}
                                        fill="url(#colorViews)"
                                        animationDuration={2000}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Secondary Metrics */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="bg-zinc-950 dark:bg-black p-8 rounded-[2.5rem] group relative overflow-hidden shadow-2xl border border-white/5 transition-all duration-500">
                            <div className="absolute top-0 right-0 w-48 h-48 bg-blue-600/20 blur-[80px] rounded-full -mr-24 -mt-24 group-hover:bg-blue-600/30 transition-all duration-700" />
                            <div className="relative z-10 space-y-4">
                                <div className="flex items-center justify-between">
                                    <p className="text-zinc-500 dark:text-zinc-600 text-[10px] font-black uppercase tracking-[0.3em] italic">Total Users</p>
                                    <div className="w-10 h-10 bg-white/5 rounded-xl border border-white/10 flex items-center justify-center text-zinc-400">
                                        <Users size={20} />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <h4 className="text-5xl font-serif font-black text-white italic tracking-tighter">{stats.usersCount}</h4>
                                    <div className="flex items-center gap-2">
                                        <span className="text-emerald-400 text-[9px] font-black tracking-[0.2em] flex items-center uppercase">
                                            <ArrowUpRight size={12} className="mr-1" />
                                            14% GROWTH
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white/40 dark:bg-zinc-900/40 backdrop-blur-xl p-8 rounded-[2.5rem] border border-zinc-100 dark:border-zinc-800/50 shadow-sm group relative overflow-hidden transition-all duration-500">
                            <div className="absolute top-0 right-0 w-48 h-48 bg-purple-600/5 blur-[80px] rounded-full -mr-24 -mt-24 group-hover:bg-purple-600/10 transition-all duration-700" />
                            <div className="relative z-10 space-y-4">
                                <div className="flex items-center justify-between">
                                    <p className="text-zinc-400 dark:text-zinc-500 text-[10px] font-black uppercase tracking-[0.3em] italic">Engagement Rate</p>
                                    <div className="w-10 h-10 bg-blue-500/10 rounded-xl border border-blue-500/20 flex items-center justify-center text-blue-600">
                                        <Sparkles size={20} />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <h4 className="text-5xl font-serif font-black text-zinc-900 dark:text-white italic tracking-tighter">2.4%</h4>
                                    <div className="flex items-center gap-2">
                                        <span className="text-blue-600 dark:text-blue-400 text-[9px] font-black tracking-[0.2em] flex items-center uppercase italic">
                                            <TrendingUp size={12} className="mr-1" />
                                            OPTIMIZED
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Live Stream: Real-time Pulses */}
                <div className="space-y-4">
                    <div className="bg-white/60 dark:bg-zinc-950/60 backdrop-blur-3xl p-8 rounded-[3rem] border border-zinc-100 dark:border-zinc-800/50 shadow-sm h-full flex flex-col transition-all duration-500">
                        <div className="flex items-center justify-between mb-10 pb-6 border-b border-zinc-50 dark:border-zinc-900">
                            <div className="space-y-1">
                                <h3 className="text-3xl font-serif font-black text-zinc-950 dark:text-white italic">Recent Activity</h3>
                                <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-black uppercase tracking-[0.2em] italic">Latest system events</p>
                            </div>
                            <Link
                                href="/admin/activity"
                                className="w-12 h-12 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-2xl flex items-center justify-center text-zinc-400 hover:text-blue-600 transition-all active:scale-90 shadow-sm"
                            >
                                <ChevronRight size={20} />
                            </Link>
                        </div>

                        <div className="space-y-1 flex-1 overflow-y-auto custom-scrollbar">
                            <AnimatePresence mode="popLayout">
                                {activity.map((item: { id: string; type: string; content: string; timestamp: number }, idx: number) => (
                                    <ActivityItem key={item.id} item={item} index={idx} />
                                ))}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

function StatCard({
    label,
    value,
    subValue,
    icon: Icon,
    trend,
    trendUp,
    color,
    delay = 0
}: {
    label: string,
    value: string,
    subValue: string,
    icon: React.ElementType,
    trend?: string,
    trendUp?: boolean,
    color: 'blue' | 'purple' | 'cyan',
    delay?: number
}) {
    const variants = {
        blue: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 group-hover:bg-blue-600 group-hover:text-white transition-all duration-500",
        purple: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20 group-hover:bg-purple-600 group-hover:text-white transition-all duration-500",
        cyan: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20 group-hover:bg-cyan-600 group-hover:text-white transition-all duration-500"
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay }}
            className="p-8 rounded-[2.5rem] transition-all border border-zinc-100 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/40 backdrop-blur-xl shadow-sm hover:shadow-2xl hover:border-blue-500/20 transition-all duration-700 group relative overflow-hidden flex flex-col min-h-[220px]"
        >
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-[60px] rounded-full -mr-16 -mt-16 group-hover:bg-blue-500/10 transition-all duration-700" />

            <div className="flex items-start justify-between mb-8 relative z-10">
                <div className={cn("w-14 h-14 rounded-2xl border flex items-center justify-center shadow-sm", variants[color])}>
                    <Icon size={24} />
                </div>
                {trend && (
                    <span className={cn(
                        "text-[9px] font-black flex items-center px-3 py-1.5 rounded-xl transition-all tracking-[0.1em] uppercase shadow-sm border",
                        trendUp
                            ? 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/50'
                            : 'bg-red-50 text-red-600 border-red-100 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900/50'
                    )}>
                        {trendUp ? <ArrowUpRight size={10} className="mr-1" /> : <ArrowDownRight size={10} className="mr-1" />}
                        {trend}
                    </span>
                )}
            </div>

            <div className="mt-auto relative z-10">
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-zinc-400 dark:text-zinc-500 mb-2 truncate group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition-colors italic">{label}</p>
                <h3 className="text-5xl font-serif font-black text-zinc-950 dark:text-white tracking-tighter leading-none italic mb-4 transition-transform group-hover:scale-105 origin-left transition-all duration-500">{value}</h3>
                <div className="flex items-center gap-3 pt-5 border-t border-zinc-100 dark:border-zinc-800/50">
                    <div className={cn("w-2 h-2 rounded-full", color === 'blue' ? 'bg-blue-500' : color === 'purple' ? 'bg-purple-500' : 'bg-cyan-500')} />
                    <p className="text-[9px] font-black uppercase text-zinc-400 dark:text-zinc-600 tracking-[0.15em]">{subValue}</p>
                </div>
            </div>
        </motion.div>
    );
}

function ActivityItem({ item, index }: { item: { type: string; content: string; timestamp: number }, index: number }) {
    const icons = {
        comment: <MessageCircle size={14} />,
        signup: <UserPlus size={14} />,
        article: <FileText size={14} />
    };

    const variants = {
        comment: "bg-blue-500/10 text-blue-600 border-blue-500/20 group-hover:bg-blue-600 group-hover:text-white transition-all duration-500",
        signup: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 group-hover:bg-emerald-600 group-hover:text-white transition-all duration-500",
        article: "bg-purple-500/10 text-purple-600 border-purple-500/20 group-hover:bg-purple-600 group-hover:text-white transition-all duration-500"
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="flex gap-5 p-5 rounded-[2rem] border border-transparent hover:border-zinc-200 dark:hover:border-zinc-800/50 hover:bg-white/60 dark:hover:bg-zinc-900/40 backdrop-blur-xl transition-all group relative overflow-hidden"
        >
            <div className={cn("w-12 h-12 border rounded-2xl flex items-center justify-center flex-shrink-0 transition-all shadow-sm group-hover:scale-110 group-hover:rotate-3", variants[item.type as keyof typeof variants] || "bg-zinc-100 text-zinc-400 border-zinc-200")}>
                {icons[item.type as keyof typeof icons] || <Activity size={18} />}
            </div>
            <div className="flex-1 min-w-0 flex flex-col justify-center">
                <p className="text-sm font-bold text-zinc-900 dark:text-zinc-200 leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1 font-serif tracking-tight">
                    {item.content}
                </p>
                <div className="flex items-center gap-2 mt-2">
                    <Clock size={10} className="text-zinc-400" />
                    <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest italic">
                        {formatDistanceToNow(item.timestamp)} ago
                    </span>
                </div>
            </div>
            <div className="flex items-center opacity-0 group-hover:opacity-100 transition-all">
                <div className="p-2 bg-zinc-50 dark:bg-zinc-800 rounded-full text-zinc-400 hover:text-zinc-900 dark:hover:text-white">
                    <ChevronRight size={16} />
                </div>
            </div>
        </motion.div>
    );
}
