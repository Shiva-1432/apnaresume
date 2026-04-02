"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type CategoryScore = { category: string; best: number; avg: number };

export default function CategoryComparisonChart({ data }: { data: CategoryScore[] }) {
  const chartData = useMemo(() => data, [data]);

  return (
    <Card className="border-0 shadow-md">
      <CardHeader>
        <CardTitle className="text-base">Best vs. Average — by Category</CardTitle>
        <CardDescription>Your personal best compared to your own average</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartData} barGap={4} barSize={24}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="category" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{
                background: "var(--background)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                fontSize: 12,
              }}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="best" name="Personal best" fill="#059669" radius={[4, 4, 0, 0]} />
            <Bar dataKey="avg" name="Your average" fill="#1e40af" radius={[4, 4, 0, 0]} opacity={0.5} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}