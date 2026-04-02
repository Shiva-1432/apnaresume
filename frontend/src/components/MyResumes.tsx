"use client";

import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Upload,
  Eye,
  RefreshCw,
  Trash2,
  Download,
  LogOut,
  Menu,
  X,
  Clock,
  Star,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { usePathname, useRouter } from "next/navigation";
import axios from "axios";
import { useAuth } from "@clerk/nextjs";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import DeletedResumeUndoPanel from "@/components/resume/DeletedResumeUndoPanel";
import { API_BASE_URL } from "@/lib/apiBaseUrl";
import { resumeQueryKeys, useToggleStar } from "@/hooks/useResumes";
import { useUndo } from "@/hooks/useUndo";
import {
  getScoreBg,
  getScoreBarColor,
  getScoreColor,
  getScoreLabel,
  getScoreTier,
} from "@/lib/constants/scores";

const navItems = [
  { label: "Dashboard", icon: "📊", path: "/home" },
  { label: "My Resumes", icon: "📄", path: "/my-resumes" },
  { label: "History", icon: "⏱️", path: "/history" },
  { label: "Trash", icon: "🗑️", path: "/resumes/trash" },
  { label: "Analytics", icon: "📈", path: "/analytics" },
  { label: "Settings", icon: "⚙️", path: "/settings" },
];

type ApiResume = {
  _id?: string;
  id?: string;
  file_name?: string;
  version_name?: string;
  target_role?: string;
  created_at?: string;
  updated_at?: string;
  is_version?: boolean;
  applications_count?: number;
  shortlist_count?: number;
  score?: number;
  ats_score?: number;
  format?: string;
  pages?: number;
  starred?: boolean;
  is_deleted?: boolean;
};

type ResumeItem = {
  id: string;
  apiId: string;
  name: string;
  updatedAt: string;
  score: number;
  status: string;
  pages: number;
  format: string;
  starred: boolean;
  targetRole?: string;
  isVersion?: boolean;
};

type UserResumesResponse = {
  success?: boolean;
  resumes?: ApiResume[];
  total?: number;
  totalItems?: number;
  pagination?: {
    total?: number;
    totalItems?: number;
    page?: number;
    limit?: number;
    pageSize?: number;
    totalPages?: number;
  };
};

const DEFAULT_PAGE = 1;
const LIMIT = 12;

