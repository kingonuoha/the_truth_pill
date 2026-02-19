"use client";

import { ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

interface DeviceData {
    name: string;
    value: number;
}

interface DeviceChartProps {
    data: DeviceData[];
    colors: string[];
}

export function DeviceChart({ data, colors }: DeviceChartProps) {
    return (
        <ResponsiveContainer width="100%" height="100%">
            <PieChart>
                <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={8}
                    dataKey="value"
                    animationDuration={1500}
                    cornerRadius={10}
                >
                    {data.map((entry: DeviceData, index: number) => (
                        <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                    ))}
                </Pie>
            </PieChart>
        </ResponsiveContainer>
    );
}
