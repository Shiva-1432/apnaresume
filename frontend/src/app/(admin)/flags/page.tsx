"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, RefreshCcw } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { toast } from "sonner";
import Button from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { useAuthenticatedApi } from "@/hooks/useAuthenticatedApi";
import { useAdminFlags } from "@/hooks/admin";
import { ADMIN_ENDPOINTS } from "@/lib/api/endpoints";
import { admin } from "@/lib/api/queryKeys";
import { logAdminAction } from "@/lib/utils/auditLog";
import type { FeatureFlag } from "@/types/admin";

const RECOMMENDED_FLAGS: Array<{ name: string; description: string; enabled: boolean }> = [
  { name: "job_matcher_enabled", description: "Enable job matcher scoring and suggestions", enabled: true },
  { name: "skill_gap_enabled", description: "Enable skill-gap analyzer and recommendations", enabled: true },
  { name: "resume_versioning_enabled", description: "Enable resume version history and compare", enabled: true },
  { name: "billing_enabled", description: "Enable billing and subscription surfaces", enabled: false },
  { name: "analytics_enabled", description: "Enable analytics dashboards and insights", enabled: true },
];

type FlagRecord = FeatureFlag & {
  rollout_percentage?: number;
  env?: {
    dev?: boolean;
    staging?: boolean;
    prod?: boolean;
  };
};

type CreateFlagInput = {
  name: string;
  description: string;
  enabled?: boolean;
};

function normalizeFlag(flag: FlagRecord): FeatureFlag {
  return {
    ...flag,
    rolloutPercentage: Number(
      flag.rolloutPercentage ?? flag.rollout_percentage ?? 0
    ),
    environments: flag.environments ?? flag.env ?? { dev: true, staging: true, prod: true },
  };
}

function normalizeFlags(flags: FeatureFlag[]): FeatureFlag[] {
  return flags.map((flag) => normalizeFlag(flag as FlagRecord));
}

function toSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_\-\s]/g, "")
    .replace(/\s+/g, "_");
}

