"use client";

import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

interface ReferrerData {
    name: string;
    value: number;
}

interface ReferrerChartProps {
    data: ReferrerData[];
}

export function ReferrerChart({ data }: ReferrerChartProps) {
    const { theme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setMounted(true), 0);
        return () => clearTimeout(timer);
    }, []);

    if (!mounted) return null;

    const isDark = theme === "dark";
    const gridColor = isDark ? "#1f2937" : "#f5f5f5";
    const tickColor = isDark ? "#4b5563" : "#71717a";

    return (
        <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ left: 20 }}>
                <defs>
                    <linearGradient id="gradient-primary" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor={isDark ? "#3b82f6" : "#2563eb"} />
                        <stop offset="100%" stopColor={isDark ? "#8b5cf6" : "#7c3aed"} />
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={gridColor} />
                <XAxis type="number" hide />
                <YAxis
                    dataKey="name"
                    type="category"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fontWeight: 800, fill: tickColor }}
                    width={100}
                />
                <Tooltip
                    cursor={{ fill: isDark ? 'rgba(255,255,255,0.05)' : '#fafafa' }}
                    content={({ active, payload }: { active?: boolean; payload?: readonly { value: number; name: string }[] }) => {
                        if (active && payload && payload.length) {
                            return (
                                <div className="bg-gray-950 dark:bg-black text-white px-3 py-1.5 rounded-xl text-[10px] font-bold shadow-xl border border-gray-800 transition-colors duration-500">
                                    {payload[0].value} Visits
                                </div>
                            );
                        }
                        return null;
                    }}
                />
                <Bar
                    dataKey="value"
                    fill="url(#gradient-primary)"
                    radius={[0, 8, 8, 0]}
                    barSize={20}
                    animationDuration={1500}
                />
            </BarChart>
        </ResponsiveContainer>
    );
}
