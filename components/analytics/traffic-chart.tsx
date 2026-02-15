"use client";

import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";

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
    return (
        <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
                <defs>
                    <linearGradient id="colorVisits" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fontWeight: 700, fill: "#a1a1aa" }}
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
                    tick={{ fontSize: 10, fontWeight: 700, fill: "#a1a1aa" }}
                    dx={-10}
                />
                <Tooltip content={customTooltip} />
                <Area
                    type="monotone"
                    dataKey="visits"
                    stroke="url(#gradient-primary)"
                    strokeWidth={4}
                    fillOpacity={1}
                    fill="url(#colorVisits)"
                    animationDuration={2000}
                    activeDot={{ r: 6, strokeWidth: 0, fill: "#0ea5e9" }}
                />
            </AreaChart>
        </ResponsiveContainer>
    );
}
