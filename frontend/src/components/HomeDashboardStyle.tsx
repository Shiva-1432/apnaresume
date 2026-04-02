"use client";

import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Share2, Download, Upload, TrendingUp, Zap, AlertTriangle } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";

/**
 * ResumePro Dashboard
 *
 * Design Philosophy:
 * - Minimalist, data-driven interface
 * - ATS Score as the hero metric (center-left)
 * - Actionable suggestions below
 * - Resume stats in sidebar (right)
 * - Clear visual hierarchy with deep blue (#1e40af) accents
 */

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("overview");

  // Mock data - replace with real API data
  const atsScore = 78;
  const scoreBreakdown = [
    { name: "Keywords", value: 85, color: "#059669" },
    { name: "Formatting", value: 72, color: "#1e40af" },
    { name: "ATS Compatibility", value: 75, color: "#3b82f6" },
  ];

  const suggestions = [
    {
      id: 1,
      title: "Add More Industry Keywords",
      description: "Your resume is missing 12 key industry terms that appear in similar job postings.",
      impact: "High",
      icon: AlertTriangle,
    },
    {
      id: 2,
      title: "Improve Bullet Point Structure",
      description: "Use action verbs at the start of each bullet point to increase ATS compatibility.",
      impact: "Medium",
      icon: Zap,
    },
    {
      id: 3,
      title: "Fix Formatting Issues",
      description: "Remove tables and special characters that may confuse ATS systems.",
      impact: "High",
      icon: AlertCircle,
    },
    {
      id: 4,
      title: "Add Quantifiable Achievements",
      description: "Include metrics and numbers to make your accomplishments stand out.",
      impact: "Medium",
      icon: TrendingUp,
    },
  ];

  const resumeStats = [
    { label: "Total Words", value: "487" },
    { label: "Keywords Found", value: "34" },
    { label: "Sections", value: "5" },
    { label: "Pages", value: "1" },
  ];

  const scoreData = [
    { name: "Keywords", value: 85 },
    { name: "Formatting", value: 72 },
    { name: "ATS Compat.", value: 75 },
  ];

  const colors = ["#059669", "#1e40af", "#3b82f6"];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="container flex items-center justify-between h-16 px-4">
          <div className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black group-hover:rotate-12 transition-transform shadow-lg shadow-indigo-200">
              <span className="text-sm">A</span>
            </div>
            <h1 className="text-xl font-black tracking-tight text-neutral-900 group-hover:text-indigo-600 transition-colors font-syne">ApnaResume</h1>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm">Profile</Button>
            <Button variant="ghost" size="sm">Logout</Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container px-4 py-8 max-w-7xl">
        {/* Hero Section: ATS Score */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8"
        >
          {/* Score Card - Main Hero */}
          <div className="lg:col-span-2">
            <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-muted/20">
              <CardHeader>
                <CardTitle className="text-2xl">Your ATS Score</CardTitle>
                <CardDescription>Based on your latest resume analysis</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between gap-8">
                  {/* Circular Score Display */}
                  <div className="flex-shrink-0">
                    <div className="relative w-40 h-40">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                        {/* Background circle */}
                        <circle
                          cx="50"
                          cy="50"
                          r="45"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="8"
                          className="text-muted"
                        />
                        {/* Progress circle */}
                        <circle
                          cx="50"
                          cy="50"
                          r="45"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="8"
                          strokeDasharray={`${(atsScore / 100) * 282.7} 282.7`}
                          className="text-primary transition-all duration-1000"
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-4xl font-bold text-primary">{atsScore}</span>
                        <span className="text-sm text-muted-foreground">/100</span>
                      </div>
                    </div>
                  </div>

                  {/* Score Breakdown */}
                  <div className="flex-1 space-y-4">
                    {scoreBreakdown.map((item) => (
                      <div key={item.name}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-foreground">{item.name}</span>
                          <span className="text-sm font-bold text-primary">{item.value}</span>
                        </div>
                        <Progress value={item.value} className="h-2" />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 mt-8">
                  <Button className="flex-1 bg-primary hover:bg-primary/90">
                    <Download className="w-4 h-4 mr-2" />
                    Download Improved Resume
                  </Button>
                  <Button variant="outline" className="flex-1">
                    <Share2 className="w-4 h-4 mr-2" />
                    Share Score
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Stats Sidebar */}
          <div className="space-y-4">
            {resumeStats.map((stat) => (
              <Card key={stat.label} className="border-0 shadow-md">
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
                  <p className="text-3xl font-bold text-primary">{stat.value}</p>
                </CardContent>
              </Card>
            ))}
            <Button className="w-full bg-primary hover:bg-primary/90">
              <Upload className="w-4 h-4 mr-2" />
              Upload New Resume
            </Button>
          </div>
        </motion.div>

        {/* Tabs Section: Suggestions & Analytics */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-2 lg:w-auto">
            <TabsTrigger value="overview">Suggestions</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          {/* Suggestions Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {suggestions.map((suggestion) => {
                const Icon = suggestion.icon;
                const impactColor =
                  suggestion.impact === "High"
                    ? "bg-destructive/10 text-destructive"
                    : "bg-amber-100 text-amber-700";

                return (
                  <motion.div
                    key={suggestion.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: suggestion.id * 0.1 }}
                  >
                    <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
                      <CardContent className="pt-6">
                        <div className="flex gap-4">
                          <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${impactColor}`}>
                            <Icon className="w-5 h-5" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-foreground mb-1">{suggestion.title}</h3>
                            <p className="text-sm text-muted-foreground mb-3">{suggestion.description}</p>
                            <div className="flex items-center justify-between">
                              <Badge variant={suggestion.impact === "High" ? "destructive" : "secondary"}>
                                {suggestion.impact} Impact
                              </Badge>
                              <Button variant="ghost" size="sm" className="text-primary hover:text-primary/90">
                                Learn More →
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Score Breakdown</CardTitle>
                <CardDescription>Detailed analysis of your resume performance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Pie Chart */}
                  <div className="flex items-center justify-center">
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={scoreData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, value }) => `${name}: ${value}`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {colors.map((color, index) => (
                            <Cell key={`cell-${index}`} fill={color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Bar Chart */}
                  <div>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={scoreData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="value" fill="#1e40af" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-12 bg-gradient-to-r from-primary/10 to-accent/10 rounded-lg border border-primary/20 p-8 text-center"
        >
          <h2 className="text-2xl font-bold text-foreground mb-2">Ready to Improve Your Resume?</h2>
          <p className="text-muted-foreground mb-6">
            Use our AI-powered rewriting tool to enhance your bullet points and boost your ATS score.
          </p>
          <Button className="bg-primary hover:bg-primary/90">
            Start Rewriting Now
          </Button>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card mt-16">
        <div className="container px-4 py-8 text-center text-sm text-muted-foreground">
          <p>&copy; 2026 ResumePro. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
