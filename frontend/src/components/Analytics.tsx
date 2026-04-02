"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/badge";
import { LogOut, Menu, X, TrendingUp, Award, Target, BarChart2 } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";

/**
 * ApnaResume — Analytics Page
 * Score progress over time, category breakdowns,
 * upload frequency, and improvement summary.
 */

const navItems = [
  { label: "Dashboard", icon: "📊", path: "/home" },
  { label: "My Resumes", icon: "📄", path: "/my-resumes" },
  { label: "History", icon: "⏱️", path: "/history" },
  { label: "Analytics", icon: "📈", path: "/analytics", active: true },
  { label: "Settings", icon: "⚙️", path: "/settings" },
];

const scoreHistory = [
  { date: "Feb 20", score: 48, resume: "Full Stack v1" },
  { date: "Mar 2", score: 55, resume: "Full Stack v2" },
  { date: "Mar 10", score: 63, resume: "Frontend Dev" },
  { date: "Mar 18", score: 78, resume: "Data Analyst" },
  { date: "Mar 25", score: 72, resume: "Product Manager" },
  { date: "Apr 1", score: 85, resume: "Software Engineer" },
];

const categoryScores = [
  { category: "Keywords", best: 85, avg: 71 },
  { category: "Formatting", best: 80, avg: 68 },
  { category: "ATS Compat.", best: 75, avg: 64 },
  { category: "Structure", best: 82, avg: 70 },
];

const radarData = [
  { subject: "Keywords", score: 85 },
  { subject: "Formatting", score: 72 },
  { subject: "ATS Compat.", score: 75 },
  { subject: "Structure", score: 80 },
  { subject: "Summary", score: 60 },
  { subject: "Skills", score: 65 },
];

const pieData = [
  { name: "Keywords", value: 85, color: "#059669" },
  { name: "Formatting", value: 72, color: "#1e40af" },
  { name: "ATS Compat.", value: 75, color: "#3b82f6" },
  { name: "Structure", value: 80, color: "#7c3aed" },
];

const uploadsByMonth = [
  { month: "Jan", uploads: 0 },
  { month: "Feb", uploads: 1 },
  { month: "Mar", uploads: 4 },
  { month: "Apr", uploads: 1 },
];

const improvements = [
  { label: "Overall score", from: 48, to: 85, unit: "pts" },
  { label: "Keywords found", from: 14, to: 38, unit: "" },
  { label: "Action verbs", from: 3, to: 9, unit: "" },
  { label: "ATS compatibility", from: 52, to: 75, unit: "%" },
];

const statCards = [
  { label: "Total Analyses", value: "6", icon: BarChart2, color: "text-primary" },
  { label: "Best Score", value: "85", icon: Award, color: "text-accent" },
  { label: "Average Score", value: "67", icon: Target, color: "text-amber-600" },
  { label: "Total Improvement", value: "+37", icon: TrendingUp, color: "text-accent" },
];

const itemVariants = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

const SkeletonCard = () => (
  <Card className="border-0 shadow-md">
    <CardContent className="flex min-h-[280px] items-center justify-center">
      <div className="h-4 w-32 animate-pulse rounded-full bg-muted" />
    </CardContent>
  </Card>
);

const ScoreChart = dynamic(() => import("./analytics/ScoreChart"), {
  ssr: false,
  loading: () => <SkeletonCard />,
});

const RadarScoreChart = dynamic(() => import("./analytics/RadarScoreChart"), {
  ssr: false,
  loading: () => <SkeletonCard />,
});

const ScoreBreakdownChart = dynamic(() => import("./analytics/ScoreBreakdownChart"), {
  ssr: false,
  loading: () => <SkeletonCard />,
});

const CategoryComparisonChart = dynamic(() => import("./analytics/CategoryComparisonChart"), {
  ssr: false,
  loading: () => <SkeletonCard />,
});

