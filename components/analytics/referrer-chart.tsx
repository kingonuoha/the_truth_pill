"use client";

import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";

interface ReferrerData {
    name: string;
    value: number;
}

interface ReferrerChartProps {
    data: ReferrerData[];
}

export function ReferrerChart({ data }: ReferrerChartProps) {
    return (
        <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ left: 20 }}>
                <defs>
                    <linearGradient id="gradient-primary" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#2563eb" />
                        <stop offset="100%" stopColor="#7c3aed" />
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f5f5f5" />
                <XAxis type="number" hide />
                <YAxis
                    dataKey="name"
                    type="category"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fontWeight: 800, fill: '#71717a' }}
                    width={100}
                />
                <Tooltip
                    cursor={{ fill: '#fafafa' }}
                    content={({ active, payload }: { active?: boolean; payload?: readonly { value: number; name: string }[] }) => {
                        if (active && payload && payload.length) {
                            return (
                                <div className="bg-gray-950 text-white px-3 py-1.5 rounded-xl text-[10px] font-bold shadow-xl">
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
