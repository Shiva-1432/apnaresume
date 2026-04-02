"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Home from "@/components/home";

const ONBOARDING_DONE_KEY = "apnaresume_onboarding_done";

export default function AuthenticatedHome() {
  const router = useRouter();
  const [onboardingDone] = useState<boolean>(() => {
    if (typeof window === "undefined") {
      return false;
    }
    return localStorage.getItem(ONBOARDING_DONE_KEY) === "true";
  });

  useEffect(() => {
    if (!onboardingDone) {
      router.replace("/onboarding");
    }
  }, [onboardingDone, router]);

  if (onboardingDone !== true) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-muted-foreground">
        Loading...
      </div>
    );
  }

  return <Home />;
}
