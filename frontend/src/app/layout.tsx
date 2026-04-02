import type { Metadata } from "next";
import { ClerkProvider, SignInButton, SignUpButton, Show, UserButton } from "@clerk/nextjs";
import { Syne, DM_Sans } from "next/font/google";
import "./globals.css";
import { env } from "@/lib/env";

const googleSiteVerification = process.env.GOOGLE_SITE_VERIFICATION;

const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
  weight: ["800"],
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL(env.NEXT_PUBLIC_APP_URL),
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
    url: env.NEXT_PUBLIC_APP_URL,
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

import AppShell from "@/components/AppShell";
import AppProviders from "@/components/AppProviders";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${syne.variable} ${dmSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-mesh font-dm transition-colors duration-500">
        <ClerkProvider signInForceRedirectUrl="/dashboard" signUpForceRedirectUrl="/dashboard">
          <header className="fixed top-3 right-4 z-[60]">
            <div className="flex items-center gap-2 bg-white/70 backdrop-blur-xl border border-neutral-200 rounded-xl px-3 py-2 shadow-sm">
              <Show when="signed-out">
                <SignInButton><span className="text-xs font-bold text-neutral-700 hover:text-indigo-600">Sign In</span></SignInButton>
                <SignUpButton><span className="text-xs font-bold text-indigo-600 hover:text-indigo-700">Sign Up</span></SignUpButton>
              </Show>
              <Show when="signed-in">
                <UserButton />
              </Show>
            </div>
          </header>

          <AppProviders>
            <AppShell>{children}</AppShell>
          </AppProviders>
        </ClerkProvider>

      </body>
    </html>
  );
}
