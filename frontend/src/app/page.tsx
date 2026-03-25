import Link from "next/link";
import type { Metadata } from "next";

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export const metadata: Metadata = {
  title: "Home",
  description:
    "Get instant ATS score insights, AI resume recommendations, and job-match guidance with ApnaResume.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "ApnaResume | AI Resume Analyzer & ATS Score Checker",
    description:
      "Get instant ATS score insights, AI resume recommendations, and job-match guidance.",
    url: siteUrl,
  },
};

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "ApnaResume",
  url: siteUrl,
  sameAs: [],
};

const webSiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "ApnaResume",
  url: siteUrl,
  potentialAction: {
    "@type": "SearchAction",
    target: `${siteUrl}/faq?query={search_term_string}`,
    "query-input": "required name=search_term_string",
  },
};

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webSiteSchema) }}
      />
      <div className="flex flex-col items-center justify-center py-14 sm:py-20 px-4 text-center">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-neutral-900 mb-4">ApnaResume</h1>
        <p className="text-lg sm:text-xl text-neutral-600 mb-8 max-w-2xl">Get your resume ATS score and improve instantly</p>

        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full sm:w-auto">
          <Link href="/login" className="px-6 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-semibold">
            Login
          </Link>
          <Link href="/signup" className="px-6 py-2.5 border border-primary-600 text-primary-600 rounded-lg hover:bg-primary-50 font-semibold">
            Sign Up
          </Link>
        </div>
      </div>
    </>
  );
}
