"use client";

import { Button } from "@/components/ui/Button";
import { CheckCircle2, ArrowRight, SkipForward } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

/**
 * ApnaResume Onboarding Page
 *
 * Design Philosophy:
 * - Welcome new users with clear value proposition
 * - 3-step feature walkthrough with animations
 * - Easy skip option for experienced users
 * - Strong CTA to start first analysis
 */

export default function Onboarding() {
  const [currentStep, setCurrentStep] = useState(0);
  const router = useRouter();
  const ONBOARDING_DONE_KEY = "apnaresume_onboarding_done";

  useEffect(() => {
    const done = localStorage.getItem(ONBOARDING_DONE_KEY) === "true";
    if (done) {
      router.replace("/");
    }
  }, [router]);

  const steps = [
    {
      title: "Welcome to ApnaResume",
      description: "Your AI-powered resume optimizer. Let’s get you started with your first analysis.",
      icon: "👋",
      details: [
        "Upload your resume in PDF or image format",
        "Get instant ATS score and detailed breakdown",
        "Receive AI-powered improvement suggestions",
      ],
    },
    {
      title: "How It Works",
      description: "Our AI analyzes your resume against thousands of successful applications.",
      icon: "🤖",
      details: [
        "Keywords matching (What recruiters search for)",
        "Formatting analysis (ATS compatibility)",
        "Structure optimization (Best practices)",
      ],
    },
    {
      title: "Get Results in Seconds",
      description: "See your ATS score, improvement suggestions, and actionable insights instantly.",
      icon: "⚡",
      details: [
        "ATS Score (1-100 scale)",
        "Top improvement suggestions",
        "Download improved resume",
        "Share your score on LinkedIn/WhatsApp",
      ],
    },
  ];

  const currentStepData = steps[currentStep];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      localStorage.setItem(ONBOARDING_DONE_KEY, "true");
      router.push("/");
    }
  };

  const handleSkip = () => {
    localStorage.setItem(ONBOARDING_DONE_KEY, "true");
    router.push("/");
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 },
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black group-hover:rotate-12 transition-transform shadow-lg shadow-indigo-200">
              <span className="text-sm">A</span>
            </div>
            <h1 className="text-xl font-black tracking-tight text-neutral-900 group-hover:text-indigo-600 transition-colors font-syne">ApnaResume</h1>
          </div>
          <Button variant="ghost" size="sm" onClick={handleSkip} className="text-muted-foreground">
            <SkipForward className="w-4 h-4 mr-2" />
            Skip
          </Button>
        </div>

        <motion.div
          key={currentStep}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.5 }}
          className="space-y-8"
        >
          <div className="text-center space-y-4">
            <div className="text-6xl mb-4">{currentStepData.icon}</div>
            <h2 className="text-4xl font-bold text-foreground">{currentStepData.title}</h2>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">{currentStepData.description}</p>
          </div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-3"
          >
            {currentStepData.details.map((detail, index) => (
              <motion.div key={index} variants={itemVariants} className="flex items-start gap-3">
                <CheckCircle2 className="w-6 h-6 text-accent flex-shrink-0 mt-0.5" />
                <span className="text-foreground text-lg">{detail}</span>
              </motion.div>
            ))}
          </motion.div>

          <div className="flex items-center justify-center gap-2">
            {steps.map((_, index) => (
              <motion.div
                key={index}
                className={`h-2 rounded-full transition-all ${
                  index === currentStep
                    ? "bg-primary w-8"
                    : index < currentStep
                      ? "bg-accent w-6"
                      : "bg-muted w-2"
                }`}
                layoutId="indicator"
              />
            ))}
          </div>

          <div className="flex gap-4 justify-center pt-8">
            <Button
              variant="outline"
              size="lg"
              onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
              disabled={currentStep === 0}
              className="px-8"
            >
              Back
            </Button>
            <Button
              size="lg"
              onClick={handleNext}
              className="bg-primary hover:bg-primary/90 px-8 gap-2"
            >
              {currentStep === steps.length - 1 ? (
                <>
                  Start Analyzing
                  <ArrowRight className="w-4 h-4" />
                </>
              ) : (
                <>
                  Next
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </div>
        </motion.div>

        <div className="mt-16 text-center text-sm text-muted-foreground">
          <p>Step {currentStep + 1} of {steps.length}</p>
        </div>
      </div>
    </div>
  );
}
