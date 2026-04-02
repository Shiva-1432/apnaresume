"use client";

import Landing from "@/components/landing";
import AuthenticatedHome from "@/components/AuthenticatedHome";

export default function AppEntry({ isSignedIn }: { isSignedIn: boolean }) {
  const isAuthenticated = isSignedIn;

  return isAuthenticated ? <AuthenticatedHome /> : <Landing />;
}
