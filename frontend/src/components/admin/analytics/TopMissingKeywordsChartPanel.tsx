"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";

type Point = {
  keyword: string;
  count: number;
};

export default function TopMissingKeywordsChartPanel({ data }: { data: Point[] }) {
  return (
    <Card className="border-slate-800 bg-slate-900 text-slate-100">
      <CardHeader>
        <CardTitle className="text-base font-bold text-white">Top Missing Keywords</CardTitle>
      </CardHeader>
      <CardContent className="h-[360px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ left: 24 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis type="number" stroke="#94a3b8" tick={{ fill: "#94a3b8", fontSize: 12 }} />
            <YAxis type="category" dataKey="keyword" stroke="#94a3b8" tick={{ fill: "#94a3b8", fontSize: 12 }} width={140} />
            <Tooltip
              contentStyle={{ background: "#0f172a", border: "1px solid #334155" }}
              labelStyle={{ color: "#cbd5e1" }}
            />
            <Bar dataKey="count" fill="#f59e0b" radius={[0, 6, 6, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
