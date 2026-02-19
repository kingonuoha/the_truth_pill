"use client";

import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

interface TrafficData {
    date: string;
    visits: number;
}

interface TrafficChartProps {
    data: TrafficData[];
    days: number;
    customTooltip: React.ReactElement;
}

export function TrafficChart({ data, days, customTooltip }: TrafficChartProps) {
    const { theme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setMounted(true), 0);
        return () => clearTimeout(timer);
    }, []);

    if (!mounted) return null;

    const isDark = theme === "dark";
    const gridColor = isDark ? "#1f2937" : "#f0f0f0";
    const tickColor = isDark ? "#4b5563" : "#a1a1aa";

    return (
        <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
                <defs>
                    <linearGradient id="gradient-primary" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor={isDark ? "#3b82f6" : "#2563eb"} />
                        <stop offset="100%" stopColor={isDark ? "#8b5cf6" : "#7c3aed"} />
                    </linearGradient>
                    <linearGradient id="colorVisits" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={isDark ? "#3b82f6" : "#2563eb"} stopOpacity={isDark ? 0.3 : 0.15} />
                        <stop offset="95%" stopColor={isDark ? "#8b5cf6" : "#7c3aed"} stopOpacity={0} />
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fontWeight: 700, fill: tickColor }}
                    dy={10}
                    tickFormatter={(str) => {
                        const date = new Date(str);
                        return days <= 7
                            ? date.toLocaleDateString(undefined, { weekday: 'short' })
                            : date.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
                    }}
                />
                <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fontWeight: 700, fill: tickColor }}
                    dx={-10}
                />
                <Tooltip content={customTooltip} cursor={{ stroke: isDark ? "#374151" : "#e5e7eb", strokeWidth: 2 }} />
                <Area
                    type="monotone"
                    dataKey="visits"
                    stroke="url(#gradient-primary)"
                    strokeWidth={4}
                    fillOpacity={1}
                    fill="url(#colorVisits)"
                    animationDuration={2000}
                    activeDot={{ r: 6, strokeWidth: 0, fill: isDark ? "#60a5fa" : "#2563eb" }}
                />
            </AreaChart>
        </ResponsiveContainer>
    );
}
