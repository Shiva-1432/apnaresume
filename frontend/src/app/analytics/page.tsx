import type { Metadata } from "next";
import Analytics from "@/components/Analytics";

export const metadata: Metadata = {
  title: "ApnaResume | Analytics",
  description: "Track ATS score trends, category breakdowns, and resume improvement analytics.",
  alternates: { canonical: "/analytics" },
};

export default function AnalyticsPage() {
  return <Analytics />;
}
