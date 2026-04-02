import type { Metadata } from "next";
import History from "@/components/history";

export const metadata: Metadata = {
  title: "ApnaResume | Resume History",
  description: "View and manage your resume analysis history.",
  alternates: { canonical: "/history" },
};

export default function HistoryPage() {
  return <History />;
}
