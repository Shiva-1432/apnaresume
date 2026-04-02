"use client";

import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  TrendingUp,
  Clock,
  Trash2,
  RefreshCw,
  Eye,
  Filter,
  SortAsc,
  LayoutGrid,
  LayoutList,
  LogOut,
  Menu,
  X,
  ChevronUp,
  ChevronDown,
  Minus,
} from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";

/**
 * ApnaResume Resume History Page
 *
 * Design Philosophy:
 * - Full resume history with sort/filter controls
 * - Toggle between card view and table view
 * - Score trend indicators (up/down/same)
 * - Bulk actions and individual resume actions
 * - Sidebar navigation consistent with Home
 */

type SortField = "date" | "score" | "name";
type SortDir = "asc" | "desc";
type ViewMode = "card" | "table";

const mockResumes = [
  {
    id: 1,
    name: "Software Engineer Resume",
    uploadDate: "Apr 1, 2026",
    daysAgo: "Today",
    score: 85,
    prevScore: 72,
    status: "Analyzed",
    pages: 1,
    words: 487,
    keywords: 38,
  },
  {
    id: 2,
    name: "Product Manager Resume",
    uploadDate: "Mar 25, 2026",
    daysAgo: "1 week ago",
    score: 72,
    prevScore: 72,
    status: "Analyzed",
    pages: 1,
    words: 412,
    keywords: 29,
  },
  {
    id: 3,
    name: "Data Analyst Resume",
    uploadDate: "Mar 18, 2026",
    daysAgo: "2 weeks ago",
    score: 78,
    prevScore: 65,
    status: "Analyzed",
    pages: 2,
    words: 553,
    keywords: 34,
  },
  {
    id: 4,
    name: "Frontend Developer Resume",
    uploadDate: "Mar 10, 2026",
    daysAgo: "3 weeks ago",
    score: 63,
    prevScore: null,
    status: "Analyzed",
    pages: 1,
    words: 389,
    keywords: 22,
  },
  {
    id: 5,
    name: "Full Stack Resume v2",
    uploadDate: "Mar 2, 2026",
    daysAgo: "1 month ago",
    score: 55,
    prevScore: null,
    status: "Analyzed",
    pages: 1,
    words: 341,
    keywords: 18,
  },
  {
    id: 6,
    name: "Full Stack Resume v1",
    uploadDate: "Feb 20, 2026",
    daysAgo: "5 weeks ago",
    score: 48,
    prevScore: null,
    status: "Analyzed",
    pages: 1,
    words: 298,
    keywords: 14,
  },
];

const navItems = [
  { label: "Dashboard", icon: "📊", path: "/home" },
  { label: "My Resumes", icon: "📄", path: "/home" },
  { label: "History", icon: "⏱️", path: "/history", active: true },
  { label: "Analytics", icon: "📈", path: "/history" },
  { label: "Settings", icon: "⚙️", path: "/settings" },
];

function ScoreTrend({ score, prevScore }: { score: number; prevScore: number | null }) {
  if (prevScore === null) return <span className="text-muted-foreground text-xs">-</span>;
  const diff = score - prevScore;
  if (diff > 0)
    return (
      <span className="flex items-center gap-0.5 text-accent text-xs font-medium">
        <ChevronUp className="w-3 h-3" />+{diff}
      </span>
    );
  if (diff < 0)
    return (
      <span className="flex items-center gap-0.5 text-destructive text-xs font-medium">
        <ChevronDown className="w-3 h-3" />
        {diff}
      </span>
    );
  return (
    <span className="flex items-center gap-0.5 text-muted-foreground text-xs">
      <Minus className="w-3 h-3" />0
    </span>
  );
}

function ScoreBar({ score }: { score: number }) {
  const color =
    score >= 80
      ? "from-accent to-emerald-400"
      : score >= 65
        ? "from-primary to-blue-400"
        : score >= 50
          ? "from-amber-500 to-amber-300"
          : "from-destructive to-red-400";
  return (
    <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
      <div
        className={`h-full bg-gradient-to-r ${color} rounded-full transition-all duration-700`}
        style={{ width: `${score}%` }}
      />
    </div>
  );
}

