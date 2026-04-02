"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { useMemo } from "react";
import {
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

type RadarDatum = { subject: string; score: number };

export default function RadarScoreChart({ data }: { data: RadarDatum[] }) {
  const chartData = useMemo(() => data, [data]);

  return (
    <Card className="border-0 shadow-md">
      <CardHeader>
        <CardTitle className="text-base">Skill Radar</CardTitle>
        <CardDescription>Balance across all resume dimensions (latest)</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={260}>
          <RadarChart data={chartData}>
            <PolarGrid stroke="var(--border)" />
            <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
            <Radar
              name="Score"
              dataKey="score"
              stroke="#1e40af"
              fill="#1e40af"
              fillOpacity={0.2}
              strokeWidth={2}
            />
            <Tooltip
              contentStyle={{
                background: "var(--background)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                fontSize: 12,
              }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}