function formatDate(value?: string) {
  if (!value) {
    return "Recently";
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleDateString();
}

function mapResume(raw: ApiResume): ResumeItem {
  const apiId = String(raw._id || raw.id || "");
  const displayName = raw.version_name || raw.file_name || raw.target_role || "Resume";

  return {
    id: apiId,
    apiId,
    name: displayName,
    updatedAt: formatDate(raw.updated_at || raw.created_at),
    score: Number(raw.ats_score ?? raw.score ?? 0),
    status: raw.is_deleted ? "Deleted" : "Analysed",
    pages: Number(raw.pages ?? 1),
    format: String(raw.format || (raw.file_name?.toLowerCase().endsWith(".png") ? "PNG" : "PDF")),
    starred: Boolean(raw.starred),
    targetRole: raw.target_role,
    isVersion: Boolean(raw.is_version),
  };
}

function mergeResumes(existing: ResumeItem[], incoming: ResumeItem[]) {
  const seen = new Set(existing.map((resume) => resume.apiId));
  const next = [...existing];

  for (const resume of incoming) {
    if (seen.has(resume.apiId)) {
      continue;
    }

    next.push(resume);
    seen.add(resume.apiId);
  }

  return next;
}

export default function MyResumes() {
  const router = useRouter();
  const pathname = usePathname();
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const shouldReduceMotion = useReducedMotion();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [page, setPage] = useState(DEFAULT_PAGE);
  const [resumes, setResumes] = useState<ResumeItem[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [listError, setListError] = useState('');
  const [sortField] = useState('created_at');
  const [sortDir] = useState('desc');
  const [filterValue] = useState('all');

  const { queue, enqueueDelete, undoDelete, retryRestore } = useUndo<ResumeItem>();
  const toggleStarMutation = useToggleStar<ResumeItem>({
    onOptimisticUpdate: (nextResumes) => {
      setResumes(nextResumes);
    },
    onRollback: (previousResumes) => {
      setResumes(previousResumes);
    },
  });

  const syncResumesCache = useCallback(
    (nextResumes: ResumeItem[]) => {
      queryClient.setQueryData(resumeQueryKeys.myResumes(), nextResumes);
    },
    [queryClient]
  );

  const fetchResumes = useCallback(async (pageToLoad: number) => {
    const token = await getToken();
    if (!token) {
      throw new Error('Authentication required');
    }

    const params = new URLSearchParams({
      page: String(pageToLoad),
      limit: String(LIMIT),
      sortBy: sortField,
      sortDir,
      filter: filterValue,
    });

    const response = await axios.get<UserResumesResponse>(
      `${API_BASE_URL}/analysis/user-resumes?${params.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const mappedResumes = (response.data.resumes || []).map(mapResume);
    const total =
      response.data.pagination?.total ??
      response.data.pagination?.totalItems ??
      response.data.total ??
      response.data.totalItems;

    setResumes((current) => {
      const nextResumes =
        pageToLoad === DEFAULT_PAGE ? mappedResumes : mergeResumes(current, mappedResumes);

      syncResumesCache(nextResumes);
      return nextResumes;
    });

    const reachedLastPage =
      typeof total === 'number'
        ? total <= pageToLoad * LIMIT
        : mappedResumes.length < LIMIT;

    setHasMore(!reachedLastPage);
  }, [filterValue, getToken, sortDir, sortField, syncResumesCache]);

  useEffect(() => {
    let isMounted = true;

    const loadPage = async () => {
      try {
        setListError('');
        if (page === DEFAULT_PAGE) {
          setIsInitialLoading(true);
        } else {
          setIsLoadingMore(true);
        }

        await fetchResumes(page);
      } catch (error) {
        console.error('Error loading resumes:', error);
        if (isMounted) {
          setListError('Could not load resumes.');
        }
      } finally {
        if (isMounted) {
          setIsInitialLoading(false);
          setIsLoadingMore(false);
        }
      }
    };

    loadPage();

    return () => {
      isMounted = false;
    };
  }, [fetchResumes, page]);

  const confirmDeleteApi = async (id: string) => {
    const token = await getToken();
    if (!token) {
      throw new Error("Authentication required");
    }

    await axios.delete(`${API_BASE_URL}/analysis/resume/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  };

  const restoreDeleteApi = async (id: string) => {
    const token = await getToken();
    if (!token) {
      throw new Error("Authentication required");
    }

    await axios.post(`${API_BASE_URL}/analysis/resume/${id}/restore`, null, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  };

  const restoreLocally = (entry: { item: ResumeItem; index: number }) => {
    setResumes((prev) => {
      const exists = prev.some((resume) => resume.id === entry.item.id);
      if (exists) {
        return prev;
      }

      const next = [...prev];
      const insertIndex = Math.max(0, Math.min(entry.index, next.length));
      next.splice(insertIndex, 0, entry.item);
      syncResumesCache(next);
      return next;
    });
  };

  const deleteResume = (id: string) => {
    const currentIndex = resumes.findIndex((resume) => resume.id === id);
    if (currentIndex === -1) return;

    const resumeToDelete = resumes[currentIndex];
    setResumes((prev) => {
      const next = prev.filter((r) => r.id !== id);
      syncResumesCache(next);
      return next;
    });

    const queueKey = enqueueDelete({
      id: String(id),
      name: resumeToDelete.name,
      item: resumeToDelete,
      index: currentIndex,
      onConfirmDelete: confirmDeleteApi,
      onRestore: restoreDeleteApi,
      onRestoreLocal: restoreLocally,
    });

    toast("Resume deleted", {
      description: "You can undo this for 8 seconds.",
      action: {
        label: "Undo",
        onClick: () => {
          undoDelete(queueKey).catch(() => {
            // Error feedback is handled inside useUndo.
          });
        },
      },
    });
  };

  const getResumeScoreTextClass = (score: number) => getScoreColor(getScoreTier(score));
  const getResumeScoreBarClass = (score: number) => getScoreBarColor(getScoreTier(score));
  const getResumeScoreBgClass = (score: number) => getScoreBg(getScoreTier(score));
  const MotionDiv = shouldReduceMotion ? "div" : motion.div;
  const MotionAside = shouldReduceMotion ? "aside" : motion.aside;

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
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                toast.success("Logged out");
              }}
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="flex">
        <MotionAside
          role="navigation"
          aria-label="Main navigation"
          initial={shouldReduceMotion ? false : { x: -250 }}
          animate={shouldReduceMotion ? false : { x: sidebarOpen ? 0 : -250 }}
          transition={shouldReduceMotion ? undefined : { duration: 0.3 }}
          className="fixed lg:static w-64 h-[calc(100vh-64px)] bg-card border-r border-border p-6 space-y-8 overflow-y-auto lg:translate-x-0 z-40"
        >
          <nav className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase mb-4">Menu</p>
            {navItems.map((item) => (
              <button
                key={item.label}
                onClick={() => router.push(item.path)}
                aria-label={item.label}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  item.path === pathname
                    ? "bg-primary/10 text-primary font-semibold"
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </nav>

          <div className="border-t border-border pt-6">
            <Card className="border-0 bg-primary/5">
              <CardContent className="pt-4">
                <p className="text-sm font-semibold text-foreground mb-1">Pro Member</p>
                <p className="text-xs text-muted-foreground mb-3">100 credits remaining</p>
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden mb-3">
                  <div className="h-full w-1/2 bg-accent rounded-full" />
                </div>
                <Button size="sm" variant="outline" className="w-full text-xs">
                  Buy More Credits
                </Button>
              </CardContent>
            </Card>
          </div>
        </MotionAside>

        <main className="flex-1 p-4 lg:p-8 overflow-y-auto">
          <MotionDiv
            initial={shouldReduceMotion ? false : { opacity: 0 }}
            animate={shouldReduceMotion ? false : { opacity: 1 }}
            transition={shouldReduceMotion ? undefined : { staggerChildren: 0.08 }}
            className="max-w-5xl space-y-6"
          >
            {queue.length > 0 && (
              <DeletedResumeUndoPanel
                entries={queue}
                onUndo={(queueKey) => {
                  undoDelete(queueKey).catch(() => {
                    // Error feedback is handled inside useUndo.
                  });
                }}
                onRetry={(queueKey) => {
                  retryRestore(queueKey).catch(() => {
                    // Error feedback is handled inside useUndo.
                  });
                }}
              />
            )}

            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h2 className="text-3xl font-bold text-foreground">My Resumes</h2>
                <p className="text-muted-foreground mt-1">
                  {resumes.length} resume{resumes.length !== 1 ? "s" : ""} saved
                </p>
              </div>
              <Button
                className="bg-primary hover:bg-primary/90"
                onClick={() => router.push("/upload")}
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload New Resume
              </Button>
            </div>

            {listError && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                {listError}
              </div>
            )}

            {isInitialLoading ? (
              <div className="rounded-xl border border-dashed border-border bg-card px-6 py-16 text-center text-sm text-muted-foreground">
                Loading resumes...
              </div>
            ) : resumes.length === 0 ? (
              <MotionDiv
                initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
                animate={shouldReduceMotion ? false : { opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center py-24 text-center"
              >
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                  <FileText className="w-8 h-8 text-muted-foreground opacity-50" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">No resumes yet</h3>
                <p className="text-muted-foreground text-sm mb-6">
                  Upload your first resume to get an instant ATS score
                </p>
                <Button
                  className="bg-primary hover:bg-primary/90"
                  onClick={() => router.push("/upload")}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Resume
                </Button>
              </MotionDiv>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  <AnimatePresence>
                    {resumes.map((resume, i) => (
                      <MotionDiv
                        key={`${resume.id}-${resume.updatedAt}`}
                        layout
                        initial={shouldReduceMotion ? false : { opacity: 0, y: 14 }}
                        animate={shouldReduceMotion ? false : { opacity: 1, y: 0 }}
                        exit={shouldReduceMotion ? undefined : { opacity: 0, scale: 0.95 }}
                        transition={shouldReduceMotion ? undefined : { duration: 0.25, delay: i * 0.06 }}
                        whileHover={shouldReduceMotion ? undefined : { y: -2 }}
                      >
                        <Card className="border border-border shadow-sm hover:shadow-md transition-all h-full flex flex-col">
                          <CardHeader className="pb-3">
                            <div className="w-full h-28 rounded-lg bg-gradient-to-br from-primary/5 to-accent/5 border border-border/50 flex items-center justify-center mb-3 relative">
                              <FileText className="w-10 h-10 text-primary/30" />
                              <Badge
                                variant="secondary"
                                className="absolute top-2 right-2 text-xs"
                              >
                                {resume.format}
                              </Badge>
                              <button
                                type="button"
                                aria-label={resume.starred ? "Unstar resume" : "Star resume"}
                                aria-pressed={resume.starred}
                                disabled={
                                  toggleStarMutation.isPending &&
                                  toggleStarMutation.variables?.resumeId === resume.id
                                }
                                onClick={() =>
                                  toggleStarMutation.mutate({
                                    resumeId: resume.id,
                                    currentStarred: resume.starred,
                                  })
                                }
                                className="absolute top-2 left-2 p-1 rounded hover:bg-white/50 transition-colors"
                              >
                                <Star
                                  className={`w-4 h-4 ${
                                    resume.starred
                                      ? "fill-amber-400 text-amber-400"
                                      : "text-muted-foreground"
                                  }`}
                                />
                              </button>
                            </div>

                            <div className="space-y-1">
                              <CardTitle className="text-base leading-snug">
                                {resume.name}
                              </CardTitle>
                              <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                Updated {resume.updatedAt} · {resume.pages}p
                              </p>
                            </div>
                          </CardHeader>

                          <CardContent className="flex-1 flex flex-col gap-4">
                            <div className="space-y-1.5">
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-muted-foreground">ATS Score</span>
                                <span className={`rounded-full px-2 py-0.5 text-sm font-bold ${getResumeScoreTextClass(resume.score)} ${getResumeScoreBgClass(resume.score)}`}>
                                  <span aria-hidden="true" className="mr-1">●</span>
                                  {resume.score} – {getScoreLabel(resume.score)}
                                </span>
                              </div>
                              <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                                <MotionDiv
                                  className={`h-full rounded-full ${getResumeScoreBarClass(resume.score)}`}
                                  initial={shouldReduceMotion ? false : { width: 0 }}
                                  animate={shouldReduceMotion ? false : { width: `${resume.score}%` }}
                                  transition={shouldReduceMotion ? undefined : { duration: 0.7, delay: i * 0.06 + 0.2 }}
                                />
                              </div>
                            </div>

                            <Badge
                              variant="secondary"
                              className="w-fit text-xs bg-accent/10 text-accent border-accent/20"
                            >
                              ✓ {resume.status}
                            </Badge>

                            <div className="mt-auto flex gap-2 pt-2 border-t border-border/50">
                              <Button
                                size="sm"
                                className="flex-1 bg-primary hover:bg-primary/90 text-xs h-8"
                                aria-label={`View analysis for ${resume.name}`}
                                onClick={() => router.push(`/analysis/${resume.id}`)}
                              >
                                <Eye className="w-3 h-3 mr-1" />
                                View Analysis
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-xs h-8 px-2"
                                title="Re-analyse"
                                aria-label={`Re-analyse ${resume.name}`}
                                onClick={() => router.push("/upload")}
                              >
                                <RefreshCw className="w-3 h-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-xs h-8 px-2"
                                title="Download"
                                aria-label={`Download ${resume.name}`}
                                onClick={() => toast.success("Downloading...")}
                              >
                                <Download className="w-3 h-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-xs h-8 px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                                title="Delete"
                                aria-label="Delete resume"
                                onClick={() => deleteResume(resume.id)}
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                              </MotionDiv>
                    ))}
                  </AnimatePresence>
                </div>

                {hasMore && (
                  <div className="flex justify-center pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setPage((current) => current + 1)}
                      disabled={isLoadingMore}
                    >
                      {isLoadingMore ? "Loading more..." : "Load more"}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </MotionDiv>
        </main>
      </div>
    </div>
  );
}
