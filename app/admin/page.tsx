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
    MessageCircle
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

export default function AdminDashboard() {
    const { data: session } = useSession();
    const stats = useQuery(api.admin.getDashboardStats);
    const activity = useQuery(api.admin.getRecentActivity, { limit: 8 });
    const trafficStats = useQuery(api.analytics.getTrafficStats, { days: 7 });

    const isLoading = !stats || !activity || !trafficStats;

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="animate-pulse flex flex-col items-center gap-4">
                    <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
                    <p className="text-zinc-500 font-medium">Loading command center...</p>
                </div>
            </div>
        );
    }

    // Format traffic data for chart
    const chartData = trafficStats.chartData.map((d: { date: string; visits: number }) => ({
        name: new Date(d.date).toLocaleDateString(undefined, { weekday: 'short' }),
        views: d.visits
    }));

    return (
        <div className="space-y-8 pb-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-serif font-black text-zinc-900 tracking-tight">Overview</h1>
                    <p className="text-zinc-500 mt-1 font-medium">Welcome back, {session?.user?.name?.split(' ')[0] || 'Sandra'}. Here&apos;s what&apos;s happening today.</p>
                </div>
                <div className="flex items-center gap-3">
                    <Link
                        href="/admin/ai-drafts"
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-zinc-200 bg-white font-bold text-sm text-purple-600 hover:bg-purple-50 transition-all shadow-sm"
                    >
                        <Sparkles size={18} />
                        Process AI Drafts
                    </Link>
                    <Link
                        href="/admin/articles/new"
                        className="bg-primary text-white px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 hover:opacity-90 transition-all shadow-lg shadow-primary/20"
                    >
                        <Plus size={18} />
                        Create New Article
                    </Link>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    label="Active Articles"
                    value={stats.articles.published.toString()}
                    subValue={`${stats.articles.total} total inclusive of drafts`}
                    icon={FileText}
                    trend="+12%"
                    trendUp={true}
                    color="sky"
                />
                <StatCard
                    label="AI Drafts"
                    value={stats.articles.aiDrafts.toString()}
                    subValue="Pending your review"
                    icon={Sparkles}
                    color="purple"
                />
                <StatCard
                    label="Total Engagement"
                    value={(stats.totalViews / 1000).toFixed(1) + "k"}
                    subValue="Reads across all articles"
                    icon={Eye}
                    trend={`${trafficStats.isTrendUp ? '+' : ''}${trafficStats.trend}%`}
                    trendUp={trafficStats.isTrendUp}
                    color="blue"
                />
                <StatCard
                    label="Pending Reports"
                    value={stats.pendingCommentsCount.toString()}
                    subValue="Comments needing moderation"
                    icon={MessageSquare}
                    trend="-2%"
                    trendUp={false}
                    color="rose"
                />
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
                {/* Analytics Chart */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm transition-all hover:shadow-md">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h3 className="text-lg font-serif font-bold text-zinc-900">Reach & Visibility</h3>
                                <p className="text-sm text-zinc-500 font-medium">Daily article views over the last 7 days</p>
                            </div>
                            <Link
                                href="/admin/analytics"
                                className="bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 rounded-lg px-3 py-1.5 text-xs font-bold text-zinc-600 outline-none transition-colors"
                            >
                                Full Analytics
                            </Link>
                        </div>

                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData}>
                                    <defs>
                                        <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" />
                                    <XAxis
                                        dataKey="name"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 12, fill: '#71717a', fontWeight: 600 }}
                                        dy={10}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 12, fill: '#71717a', fontWeight: 600 }}
                                    />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                        cursor={{ stroke: '#0ea5e9', strokeWidth: 2 }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="views"
                                        stroke="#0ea5e9"
                                        strokeWidth={3}
                                        fillOpacity={1}
                                        fill="url(#colorViews)"
                                        animationDuration={1500}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Quick Stats Grid */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-zinc-900 text-white p-6 rounded-3xl group">
                            <p className="text-zinc-400 text-xs font-bold uppercase tracking-wider mb-1">New Readers</p>
                            <div className="flex items-end gap-3">
                                <p className="text-3xl font-black">{stats.usersCount}</p>
                                <span className="text-green-400 text-sm font-bold flex items-center mb-1 group-hover:translate-x-1 transition-transform">
                                    <ArrowUpRight size={16} />
                                    14%
                                </span>
                            </div>
                        </div>
                        <div className="bg-primary p-6 rounded-3xl text-white group">
                            <p className="text-white/70 text-xs font-bold uppercase tracking-wider mb-1">Conversion</p>
                            <div className="flex items-end gap-3">
                                <p className="text-3xl font-black">2.4%</p>
                                <span className="text-white/80 text-sm font-bold flex items-center mb-1 group-hover:translate-x-1 transition-transform">
                                    <ArrowUpRight size={16} />
                                    0.8%
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Recent Activity */}
                <div className="space-y-4">
                    <div className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm h-full transition-all hover:shadow-md">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-serif font-bold text-zinc-900">Recent Activity</h3>
                            <Link href="/admin/activity" className="text-xs font-bold text-primary hover:underline">View All</Link>
                        </div>

                        <div className="space-y-6">
                            {activity.map((item: { type: string; content: string; timestamp: number; id: string }) => (
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
    color: 'sky' | 'purple' | 'blue' | 'rose'
}) {
    const colorClasses = {
        sky: "bg-sky-50 text-sky-600",
        purple: "bg-purple-50 text-purple-600",
        blue: "bg-blue-50 text-blue-600",
        rose: "bg-rose-50 text-rose-600"
    };

    return (
        <div className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm hover:shadow-md transition-all group">
            <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-2xl ${colorClasses[color]} transition-colors`}>
                    <Icon size={24} />
                </div>
                {trend && (
                    <span className={`text-xs font-black flex items-center px-2 py-0.5 rounded-full ${trendUp ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                        {trendUp ? <ArrowUpRight size={12} className="mr-0.5" /> : <ArrowDownRight size={12} className="mr-0.5" />}
                        {trend}
                    </span>
                )}
            </div>
            <h3 className="text-3xl font-black text-zinc-900 group-hover:text-primary transition-colors">{value}</h3>
            <p className="text-zinc-500 font-bold text-xs uppercase tracking-wider mt-1">{label}</p>
            <p className="text-zinc-400 text-[10px] font-medium mt-2 italic">{subValue}</p>
        </div>
    );
}

function ActivityItem({ item }: { item: { type: string, content: string, timestamp: number, id: string } }) {
    const icons = {
        comment: <MessageCircle size={14} className="text-blue-600" />,
        signup: <UserPlus size={14} className="text-green-600" />,
        article: <FileText size={14} className="text-purple-600" />
    };

    const bgColors = {
        comment: "bg-blue-50",
        signup: "bg-green-50",
        article: "bg-purple-50"
    };

    return (
        <div className="flex gap-4 group">
            <div className={`w-8 h-8 rounded-full ${bgColors[item.type as keyof typeof bgColors]} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                {icons[item.type as keyof typeof icons]}
            </div>
            <div className="flex-1 border-b border-zinc-100 pb-4 group-last:border-0">
                <p className="text-sm font-bold text-zinc-900 group-hover:text-primary transition-all">
                    {item.content}
                </p>
                <div className="flex items-center gap-2 mt-1">
                    <Clock size={10} className="text-zinc-400" />
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-tight">
                        {formatDistanceToNow(item.timestamp)} ago
                    </span>
                </div>
            </div>
        </div>
    );
}
