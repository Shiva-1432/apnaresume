import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const googleSiteVerification = process.env.GOOGLE_SITE_VERIFICATION;

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "ApnaResume | AI Resume Analyzer & ATS Score Checker",
    template: "%s | ApnaResume",
  },
  description:
    "Analyze your resume with AI, get ATS score insights, and improve your chances for interviews faster.",
  applicationName: "ApnaResume",
  keywords: [
    "AI resume analyzer",
    "ATS score checker",
    "resume optimization",
    "job matcher",
    "resume feedback",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: siteUrl,
    siteName: "ApnaResume",
    title: "ApnaResume | AI Resume Analyzer & ATS Score Checker",
    description:
      "Analyze your resume with AI, get ATS score insights, and improve your chances for interviews faster.",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "ApnaResume",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ApnaResume | AI Resume Analyzer & ATS Score Checker",
    description:
      "Get ATS score insights, resume feedback, and role matching to land interviews faster.",
    images: ["/twitter-image"],
  },
  verification: {
    google: googleSiteVerification,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-gray-50">
        <nav className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
            <h1 className="text-2xl font-bold text-blue-600">ApnaResume</h1>
            <div className="flex flex-wrap items-center gap-4 text-sm font-medium text-gray-700">
              <Link href="/" className="hover:text-blue-600">Home</Link>
              <Link href="/dashboard" className="hover:text-blue-600">Dashboard</Link>
              <Link href="/job-matcher" className="hover:text-blue-600">Job Matcher</Link>
              <Link href="/fresher-mode" className="hover:text-blue-600">Fresher Mode</Link>
              <Link href="/faq" className="hover:text-blue-600">FAQ</Link>
              <Link href="/support" className="hover:text-blue-600">Support</Link>
            </div>
          </div>
        </nav>
        <main className="max-w-7xl mx-auto px-4">
          {children}
        </main>
        <footer className="mt-auto border-t border-gray-200 bg-white">
          <div className="max-w-7xl mx-auto px-4 py-4 flex flex-wrap items-center justify-between gap-3 text-sm text-gray-600">
            <p>© {new Date().getFullYear()} ApnaResume</p>
            <div className="flex items-center gap-4">
              <Link href="/terms" className="hover:text-blue-600">Terms</Link>
              <Link href="/privacy" className="hover:text-blue-600">Privacy</Link>
              <Link href="/support" className="hover:text-blue-600">Support</Link>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
