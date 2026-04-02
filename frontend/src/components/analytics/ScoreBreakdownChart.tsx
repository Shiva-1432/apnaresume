"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { useMemo } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

type BreakdownItem = { name: string; value: number; color: string };

export default function ScoreBreakdownChart({ data }: { data: BreakdownItem[] }) {
  const chartData = useMemo(() => data, [data]);

  return (
    <Card className="border-0 shadow-md">
      <CardHeader>
        <CardTitle className="text-base">Score Breakdown</CardTitle>
        <CardDescription>Latest resume category distribution</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={85}
              paddingAngle={3}
              dataKey="value"
            >
              {chartData.map((entry) => (
                <Cell key={entry.name} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                background: "var(--background)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                fontSize: 12,
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="grid grid-cols-2 gap-2 mt-2">
          {chartData.map((item) => (
            <div key={item.name} className="flex items-center gap-2 text-sm">
              <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: item.color }} />
              <span className="text-muted-foreground truncate">{item.name}</span>
              <span className="font-semibold ml-auto">{item.value}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}