export default function History() {
  const router = useRouter();
  const setLocation = (path: string) => router.push(path);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("card");
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [filterMin, setFilterMin] = useState(0);
  const [selected, setSelected] = useState<number[]>([]);
  const [deletedIds, setDeletedIds] = useState<number[]>([]);

  const visibleResumes = mockResumes
    .filter((r) => !deletedIds.includes(r.id) && r.score >= filterMin)
    .sort((a, b) => {
      let cmp = 0;
      if (sortField === "score") cmp = a.score - b.score;
      else if (sortField === "name") cmp = a.name.localeCompare(b.name);
      else cmp = a.id - b.id;
      return sortDir === "asc" ? cmp : -cmp;
    });

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortField(field);
      setSortDir("desc");
    }
  };

  const toggleSelect = (id: number) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const deleteSelected = () => {
    setDeletedIds((prev) => [...prev, ...selected]);
    setSelected([]);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 12 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
  };

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
                onClick={() => setLocation(item.path)}
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

          <div className="border-t border-border pt-6 space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase">Quick Stats</p>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total uploads</span>
                <span className="font-semibold text-foreground">{mockResumes.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Best score</span>
                <span className="font-semibold text-accent">89</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Avg score</span>
                <span className="font-semibold text-primary">67</span>
              </div>
            </div>
          </div>
        </motion.aside>

        <main className="flex-1 p-4 lg:p-8 overflow-y-auto">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="max-w-6xl space-y-6"
          >
            <motion.div variants={itemVariants} className="flex items-start justify-between flex-wrap gap-4">
              <div>
                <h2 className="text-3xl font-bold text-foreground">Resume History</h2>
                <p className="text-muted-foreground mt-1">
                  {visibleResumes.length} resume{visibleResumes.length !== 1 ? "s" : ""} analysed
                </p>
              </div>
              <Button
                className="bg-primary hover:bg-primary/90"
                onClick={() => setLocation("/upload")}
              >
                + Upload New Resume
              </Button>
            </motion.div>

            <motion.div
              variants={itemVariants}
              className="flex flex-wrap items-center gap-3 p-4 bg-card rounded-xl border border-border"
            >
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <SortAsc className="w-4 h-4" />
                <span>Sort:</span>
              </div>
              {(["date", "score", "name"] as SortField[]).map((f) => (
                <button
                  key={f}
                  onClick={() => toggleSort(f)}
                  className={`px-3 py-1.5 rounded-lg text-sm flex items-center gap-1 transition-all ${
                    sortField === f
                      ? "bg-primary/10 text-primary font-semibold"
                      : "hover:bg-muted text-muted-foreground"
                  }`}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                  {sortField === f &&
                    (sortDir === "desc" ? (
                      <ChevronDown className="w-3 h-3" />
                    ) : (
                      <ChevronUp className="w-3 h-3" />
                    ))}
                </button>
              ))}

              <div className="w-px h-5 bg-border mx-1" />

              <div className="flex items-center gap-2 text-sm">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">Min score:</span>
                <select
                  value={filterMin}
                  onChange={(e) => setFilterMin(Number(e.target.value))}
                  className="text-sm border border-border rounded-lg px-2 py-1 bg-background text-foreground"
                >
                  <option value={0}>All</option>
                  <option value={50}>50+</option>
                  <option value={65}>65+</option>
                  <option value={80}>80+</option>
                </select>
              </div>

              <div className="ml-auto flex items-center gap-2">
                {selected.length > 0 && (
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={deleteSelected}
                    className="text-xs"
                  >
                    <Trash2 className="w-3 h-3 mr-1" />
                    Delete {selected.length} selected
                  </Button>
                )}
                <div className="flex items-center border border-border rounded-lg overflow-hidden">
                  <button
                    onClick={() => setViewMode("card")}
                    className={`p-2 ${viewMode === "card" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"}`}
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode("table")}
                    className={`p-2 ${viewMode === "table" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"}`}
                  >
                    <LayoutList className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>

            <AnimatePresence mode="wait">
              {viewMode === "card" && (
                <motion.div
                  key="card-view"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                >
                  {visibleResumes.map((resume) => (
                    <motion.div
                      key={resume.id}
                      layout
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      whileHover={{ scale: 1.02 }}
                      transition={{ duration: 0.25 }}
                      onClick={() => toggleSelect(resume.id)}
                    >
                      <Card
                        className={`border shadow-sm hover:shadow-md transition-shadow cursor-pointer ${
                          selected.includes(resume.id)
                            ? "border-primary ring-1 ring-primary/30"
                            : "border-border"
                        }`}
                      >
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <CardTitle className="text-base truncate">{resume.name}</CardTitle>
                              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                <Clock className="w-3 h-3 flex-shrink-0" />
                                {resume.daysAgo} · {resume.uploadDate}
                              </p>
                            </div>
                            <Badge
                              variant="secondary"
                              className="text-xs flex-shrink-0 bg-accent/10 text-accent border-accent/20"
                            >
                              {resume.status}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">ATS Score</span>
                            <div className="flex items-center gap-2">
                              <ScoreTrend score={resume.score} prevScore={resume.prevScore} />
                              <span className="text-2xl font-bold text-primary">{resume.score}</span>
                            </div>
                          </div>
                          <ScoreBar score={resume.score} />

                          <div className="grid grid-cols-3 gap-2 text-center pt-1">
                            {[
                              { label: "Words", value: resume.words },
                              { label: "Keywords", value: resume.keywords },
                              { label: "Pages", value: resume.pages },
                            ].map((s) => (
                              <div key={s.label} className="bg-muted/50 rounded-lg py-1.5">
                                <p className="text-xs text-muted-foreground">{s.label}</p>
                                <p className="text-sm font-semibold text-foreground">{s.value}</p>
                              </div>
                            ))}
                          </div>

                          <div className="flex gap-2 pt-1" onClick={(e) => e.stopPropagation()}>
                            <Button
                              size="sm"
                              className="flex-1 text-xs bg-primary hover:bg-primary/90"
                              onClick={() => setLocation("/dashboard")}
                            >
                              <Eye className="w-3 h-3 mr-1" />
                              View
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1 text-xs"
                              onClick={() => setLocation("/upload")}
                            >
                              <RefreshCw className="w-3 h-3 mr-1" />
                              Re-analyse
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => setDeletedIds((p) => [...p, resume.id])}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </motion.div>
              )}

              {viewMode === "table" && (
                <motion.div
                  key="table-view"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card className="border-0 shadow-md overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border bg-muted/40">
                            <th className="px-4 py-3 text-left w-6">
                              <input
                                type="checkbox"
                                className="rounded"
                                checked={selected.length === visibleResumes.length && visibleResumes.length > 0}
                                onChange={() =>
                                  setSelected(
                                    selected.length === visibleResumes.length
                                      ? []
                                      : visibleResumes.map((r) => r.id)
                                  )
                                }
                              />
                            </th>
                            {[
                              { label: "Resume", field: "name" as SortField },
                              { label: "Date", field: "date" as SortField },
                              { label: "ATS Score", field: "score" as SortField },
                              { label: "Words", field: null },
                              { label: "Keywords", field: null },
                              { label: "Status", field: null },
                              { label: "Actions", field: null },
                            ].map((col) => (
                              <th
                                key={col.label}
                                className={`px-4 py-3 text-left font-semibold text-muted-foreground ${col.field ? "cursor-pointer hover:text-foreground select-none" : ""}`}
                                onClick={() => col.field && toggleSort(col.field)}
                              >
                                <span className="flex items-center gap-1">
                                  {col.label}
                                  {col.field && sortField === col.field &&
                                    (sortDir === "desc" ? (
                                      <ChevronDown className="w-3 h-3" />
                                    ) : (
                                      <ChevronUp className="w-3 h-3" />
                                    ))}
                                </span>
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          <AnimatePresence>
                            {visibleResumes.map((resume, i) => (
                              <motion.tr
                                key={resume.id}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ delay: i * 0.04 }}
                                className={`border-b border-border/50 hover:bg-muted/30 transition-colors ${selected.includes(resume.id) ? "bg-primary/5" : ""}`}
                              >
                                <td className="px-4 py-3">
                                  <input
                                    type="checkbox"
                                    className="rounded"
                                    checked={selected.includes(resume.id)}
                                    onChange={() => toggleSelect(resume.id)}
                                  />
                                </td>
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                                      <FileText className="w-4 h-4 text-primary" />
                                    </div>
                                    <span className="font-medium text-foreground truncate max-w-[180px]">
                                      {resume.name}
                                    </span>
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                                  {resume.daysAgo}
                                </td>
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-2 min-w-[100px]">
                                    <span className="font-bold text-primary">{resume.score}</span>
                                    <ScoreTrend score={resume.score} prevScore={resume.prevScore} />
                                    <div className="w-16">
                                      <ScoreBar score={resume.score} />
                                    </div>
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-muted-foreground">{resume.words}</td>
                                <td className="px-4 py-3 text-muted-foreground">{resume.keywords}</td>
                                <td className="px-4 py-3">
                                  <Badge
                                    variant="secondary"
                                    className="text-xs bg-accent/10 text-accent border-accent/20"
                                  >
                                    {resume.status}
                                  </Badge>
                                </td>
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-1">
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-7 px-2 text-xs text-primary hover:text-primary"
                                      onClick={() => setLocation("/dashboard")}
                                    >
                                      <Eye className="w-3 h-3" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-7 px-2 text-xs"
                                      onClick={() => setLocation("/upload")}
                                    >
                                      <RefreshCw className="w-3 h-3" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-7 px-2 text-xs text-destructive hover:text-destructive"
                                      onClick={() => setDeletedIds((p) => [...p, resume.id])}
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </Button>
                                  </div>
                                </td>
                              </motion.tr>
                            ))}
                          </AnimatePresence>
                        </tbody>
                      </table>

                      {visibleResumes.length === 0 && (
                        <div className="text-center py-16 text-muted-foreground">
                          <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
                          <p className="font-medium">No resumes match your filter</p>
                          <p className="text-sm mt-1">Try lowering the minimum score</p>
                        </div>
                      )}
                    </div>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.div variants={itemVariants}>
              <Card className="border-0 shadow-md bg-gradient-to-r from-primary/5 to-accent/5">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    Score Progress
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-6 flex-wrap">
                    <div className="text-center">
                      <p className="text-3xl font-bold text-destructive">48</p>
                      <p className="text-xs text-muted-foreground mt-1">First resume</p>
                    </div>
                    <div className="flex-1 flex items-center gap-1 min-w-[120px]">
                      {mockResumes
                        .slice()
                        .reverse()
                        .map((r, i) => (
                          <div
                            key={r.id}
                            className="flex-1 flex flex-col items-center gap-1"
                          >
                            <div
                              className="w-full bg-primary/20 rounded-sm"
                              style={{ height: `${Math.max(4, (r.score / 100) * 48)}px` }}
                            >
                              <div
                                className="w-full bg-primary rounded-sm"
                                style={{ height: "100%", opacity: 0.5 + i * 0.08 }}
                              />
                            </div>
                            <span className="text-[9px] text-muted-foreground">{r.score}</span>
                          </div>
                        ))}
                    </div>
                    <div className="text-center">
                      <p className="text-3xl font-bold text-accent">85</p>
                      <p className="text-xs text-muted-foreground mt-1">Latest resume</p>
                    </div>
                    <div className="text-center bg-accent/10 rounded-xl px-4 py-3">
                      <p className="text-2xl font-bold text-accent">+37</p>
                      <p className="text-xs text-muted-foreground mt-1">Total improvement</p>
                    </div>
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
