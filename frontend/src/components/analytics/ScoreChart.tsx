"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { useMemo } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type ScorePoint = { date: string; score: number; resume: string };

export default function ScoreChart({ data }: { data: ScorePoint[] }) {
  const chartData = useMemo(() => data, [data]);

  return (
    <Card className="border-0 shadow-md">
      <CardHeader>
        <CardTitle className="text-base">Score Over Time</CardTitle>
        <CardDescription>ATS score across every resume upload</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{
                background: "var(--background)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                fontSize: 12,
              }}
              formatter={(value) => [`${String(value)} / 100`, "ATS Score"]}
              labelFormatter={(label, payload) => payload?.[0]?.payload?.resume ?? label}
            />
            <Line
              type="monotone"
              dataKey="score"
              stroke="#1e40af"
              strokeWidth={2.5}
              dot={{ r: 5, fill: "#1e40af", strokeWidth: 0 }}
              activeDot={{ r: 7 }}
            />
          </LineChart>
        </ResponsiveContainer>

        <div className="flex items-end gap-1 mt-4 pt-4 border-t border-border/50">
          {chartData.map((point, index) => (
            <div key={point.date} className="flex-1 flex flex-col items-center gap-1">
              <span className="text-[10px] text-muted-foreground">{point.score}</span>
              <div
                className="w-full rounded-t-sm bg-primary/20"
                style={{ height: `${(point.score / 100) * 40}px` }}
              >
                <div
                  className="w-full h-full rounded-t-sm bg-primary"
                  style={{ opacity: 0.3 + index * 0.12 }}
                />
              </div>
              <span className="text-[9px] text-muted-foreground truncate w-full text-center">
                {point.date}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}