import type { Metadata } from "next";
import { auth } from "@clerk/nextjs/server";
import AppEntry from "@/components/AppEntry";

export const metadata: Metadata = {
  title: "ApnaResume — Get Past the ATS. Land the Interview.",
  description:
    "Upload your resume, get an instant ATS score, find keyword gaps, and track your job applications.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "ApnaResume",
    description: "ATS resume analysis for serious job seekers.",
    url: "https://apnaresume.com",
    siteName: "ApnaResume",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ApnaResume",
    description: "ATS resume analysis for serious job seekers.",
    images: ["/og-image.png"],
  },
};

export default async function Home() {
  const { userId } = await auth();

  return <AppEntry isSignedIn={Boolean(userId)} />;
}
