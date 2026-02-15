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
                                <div className="bg-zinc-900 text-white px-3 py-1.5 rounded-xl text-[10px] font-bold">
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
