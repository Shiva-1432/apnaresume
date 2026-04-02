"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type UploadPoint = { month: string; uploads: number };

export default function UploadsByMonthChart({ data }: { data: UploadPoint[] }) {
  const chartData = useMemo(() => data, [data]);

  return (
    <Card className="border-0 shadow-md">
      <CardHeader>
        <CardTitle className="text-base">Uploads by Month</CardTitle>
        <CardDescription>How often you&apos;ve been iterating</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={chartData} barSize={36}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{
                background: "var(--background)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                fontSize: 12,
              }}
            />
            <Bar dataKey="uploads" name="Uploads" fill="#1e40af" radius={[6, 6, 0, 0]} opacity={0.8} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}