const UploadsByMonthChart = dynamic(() => import("./analytics/UploadsByMonthChart"), {
  ssr: false,
  loading: () => <SkeletonCard />,
});

export default function Analytics() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="flex items-center justify-between h-16 px-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 hover:bg-muted rounded-lg"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">A</span>
              </div>
              <h1 className="text-xl font-bold text-foreground">ApnaResume</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm">Profile</Button>
            <Button variant="ghost" size="sm">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="flex">
        <motion.aside
          initial={{ x: -250 }}
          animate={{ x: sidebarOpen ? 0 : -250 }}
          transition={{ duration: 0.3 }}
          className="fixed lg:static w-64 h-[calc(100vh-64px)] bg-card border-r border-border p-6 space-y-8 overflow-y-auto lg:translate-x-0 z-40"
        >
          <nav className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase mb-4">Menu</p>
            {navItems.map((item) => (
              <button
                key={item.label}
                onClick={() => router.push(item.path)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  item.active
                    ? "bg-primary/10 text-primary font-semibold"
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </nav>

          <div className="border-t border-border pt-6 space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase">Summary</p>
            {[
              { label: "Best score", value: "85", color: "text-accent" },
              { label: "Avg score", value: "67", color: "text-primary" },
              { label: "Uploads", value: "6", color: "text-foreground" },
              { label: "Improvement", value: "+37", color: "text-accent" },
            ].map((s) => (
              <div key={s.label} className="flex justify-between text-sm">
                <span className="text-muted-foreground">{s.label}</span>
                <span className={`font-bold ${s.color}`}>{s.value}</span>
              </div>
            ))}
          </div>
        </motion.aside>

        <main className="flex-1 p-4 lg:p-8 overflow-y-auto">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
            className="max-w-6xl space-y-6"
          >
            <motion.div variants={itemVariants}>
              <h2 className="text-3xl font-bold text-foreground">Analytics</h2>
              <p className="text-muted-foreground mt-1">Your resume performance over time</p>
            </motion.div>

            <motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {statCards.map((s) => {
                const Icon = s.icon;
                return (
                  <Card key={s.label} className="border-0 shadow-md">
                    <CardContent className="pt-5 pb-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">{s.label}</p>
                          <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
                        </div>
                        <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center">
                          <Icon className={`w-5 h-5 ${s.color}`} />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </motion.div>

            <motion.div variants={itemVariants}>
              <ScoreChart data={scoreHistory} />
            </motion.div>

            <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <RadarScoreChart data={radarData} />
              <ScoreBreakdownChart data={pieData} />
            </motion.div>

            <motion.div variants={itemVariants}>
              <CategoryComparisonChart data={categoryScores} />
            </motion.div>

            <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <UploadsByMonthChart data={uploadsByMonth} />

              <Card className="border-0 shadow-md">
                <CardHeader>
                  <CardTitle className="text-base">Your Improvement</CardTitle>
                  <CardDescription>First upload vs. latest upload</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {improvements.map((item) => {
                    const pct = Math.round(((item.to - item.from) / item.from) * 100);
                    return (
                      <div key={item.label}>
                        <div className="flex items-center justify-between mb-1.5 text-sm">
                          <span className="text-foreground">{item.label}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">{item.from}{item.unit}</span>
                            <span className="text-muted-foreground">→</span>
                            <span className="font-bold text-foreground">{item.to}{item.unit}</span>
                            <Badge
                              variant="secondary"
                              className="text-xs bg-accent/10 text-accent border-accent/20"
                            >
                              +{pct}%
                            </Badge>
                          </div>
                        </div>
                        <div className="relative w-full h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="absolute h-full bg-muted-foreground/30 rounded-full"
                            style={{ width: `${item.from}%` }}
                          />
                          <motion.div
                            className="absolute h-full bg-accent rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${item.to}%` }}
                            transition={{ duration: 0.8, delay: 0.2 }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </main>
      </div>
    </div>
  );
}
