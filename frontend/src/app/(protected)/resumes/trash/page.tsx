"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import axios from "axios";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { API_BASE_URL } from "@/lib/apiBaseUrl";
import { CalendarClock, RotateCcw, Trash2, XCircle } from "lucide-react";

type TrashResume = {
  _id?: string;
  id?: string;
  file_name?: string;
  version_name?: string;
  target_role?: string;
  deleted_at?: string | Date | null;
  created_at?: string | Date | null;
  updated_at?: string | Date | null;
};

function formatDate(value?: string | Date | null) {
  if (!value) {
    return "Recently";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "Recently";
  }

  return parsed.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function getResumeLabel(resume: TrashResume) {
  return resume.version_name || resume.file_name || resume.target_role || "Resume";
}

export default function TrashPage() {
  const { getToken } = useAuth();
  const [trash, setTrash] = useState<TrashResume[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<TrashResume | null>(null);

  useEffect(() => {
    let active = true;

    const loadTrash = async () => {
      try {
        setLoading(true);
        setError(null);

        const token = await getToken();
        if (!token) {
          throw new Error("Authentication required");
        }

        const response = await axios.get(`${API_BASE_URL}/analysis/trash`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!active) {
          return;
        }

        setTrash(Array.isArray(response.data?.resumes) ? response.data.resumes : []);
      } catch (loadError) {
        if (!active) {
          return;
        }

        console.error("Trash load error:", loadError);
        setError("Could not load trash right now.");
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadTrash();

    return () => {
      active = false;
    };
  }, [getToken]);

  const restoreResume = async (resume: TrashResume) => {
    const resumeId = String(resume._id || resume.id || "");
    if (!resumeId) {
      return;
    }

    try {
      setRestoringId(resumeId);
      const token = await getToken();
      if (!token) {
        throw new Error("Authentication required");
      }

      await axios.post(
        `${API_BASE_URL}/analysis/resume/${resumeId}/restore`,
        null,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setTrash((current) => current.filter((item) => String(item._id || item.id || "") !== resumeId));
      toast.success("Resume restored");
    } catch (restoreError) {
      console.error("Restore error:", restoreError);
      toast.error("Could not restore resume");
    } finally {
      setRestoringId(null);
    }
  };

  const permanentDeleteResume = async () => {
    if (!pendingDelete) {
      return;
    }

    const resumeId = String(pendingDelete._id || pendingDelete.id || "");
    if (!resumeId) {
      return;
    }

    try {
      setDeletingId(resumeId);
      const token = await getToken();
      if (!token) {
        throw new Error("Authentication required");
      }

      await axios.delete(`${API_BASE_URL}/analysis/resume/${resumeId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: {
          permanent: "true",
        },
      });

      setTrash((current) => current.filter((item) => String(item._id || item.id || "") !== resumeId));
      toast.success("Resume permanently deleted");
      setPendingDelete(null);
    } catch (deleteError) {
      console.error("Permanent delete error:", deleteError);
      toast.error("Could not delete resume permanently");
    } finally {
      setDeletingId(null);
    }
  };

  const trashCount = useMemo(() => trash.length, [trash.length]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 px-4 py-8 lg:py-12">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">
              Resumes
            </p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-neutral-900">
              Trash
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Restore deleted resumes or permanently remove them.
            </p>
          </div>

          <Link
            href="/resumes"
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-white px-4 py-2 text-sm font-semibold text-foreground shadow-sm transition-colors hover:bg-neutral-50"
          >
            <Trash2 className="h-4 w-4" />
            Back to Resumes
          </Link>
        </div>

        {error && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
            {error}
          </div>
        )}

        {loading ? (
          <Card className="border-0 bg-white/80 shadow-sm">
            <CardContent className="py-16 text-center text-sm text-muted-foreground">
              Loading trash...
            </CardContent>
          </Card>
        ) : trashCount === 0 ? (
          <Card className="border-0 bg-white/80 shadow-sm">
            <CardContent className="flex flex-col items-center justify-center py-20 text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-neutral-100 text-neutral-500">
                <Trash2 className="h-6 w-6" />
              </div>
              <h2 className="text-2xl font-black text-neutral-900">Trash is empty</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Deleted resumes will appear here if you miss the undo window.
              </p>
              <Link
                href="/resumes"
                className="mt-6 inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
              >
                Go to Resumes
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {trash.map((resume) => {
              const resumeId = String(resume._id || resume.id || "");
              const deletedLabel = formatDate(resume.deleted_at || resume.updated_at || resume.created_at);
              const isRestoring = restoringId === resumeId;
              const isDeleting = deletingId === resumeId;

              return (
                <Card
                  key={resumeId}
                  className="border border-neutral-200 bg-neutral-100/70 opacity-80 grayscale shadow-sm transition-all hover:opacity-100 hover:grayscale-0"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <CardTitle className="truncate text-lg text-neutral-900">
                          {getResumeLabel(resume)}
                        </CardTitle>
                        <p className="mt-2 flex items-center gap-2 text-xs font-medium text-neutral-500">
                          <CalendarClock className="h-3.5 w-3.5" />
                          Deleted {deletedLabel}
                        </p>
                      </div>
                      <div className="rounded-full bg-neutral-200 px-3 py-1 text-xs font-semibold text-neutral-600">
                        Deleted
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-2 text-sm text-neutral-600">
                      <XCircle className="h-4 w-4 text-neutral-400" />
                      Available in trash until permanently removed
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="flex-1 bg-primary hover:bg-primary/90"
                        disabled={isRestoring || isDeleting}
                        onClick={() => restoreResume(resume)}
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        {isRestoring ? "Restoring..." : "Restore"}
                      </Button>

                      <Button
                        size="sm"
                        variant="danger"
                        className="flex-1"
                        disabled={isRestoring || isDeleting}
                        onClick={() => setPendingDelete(resume)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Permanently Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <AlertDialog
        open={Boolean(pendingDelete)}
        onOpenChange={(open) => {
          if (!open && !deletingId) {
            setPendingDelete(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Permanently delete this resume?</AlertDialogTitle>
            <AlertDialogDescription>
              This cannot be undone. The resume will be removed from trash and deleted from your account permanently.
              {pendingDelete ? (
                <span className="mt-2 block font-semibold text-neutral-900">
                  {getResumeLabel(pendingDelete)}
                </span>
              ) : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={Boolean(deletingId)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={permanentDeleteResume}
              disabled={Boolean(deletingId)}
              className="bg-rose-600 text-white hover:bg-rose-700"
            >
              {deletingId ? "Deleting..." : "Delete permanently"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}