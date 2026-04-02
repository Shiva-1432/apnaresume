import type { Metadata } from "next";
import MyResumes from "@/components/MyResumes";

export const metadata: Metadata = {
  title: "ApnaResume | My Resumes",
  description: "View, manage, and analyze all your saved resumes.",
  alternates: { canonical: "/my-resumes" },
};

export default function MyResumesPage() {
  return <MyResumes />;
}
