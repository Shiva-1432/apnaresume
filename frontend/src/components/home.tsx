"use client";

import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/badge";
import { useUser } from "@clerk/nextjs";
import { Upload, FileText, TrendingUp, Clock, LogOut, Menu, X } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

/**
 * ApnaResume Home Dashboard
 *
 * Design Philosophy:
 * - Central hub for resume management
 * - Prominent upload zone for quick access
 * - Recent resumes at a glance
 * - Quick statistics and insights
 * - Sidebar navigation for easy access
 */

export default function Home() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const router = useRouter();
  const { isLoaded, user } = useUser();

  // Mock data
  const recentResumes = [
    {
      id: 1,
      name: "Software Engineer Resume",
      uploadDate: "2 days ago",
      score: 85,
      status: "Analyzed",
    },
    {
      id: 2,
      name: "Product Manager Resume",
      uploadDate: "1 week ago",
      score: 72,
      status: "Analyzed",
    },
    {
      id: 3,
      name: "Data Analyst Resume",
      uploadDate: "2 weeks ago",
      score: 78,
      status: "Analyzed",
    },
  ];

  const stats = [
    { label: "Total Analyses", value: "12", icon: FileText },
    { label: "Best Score", value: "89", icon: TrendingUp },
    { label: "Average Score", value: "79", icon: TrendingUp },
  ];

  const navItems = [
    { label: "Dashboard", icon: "📊", active: true },
    { label: "My Resumes", icon: "📄" },
    { label: "History", icon: "⏱️" },
    { label: "Analytics", icon: "📈" },
    { label: "Settings", icon: "⚙️" },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 },
    },
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="flex items-center justify-between h-16 px-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 hover:bg-muted rounded-lg"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <div className="flex items-center gap-3 group">
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black group-hover:rotate-12 transition-transform shadow-lg shadow-indigo-200">
                <span className="text-sm">A</span>
              </div>
              <h1 className="text-xl font-black tracking-tight text-neutral-900 group-hover:text-indigo-600 transition-colors font-syne">ApnaResume</h1>
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
        {/* Sidebar */}
        <motion.aside
          initial={{ x: -250 }}
          animate={{ x: sidebarOpen ? 0 : -250 }}
          transition={{ duration: 0.3 }}
          className="fixed lg:static w-64 h-[calc(100vh-64px)] bg-card border-r border-border p-6 space-y-8 overflow-y-auto lg:translate-x-0 z-40"
        >
          {/* Navigation */}
          <nav className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase mb-4">Menu</p>
            {navItems.map((item) => (
              <button
                key={item.label}
                onClick={() => router.push(`/${item.label.toLowerCase().replace(" ", "-")}`)}
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

          {/* User Profile Card */}
          <div className="border-t border-border pt-6">
            <Card className="border-0 bg-primary/5">
              <CardContent className="pt-4">
                <div className="mb-4 space-y-1">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                    Account
                  </p>
                  <p className="text-lg font-black text-foreground leading-tight">
                    Welcome back, {isLoaded ? (user?.fullName || user?.firstName || "User") : "User"}! 👋
                  </p>
                </div>
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden mb-4">
                  <div className="h-full w-1/2 bg-accent rounded-full" />
                </div>
                <Button size="sm" variant="outline" className="w-full text-xs">
                  Buy More Credits
                </Button>
              </CardContent>
            </Card>
          </div>
        </motion.aside>

        {/* Main Content */}
        <main className="flex-1 p-4 lg:p-8 overflow-y-auto">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="max-w-6xl space-y-8"
          >
            {/* Quick Upload Zone */}
            <motion.div variants={itemVariants}>
              <Card className="border-2 border-dashed border-primary/30 bg-gradient-to-br from-primary/5 to-accent/5">
                <CardContent className="pt-12 pb-12">
                  <div className="text-center space-y-4 flex flex-col items-center">
                    <div className="flex justify-center mb-4">
                      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                        <Upload className="w-8 h-8 text-primary" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-foreground mb-2">Upload Your Resume</h3>
                      <p className="text-muted-foreground mb-6">Drag and drop your PDF or image file here</p>
                    </div>
                    <Button
                      size="lg"
                      className="inline-flex mx-auto bg-primary hover:bg-primary/90"
                      onClick={() => router.push("/upload")}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Choose File
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Statistics */}
            <motion.div variants={itemVariants}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {stats.map((stat) => {
                  const Icon = stat.icon;
                  return (
                    <Card key={stat.label} className="border-0 shadow-md">
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
                            <p className="text-3xl font-bold text-primary">{stat.value}</p>
                          </div>
                          <Icon className="w-8 h-8 text-accent opacity-50" />
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </motion.div>

            {/* Recent Resumes */}
            <motion.div variants={itemVariants}>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-bold text-foreground">Recent Resumes</h3>
                  <Button variant="outline" size="sm" onClick={() => router.push("/history")}>
                    View All
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {recentResumes.map((resume) => (
                    <motion.div
                      key={resume.id}
                      whileHover={{ scale: 1.02 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Card className="border-0 shadow-md hover:shadow-lg transition-shadow cursor-pointer">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <CardTitle className="text-lg">{resume.name}</CardTitle>
                              <CardDescription className="flex items-center gap-1 mt-1">
                                <Clock className="w-3 h-3" />
                                {resume.uploadDate}
                              </CardDescription>
                            </div>
                            <Badge variant="secondary" className="ml-2">
                              {resume.status}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            {/* Score Display */}
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-muted-foreground">ATS Score</span>
                              <span className="text-2xl font-bold text-primary">{resume.score}</span>
                            </div>
                            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-primary to-accent rounded-full"
                                style={{ width: `${resume.score}%` }}
                              />
                            </div>
                            {/* Action Buttons */}
                            <div className="flex gap-2 pt-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="flex-1 text-xs"
                                onClick={() => router.push("/dashboard")}
                              >
                                View
                              </Button>
                              <Button size="sm" variant="outline" className="flex-1 text-xs">
                                Reanalyze
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* CTA Section */}
            <motion.div variants={itemVariants}>
              <Card className="bg-gradient-to-r from-primary/10 to-accent/10 border-0">
                <CardContent className="pt-8">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-foreground mb-2">Upgrade to Premium</h3>
                      <p className="text-muted-foreground">Get unlimited analyses and AI rewriting</p>
                    </div>
                    <Button className="bg-primary hover:bg-primary/90">Upgrade Now</Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </main>
      </div>
    </div>
  );
}
