export function routeToFeature(pathname: string): string {
  const normalized = String(pathname || "").toLowerCase();

  if (normalized.startsWith("/dashboard")) return "dashboard";
  if (normalized.startsWith("/my-resumes") || normalized.startsWith("/resumes")) return "resume-library";
  if (normalized.startsWith("/analysis")) return "analysis";
  if (normalized.startsWith("/upload")) return "upload";
  if (normalized.startsWith("/history")) return "history";
  if (normalized.startsWith("/analytics")) return "analytics";
  if (normalized.startsWith("/job-matcher")) return "job-matcher";
  if (normalized.startsWith("/fresher-mode")) return "fresher-mode";
  if (normalized.startsWith("/settings")) return "settings";
  if (normalized.startsWith("/support")) return "support";
  if (normalized.startsWith("/privacy")) return "privacy";
  if (normalized.startsWith("/terms")) return "terms";
  if (normalized.startsWith("/onboarding")) return "onboarding";

  return "other";
}