export default function FeatureFlagsAdminPage() {
  const queryClient = useQueryClient();
  const { request } = useAuthenticatedApi();
  const { user } = useUser();
  const seededOnce = useRef(false);

  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");

  const flagsQuery = useAdminFlags();
  const flags = useMemo(() => normalizeFlags(flagsQuery.data ?? []), [flagsQuery.data]);

  const seedDefaultsMutation = useMutation({
    mutationFn: async (flagsToCreate: Array<{ name: string; description: string; enabled: boolean }>) => {
      const settled = await Promise.allSettled(
        flagsToCreate.map((flag) =>
          request({
            method: "POST",
            url: ADMIN_ENDPOINTS.flags,
            data: {
              name: flag.name,
              description: flag.description,
              enabled: flag.enabled,
              rolloutPercentage: flag.enabled ? 100 : 0,
              environments: { dev: true, staging: true, prod: true },
            },
          })
        )
      );

      return {
        created: settled.filter((result) => result.status === "fulfilled").length,
        failed: settled.filter((result) => result.status === "rejected").length,
      };
    },
    onSuccess: ({ created, failed }) => {
      if (created > 0 && failed === 0) {
        toast.success(`Pre-created ${created} feature flags`);
      } else if (created > 0) {
        toast.error(`Created ${created} flags, ${failed} failed`);
      }
      queryClient.invalidateQueries({ queryKey: admin.flags() });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to pre-create flags");
    },
  });

  useEffect(() => {
    if (seededOnce.current) return;
    if (!flagsQuery.data) return;

    seededOnce.current = true;
    const existing = new Set(flags.map((flag) => flag.name));
    const missing = RECOMMENDED_FLAGS.filter((flag) => !existing.has(flag.name));
    if (missing.length > 0) {
      seedDefaultsMutation.mutate(missing);
    }
  }, [flagsQuery.data, flags, seedDefaultsMutation]);

  const updateFlagMutation = useMutation({
    mutationFn: async ({ name, patch }: { name: string; patch: Record<string, unknown> }) => {
      await request({ method: "PATCH", url: ADMIN_ENDPOINTS.flag(name), data: patch });
    },
    onMutate: async ({ name, patch }) => {
      await logAdminAction({
        adminId: user?.id || "unknown",
        action: "feature_flag_update",
        targetType: "feature_flag",
        targetId: name,
        metadata: patch,
      });
      await queryClient.cancelQueries({ queryKey: admin.flags() });
      const previous = queryClient.getQueryData<FeatureFlag[]>(admin.flags());

      queryClient.setQueryData<FeatureFlag[]>(admin.flags(), (current) => {
        const list = current ?? [];
        return list.map((flag) => {
          if (flag.name !== name) return flag;
          return {
            ...flag,
            ...patch,
            environments:
              patch.environments && typeof patch.environments === "object"
                ? { ...(flag.environments ?? {}), ...(patch.environments as FeatureFlag["environments"]) }
                : flag.environments,
          };
        });
      });

      return { previous };
    },
    onError: (error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(admin.flags(), context.previous);
      }
      toast.error(error instanceof Error ? error.message : "Failed to update flag");
    },
    onSuccess: (_data, variables) => {
      const patchKeys = Object.keys(variables.patch);
      if (patchKeys.includes("enabled")) toast.success("Flag toggle updated");
      else if (patchKeys.includes("rolloutPercentage")) toast.success("Rollout updated");
      else if (patchKeys.includes("environments")) toast.success("Environments updated");
      else toast.success("Flag updated");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: admin.flags() });
    },
  });

  const createFlagMutation = useMutation({
    mutationFn: async (payload: CreateFlagInput) => {
      await request({
        method: "POST",
        url: ADMIN_ENDPOINTS.flags,
        data: {
          ...payload,
          enabled: false,
          rolloutPercentage: 0,
          environments: { dev: true, staging: true, prod: true },
        },
      });
    },
    onSuccess: () => {
      toast.success("Feature flag created");
      setNewName("");
      setNewDescription("");
      queryClient.invalidateQueries({ queryKey: admin.flags() });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to create feature flag");
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-white">Feature Flags</h1>
          <p className="text-sm text-slate-400">Control feature rollout by toggle, percentage, and environment</p>
        </div>
        <Button
          size="sm"
          variant="outline"
          icon={<RefreshCcw className="h-4 w-4" />}
          loading={flagsQuery.isFetching}
          onClick={() => flagsQuery.refetch()}
        >
          Refresh
        </Button>
      </div>

      <Card className="border-slate-800 bg-slate-900 text-slate-100">
        <CardHeader>
          <CardTitle className="text-base font-bold text-white">Add New Flag</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-[1fr_1.5fr_auto] md:items-end">
          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-400">Name (slug)</label>
            <input
              value={newName}
              onChange={(e) => setNewName(toSlug(e.target.value))}
              placeholder="new_feature_enabled"
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white outline-none placeholder:text-slate-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-400">Description</label>
            <input
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              placeholder="Describe what this flag gates"
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white outline-none placeholder:text-slate-500"
            />
          </div>
          <Button
            size="sm"
            icon={<Plus className="h-4 w-4" />}
            loading={createFlagMutation.isPending}
            disabled={!newName.trim() || !newDescription.trim()}
            onClick={() =>
              createFlagMutation.mutate({
                name: newName.trim(),
                description: newDescription.trim(),
                enabled: false,
              })
            }
          >
            Create
          </Button>
        </CardContent>
      </Card>

      <Card className="border-slate-800 bg-slate-900 text-slate-100">
        <CardHeader>
          <CardTitle className="text-base font-bold text-white">All Flags</CardTitle>
        </CardHeader>
        <CardContent>
          {flagsQuery.isLoading ? (
            <p className="text-sm text-slate-400">Loading flags...</p>
          ) : flagsQuery.isError ? (
            <p className="text-sm text-rose-300">Failed to load flags: {String((flagsQuery.error as Error)?.message || "Unknown error")}</p>
          ) : flags.length === 0 ? (
            <p className="text-sm text-slate-400">No flags found.</p>
          ) : (
            <div className="space-y-4">
              {flags.map((flag) => {
                const env = flag.environments ?? { dev: true, staging: true, prod: true };
                const rollout = Math.min(100, Math.max(0, Number(flag.rolloutPercentage ?? 0)));

                return (
                  <div key={flag.name} className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div>
                        <div className="font-mono text-sm font-bold text-cyan-300">{flag.name}</div>
                        <p className="mt-1 text-sm text-slate-300">{flag.description || "No description"}</p>
                      </div>

                      <button
                        type="button"
                        className={[
                          "relative inline-flex h-7 w-14 items-center rounded-full transition-colors",
                          flag.enabled ? "bg-emerald-500" : "bg-slate-600",
                        ].join(" ")}
                        onClick={() =>
                          updateFlagMutation.mutate({
                            name: flag.name,
                            patch: { enabled: !flag.enabled },
                          })
                        }
                      >
                        <span
                          className={[
                            "inline-block h-5 w-5 transform rounded-full bg-white transition-transform",
                            flag.enabled ? "translate-x-8" : "translate-x-1",
                          ].join(" ")}
                        />
                      </button>
                    </div>

                    <div className="mt-4 grid gap-4 lg:grid-cols-[1.2fr_1fr]">
                      <div>
                        <div className="mb-1 text-xs font-bold uppercase tracking-wide text-slate-400">
                          Rollout Percentage: {rollout}%
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={100}
                          step={1}
                          value={rollout}
                          className="w-full accent-cyan-400"
                          onChange={(e) => {
                            const next = Number(e.target.value);
                            updateFlagMutation.mutate({
                              name: flag.name,
                              patch: { rolloutPercentage: next },
                            });
                          }}
                        />
                      </div>

                      <div>
                        <div className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">Environments</div>
                        <div className="flex flex-wrap gap-3">
                          {(["dev", "staging", "prod"] as const).map((name) => (
                            <label key={name} className="inline-flex items-center gap-2 text-sm text-slate-300">
                              <input
                                type="checkbox"
                                checked={Boolean(env[name])}
                                onChange={(e) => {
                                  updateFlagMutation.mutate({
                                    name: flag.name,
                                    patch: {
                                      environments: {
                                        ...env,
                                        [name]: e.target.checked,
                                      },
                                    },
                                  });
                                }}
                              />
                              {name}
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
