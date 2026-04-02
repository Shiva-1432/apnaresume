import type { Metadata } from "next";
import { auth } from "@clerk/nextjs/server";
import AppEntry from "@/components/AppEntry";

export const metadata: Metadata = {
  title: "ApnaResume | AI Resume Precision",
  description: "Optimize your career with government-grade ATS analysis and AI-driven growth roadmaps.",
  alternates: { canonical: "/" },
};

export default async function Home() {
  const { userId } = await auth();

  return <AppEntry isSignedIn={Boolean(userId)} />;
}
