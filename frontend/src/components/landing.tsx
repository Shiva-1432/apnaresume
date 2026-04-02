"use client";

import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { CheckCircle2, Zap, TrendingUp, Shield, ArrowRight, Users } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";

/**
 * ResumePro Landing Page
 *
 * Design Philosophy:
 * - Bold hero section with clear value proposition
 * - Feature cards highlighting core benefits
 * - Social proof and testimonials
 * - Strong CTA to drive conversions
 * - Asymmetric layout with visual hierarchy
 */

export default function Landing() {
  const [email, setEmail] = useState("");

  const features = [
    {
      icon: Zap,
      title: "AI-Powered Analysis",
      description: "Get instant ATS scoring powered by advanced AI that understands what recruiters want.",
    },
    {
      icon: TrendingUp,
      title: "Actionable Suggestions",
      description: "Receive specific, implementable recommendations to boost your ATS score instantly.",
    },
    {
      icon: Shield,
      title: "100% Secure",
      description: "Your resume data is encrypted and automatically deleted after 90 days.",
    },
  ];

  const benefits = [
    "Increase ATS compatibility by up to 40%",
    "Get matched with more job opportunities",
    "Stand out from other candidates",
    "Save hours on manual resume editing",
  ];

  const testimonials = [
    {
      name: "Priya Sharma",
      role: "Software Engineer",
      text: "ResumePro helped me land 3 interviews within a week. The suggestions were spot-on!",
      avatar: "PS",
    },
    {
      name: "Arjun Patel",
      role: "Product Manager",
      text: "The ATS score breakdown was incredibly helpful. I improved from 62 to 89 in one session.",
      avatar: "AP",
    },
    {
      name: "Neha Gupta",
      role: "Data Analyst",
      text: "Best INR 199 I've spent. The ROI is insane when you land a job paying lakhs.",
      avatar: "NG",
    },
  ];

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
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border/50 bg-card/80 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="container flex items-center justify-between h-16 px-4">
          <div className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black group-hover:rotate-12 transition-transform shadow-lg shadow-indigo-200">
              <span className="text-sm">A</span>
            </div>
            <h1 className="text-xl font-black tracking-tight text-neutral-900 group-hover:text-indigo-600 transition-colors font-syne">ApnaResume</h1>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm">Sign In</Button>
            <Button size="sm" className="bg-primary hover:bg-primary/90">Get Started</Button>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden bg-gradient-to-b from-primary/5 to-background py-20 md:py-32">
        <div className="container px-4 max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center space-y-6"
          >
            <div className="inline-block">
              <span className="px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-semibold">
                ✨ AI-Powered Resume Optimization
              </span>
            </div>

            <h1 className="text-5xl md:text-6xl font-bold text-foreground leading-tight">
              Your Resume Deserves Better Than Generic Feedback
            </h1>

            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Get an instant ATS score, AI-powered suggestions, and actionable insights to land more interviews. All for just INR 199.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-lg px-8">
                Analyze Your Resume Free
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button size="lg" variant="outline" className="text-lg px-8">
                See How It Works
              </Button>
            </div>

            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground pt-4">
              <Users className="w-4 h-4" />
              <span>Join 5,000+ job seekers who improved their ATS scores</span>
            </div>
          </motion.div>
        </div>

        <div className="absolute top-20 right-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl -z-10" />
        <div className="absolute bottom-0 left-10 w-96 h-96 bg-accent/5 rounded-full blur-3xl -z-10" />
      </section>

      <section className="py-20 md:py-32 bg-card">
        <div className="container px-4 max-w-6xl">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="space-y-12"
          >
            <div className="text-center space-y-4">
              <h2 className="text-4xl font-bold text-foreground">Why ResumePro?</h2>
              <p className="text-lg text-muted-foreground">Everything you need to beat the ATS and land interviews</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {features.map((feature) => {
                const Icon = feature.icon;
                return (
                  <motion.div key={feature.title} variants={itemVariants}>
                    <Card className="border-0 shadow-md hover:shadow-lg transition-all duration-300 h-full">
                      <CardContent className="pt-8">
                        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                          <Icon className="w-6 h-6 text-primary" />
                        </div>
                        <h3 className="text-xl font-semibold text-foreground mb-2">{feature.title}</h3>
                        <p className="text-muted-foreground">{feature.description}</p>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-20 md:py-32 bg-background">
        <div className="container px-4 max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="space-y-8"
            >
              <div>
                <h2 className="text-4xl font-bold text-foreground mb-4">
                  Stop Guessing. Start Winning.
                </h2>
                <p className="text-lg text-muted-foreground">
                  Our AI analyzes your resume against thousands of successful applications to give you the edge you need.
                </p>
              </div>

              <div className="space-y-4">
                {benefits.map((benefit) => (
                  <div key={benefit} className="flex items-start gap-3">
                    <CheckCircle2 className="w-6 h-6 text-accent flex-shrink-0 mt-0.5" />
                    <span className="text-foreground font-medium">{benefit}</span>
                  </div>
                ))}
              </div>

              <Button size="lg" className="bg-primary hover:bg-primary/90">
                Get Started Now
              </Button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="bg-gradient-to-br from-primary/20 to-accent/20 rounded-2xl p-8 border border-primary/20">
                <div className="space-y-6">
                  <div className="bg-card rounded-lg p-6 shadow-md">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm font-semibold text-muted-foreground">ATS Score</span>
                      <span className="text-2xl font-bold text-primary">78/100</span>
                    </div>
                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full w-3/4 bg-primary rounded-full" />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <p className="text-sm font-semibold text-foreground">Top Suggestions:</p>
                    <div className="space-y-2">
                      {["Add 5 more keywords", "Fix formatting issues", "Improve bullet points"].map((item) => (
                        <div key={item} className="flex items-center gap-2 text-sm text-muted-foreground">
                          <div className="w-2 h-2 rounded-full bg-accent" />
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="py-20 md:py-32 bg-card">
        <div className="container px-4 max-w-6xl">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="space-y-12"
          >
            <div className="text-center space-y-4">
              <h2 className="text-4xl font-bold text-foreground">What Users Say</h2>
              <p className="text-lg text-muted-foreground">Real results from real job seekers</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {testimonials.map((testimonial) => (
                <motion.div key={testimonial.name} variants={itemVariants}>
                  <Card className="border-0 shadow-md h-full">
                    <CardContent className="pt-8">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                          <span className="font-bold text-primary text-sm">{testimonial.avatar}</span>
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">{testimonial.name}</p>
                          <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                        </div>
                      </div>
                      <p className="text-muted-foreground italic">&quot;{testimonial.text}&quot;</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-20 md:py-32 bg-background">
        <div className="container px-4 max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center space-y-12"
          >
            <div className="space-y-4">
              <h2 className="text-4xl font-bold text-foreground">Simple, Affordable Pricing</h2>
              <p className="text-lg text-muted-foreground">No subscriptions. No hidden fees.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              {[
                { name: "Starter", credits: 20, price: "Free", color: "border-border" },
                { name: "Pro", credits: 100, price: "INR 199", color: "border-primary ring-2 ring-primary/20", highlight: true },
                { name: "Premium", credits: 500, price: "INR 799", color: "border-border" },
              ].map((plan) => (
                <motion.div
                  key={plan.name}
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className={`border-2 shadow-lg h-full ${plan.color}`}>
                    <CardContent className="pt-8">
                      {plan.highlight && (
                        <div className="mb-4 inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
                          Most Popular
                        </div>
                      )}
                      <h3 className="text-2xl font-bold text-foreground mb-2">{plan.name}</h3>
                      <p className="text-4xl font-bold text-primary mb-2">{plan.price}</p>
                      <p className="text-muted-foreground mb-6">{plan.credits} credits</p>
                      <Button
                        className={`w-full ${plan.highlight ? "bg-primary hover:bg-primary/90" : "border border-primary text-primary hover:bg-primary/10"}`}
                        variant={plan.highlight ? "primary" : "outline"}
                      >
                        Get Started
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-20 md:py-32 bg-gradient-to-r from-primary/10 to-accent/10">
        <div className="container px-4 max-w-4xl text-center space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-bold text-foreground mb-4">
              Ready to Boost Your ATS Score?
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Join thousands of job seekers who&apos;ve already improved their chances of landing interviews.
            </p>
            <Button size="lg" className="bg-primary hover:bg-primary/90 text-lg px-8">
              Start Your Free Analysis
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </motion.div>
        </div>
      </section>

      <footer className="border-t border-border bg-card">
        <div className="container px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="font-bold text-foreground mb-4">ResumePro</h3>
              <p className="text-sm text-muted-foreground">AI-powered ATS optimization for job seekers.</p>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary">Features</a></li>
                <li><a href="#" className="hover:text-primary">Pricing</a></li>
                <li><a href="#" className="hover:text-primary">Blog</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary">About</a></li>
                <li><a href="#" className="hover:text-primary">Contact</a></li>
                <li><a href="#" className="hover:text-primary">Privacy</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary">Terms</a></li>
                <li><a href="#" className="hover:text-primary">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-primary">Cookies</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border pt-8 text-center text-sm text-muted-foreground">
            <p>&copy; 2026 ResumePro. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
