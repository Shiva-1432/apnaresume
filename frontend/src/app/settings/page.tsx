"use client";

import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/badge";
import {
  User,
  Lock,
  Bell,
  CreditCard,
  Shield,
  LogOut,
  Menu,
  X,
  CheckCircle2,
  ChevronRight,
  Trash2,
  Download,
  Eye,
  EyeOff,
} from "lucide-react";
import { useEffect, useState, type ElementType, type ReactNode } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import axios from "axios";
import { useAuth } from "@clerk/nextjs";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { API_BASE_URL } from "@/lib/apiBaseUrl";

/**
 * ApnaResume Settings Page
 *
 * Design Philosophy:
 * - Sectioned settings with clear grouping
 * - Inline editing for profile fields
 * - Toggle switches for notification preferences
 * - Billing/credits overview
 * - Danger zone (delete account, download data)
 * - Same sidebar nav as Home/History
 */

const navItems = [
  { label: "Home", icon: "🏠", path: "/" },
  { label: "Dashboard", icon: "📊", path: "/dashboard" },
  { label: "Job Matcher", icon: "🎯", path: "/job-matcher" },
  { label: "Fresher Mode", icon: "🌱", path: "/fresher-mode" },
  { label: "Settings", icon: "⚙️", path: "/settings", active: true },
];

function SectionCard({
  title,
  description,
  icon: Icon,
  children,
}: {
  title: string;
  description?: string;
  icon: ElementType;
  children: ReactNode;
}) {
  return (
    <Card className="border-0 shadow-md">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Icon className="w-4 h-4 text-primary" />
          </div>
          {title}
        </CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function FieldRow({
  label,
  value,
  type = "text",
  editing,
  onEdit,
}: {
  label: string;
  value: string;
  type?: string;
  editing: boolean;
  onEdit: (v: string) => void;
}) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-border/50 last:border-0">
      <div className="flex-1">
        <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
        {editing ? (
          <input
            type={type}
            defaultValue={value}
            onChange={(e) => onEdit(e.target.value)}
            className="text-sm text-foreground bg-muted/50 border border-border rounded-lg px-3 py-1.5 w-full max-w-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        ) : (
          <p className="text-sm text-foreground">{value}</p>
        )}
      </div>
    </div>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-border/50 last:border-0">
      <div className="flex-1 pr-4">
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative w-11 h-6 rounded-full transition-colors ${checked ? "bg-primary" : "bg-muted"}`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${checked ? "translate-x-5" : "translate-x-0"}`}
        />
      </button>
    </div>
  );
}

const preferencesSchema = z.object({
  displayName: z.string().min(1).max(50),
  emailNotifications: z.boolean(),
  weeklyDigest: z.boolean(),
  tips: z.boolean(),
});

const deleteConfirmationSchema = z.object({
  confirmation: z.literal('DELETE', {
    message: 'Type DELETE to confirm',
  }),
});

type PreferencesFormValues = z.infer<typeof preferencesSchema>;
type DeleteConfirmationFormValues = z.infer<typeof deleteConfirmationSchema>;

export default function Settings() {
  const router = useRouter();
  const { getToken } = useAuth();
  const setLocation = (path: string) => router.push(path);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [editingProfile, setEditingProfile] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [profile, setProfile] = useState({
    name: "Priya Sharma",
    email: "priya@example.com",
    phone: "+91 98765 43210",
  });

  const [notifications, setNotifications] = useState({
    emailAnalysis: true,
    emailTips: false,
    emailBilling: true,
    pushUpdates: false,
  });

  const preferencesForm = useForm<PreferencesFormValues>({
    resolver: zodResolver(preferencesSchema),
    defaultValues: {
      displayName: 'Priya Sharma',
      emailNotifications: true,
      weeklyDigest: false,
      tips: false,
    },
    mode: 'onChange',
  });

  useEffect(() => {
    preferencesForm.reset({
      displayName: profile.name,
      emailNotifications: notifications.emailAnalysis,
      weeklyDigest: notifications.pushUpdates,
      tips: notifications.emailTips,
    });
  }, [notifications.emailAnalysis, notifications.emailTips, notifications.pushUpdates, preferencesForm, profile.name]);

  const deleteConfirmationForm = useForm<DeleteConfirmationFormValues>({
    resolver: zodResolver(deleteConfirmationSchema),
    defaultValues: {
      confirmation: '' as unknown as 'DELETE',
    },
    mode: 'onChange',
  });

  const credits = {
    remaining: 100,
    total: 200,
    plan: "Pro",
    renewal: "May 1, 2026",
  };

  const purchaseHistory = [
    { date: "Apr 1, 2026", plan: "Pro - 200 credits", amount: "INR 199", status: "Paid" },
    { date: "Mar 1, 2026", plan: "Starter - 20 credits", amount: "Free", status: "Paid" },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 12 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="flex items-center justify-between h-16 px-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 hover:bg-muted rounded-lg"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <div className="flex items-center gap-3 group">
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black group-hover:rotate-12 transition-transform shadow-lg shadow-indigo-200">
                <span className="text-sm">A</span>
              </div>
              <h1 className="text-xl font-black tracking-tight text-neutral-900 group-hover:text-indigo-600 transition-colors font-syne">ApnaResume</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm">Profile</Button>
            <Button variant="ghost" size="sm">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <motion.aside
          initial={{ x: -250 }}
          animate={{ x: sidebarOpen ? 0 : -250 }}
          transition={{ duration: 0.3 }}
          className="fixed lg:static w-64 h-[calc(100vh-64px)] bg-card border-r border-border p-6 space-y-8 overflow-y-auto lg:translate-x-0 z-40"
        >
          <nav className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase mb-4">Menu</p>
            {navItems.map((item) => (
              <button
                key={item.label}
                onClick={() => setLocation(item.path)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  item.active
                    ? "bg-primary/10 text-primary font-semibold"
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </nav>

          {/* Danger zone shortcut */}
          <div className="border-t border-border pt-6">
            <button
              className="w-full flex items-center gap-2 text-sm text-destructive hover:bg-destructive/5 px-4 py-3 rounded-lg transition-all"
              onClick={() => setLocation("/")}
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </motion.aside>

        {/* Main Content */}
        <main className="flex-1 p-4 lg:p-8 overflow-y-auto">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="max-w-3xl space-y-6"
          >
            {/* Page Header */}
            <motion.div variants={itemVariants}>
              <h2 className="text-3xl font-bold text-foreground">Settings</h2>
              <p className="text-muted-foreground mt-1">Manage your account and preferences</p>
            </motion.div>

            {/* PROFILE */}
            <motion.div variants={itemVariants}>
              <SectionCard
                title="Profile Information"
                description="Update your personal details"
                icon={User}
              >
                <div className="space-y-0">
                  <FieldRow
                    label="Full Name"
                    value={profile.name}
                    editing={editingProfile}
                    onEdit={(v) => setProfile((p) => ({ ...p, name: v }))}
                  />
                  <FieldRow
                    label="Email Address"
                    value={profile.email}
                    type="email"
                    editing={editingProfile}
                    onEdit={(v) => setProfile((p) => ({ ...p, email: v }))}
                  />
                  <FieldRow
                    label="Phone Number"
                    value={profile.phone}
                    type="tel"
                    editing={editingProfile}
                    onEdit={(v) => setProfile((p) => ({ ...p, phone: v }))}
                  />
                </div>
                <div className="flex gap-2 mt-4">
                  {editingProfile ? (
                    <>
                      <Button
                        size="sm"
                        className="bg-primary hover:bg-primary/90"
                        onClick={() => {
                          setEditingProfile(false);
                          toast.success("Profile updated successfully!");
                        }}
                      >
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Save Changes
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingProfile(false)}
                      >
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditingProfile(true)}
                    >
                      Edit Profile
                    </Button>
                  )}
                </div>
              </SectionCard>
            </motion.div>

            {/* SECURITY */}
            <motion.div variants={itemVariants}>
              <SectionCard
                title="Account Security"
                description="Manage your password and two-factor authentication"
                icon={Lock}
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-3 border-b border-border/50">
                    <div>
                      <p className="text-sm font-medium text-foreground">Password</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {showPassword ? "last changed 30 days ago" : "••••••••••••"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setShowPassword(!showPassword)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                      <Button size="sm" variant="outline" onClick={() => toast.info("Password reset email sent!")}>
                        Change
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between py-3 border-b border-border/50">
                    <div>
                      <p className="text-sm font-medium text-foreground">Two-Factor Authentication</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Add an extra layer of security</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">Not enabled</Badge>
                      <Button size="sm" variant="outline" onClick={() => toast.info("2FA setup coming soon!")}>
                        Enable
                        <ChevronRight className="w-3 h-3 ml-1" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between py-3">
                    <div>
                      <p className="text-sm font-medium text-foreground">Active Sessions</p>
                      <p className="text-xs text-muted-foreground mt-0.5">1 active session - Chrome, India</p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-destructive border-destructive/30 hover:bg-destructive/10"
                      onClick={() => toast.success("All other sessions signed out")}
                    >
                      Sign out all
                    </Button>
                  </div>
                </div>
              </SectionCard>
            </motion.div>

            {/* PREFERENCES */}
            <motion.div variants={itemVariants}>
              <SectionCard
                title="Preferences"
                description="Set your display name and notification defaults"
                icon={Bell}
              >
                <form
                  className="space-y-6"
                  onSubmit={preferencesForm.handleSubmit(async (values) => {
                    try {
                      const token = await getToken();
                      if (!token) {
                        throw new Error('Authentication required');
                      }

                      await axios.patch(
                        `${API_BASE_URL}/users/preferences`,
                        values,
                        {
                          headers: {
                            Authorization: `Bearer ${token}`,
                          },
                        }
                      );

                      setProfile((current) => ({
                        ...current,
                        name: values.displayName,
                      }));
                      setNotifications({
                        emailAnalysis: values.emailNotifications,
                        emailTips: values.tips,
                        emailBilling: notifications.emailBilling,
                        pushUpdates: values.weeklyDigest,
                      });
                      toast.success('Preferences saved successfully!');
                    } catch (error) {
                      console.error('Preferences save error:', error);
                      toast.error('Failed to save preferences');
                    }
                  })}
                >
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-foreground">Display Name</label>
                    <input
                      type="text"
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                      {...preferencesForm.register('displayName')}
                    />
                    {preferencesForm.formState.errors.displayName && (
                      <p className="text-xs text-destructive font-medium">
                        {preferencesForm.formState.errors.displayName.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-0">
                    <Controller
                      control={preferencesForm.control}
                      name="emailNotifications"
                      render={({ field }) => (
                        <ToggleRow
                          label="Email Notifications"
                          description="Get notified when your resume analysis is ready"
                          checked={field.value}
                          onChange={field.onChange}
                        />
                      )}
                    />
                    <Controller
                      control={preferencesForm.control}
                      name="weeklyDigest"
                      render={({ field }) => (
                        <ToggleRow
                          label="Weekly Digest"
                          description="Receive a weekly summary of your activity"
                          checked={field.value}
                          onChange={field.onChange}
                        />
                      )}
                    />
                    <Controller
                      control={preferencesForm.control}
                      name="tips"
                      render={({ field }) => (
                        <ToggleRow
                          label="Tips"
                          description="Weekly tips to improve your ATS score"
                          checked={field.value}
                          onChange={field.onChange}
                        />
                      )}
                    />
                  </div>

                  <Button
                    type="submit"
                    size="sm"
                    className="bg-primary hover:bg-primary/90"
                    disabled={preferencesForm.formState.isSubmitting}
                  >
                    {preferencesForm.formState.isSubmitting ? 'Saving...' : 'Save Preferences'}
                  </Button>
                </form>
              </SectionCard>
            </motion.div>

            {/* BILLING */}
            <motion.div variants={itemVariants}>
              <SectionCard
                title="Billing & Credits"
                description="Manage your plan and purchase history"
                icon={CreditCard}
              >
                {/* Current plan */}
                <div className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-xl p-4 mb-4 border border-primary/20">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-foreground">{credits.plan} Plan</p>
                        <Badge className="bg-primary/20 text-primary border-primary/30 text-xs">Active</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        Renews {credits.renewal}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-primary">{credits.remaining}</p>
                      <p className="text-xs text-muted-foreground">of {credits.total} credits left</p>
                    </div>
                  </div>
                  {/* Credit bar */}
                  <div className="mt-3 w-full h-2 bg-white/50 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full"
                      style={{ width: `${(credits.remaining / credits.total) * 100}%` }}
                    />
                  </div>
                </div>

                <div className="flex gap-2 mb-6">
                  <Button size="sm" className="bg-primary hover:bg-primary/90">
                    Buy More Credits
                  </Button>
                  <Button size="sm" variant="outline">
                    Upgrade Plan
                  </Button>
                </div>

                {/* Purchase history */}
                <p className="text-sm font-semibold text-foreground mb-3">Purchase History</p>
                <div className="space-y-2">
                  {purchaseHistory.map((purchase, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between py-2.5 px-3 rounded-lg bg-muted/40 text-sm"
                    >
                      <div>
                        <p className="text-foreground font-medium">{purchase.plan}</p>
                        <p className="text-xs text-muted-foreground">{purchase.date}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-foreground">{purchase.amount}</p>
                        <Badge
                          variant="secondary"
                          className="text-xs bg-accent/10 text-accent border-accent/20"
                        >
                          {purchase.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </SectionCard>
            </motion.div>

            {/* PRIVACY & DATA */}
            <motion.div variants={itemVariants}>
              <SectionCard
                title="Privacy & Data"
                description="Control your data and account"
                icon={Shield}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between py-3 border-b border-border/50">
                    <div>
                      <p className="text-sm font-medium text-foreground">Download My Data</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Export all your resume analyses and account info
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => toast.success("Download link sent to your email")}
                    >
                      <Download className="w-3 h-3 mr-1" />
                      Export
                    </Button>
                  </div>

                  <div className="flex items-center justify-between py-3 border-b border-border/50">
                    <div>
                      <p className="text-sm font-medium text-foreground">Resume Data Retention</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Your resume files are automatically deleted after 90 days
                      </p>
                    </div>
                    <Badge variant="secondary" className="text-xs">90 days</Badge>
                  </div>

                  {/* Danger zone */}
                  <div className="pt-4 border-t border-destructive/20 mt-2">
                    <p className="text-sm font-semibold text-destructive mb-3">Danger Zone</p>
                    <form
                      className="space-y-4 rounded-xl border border-destructive/20 bg-destructive/5 p-4"
                      onSubmit={deleteConfirmationForm.handleSubmit(() => {
                        toast.error('Account deletion requires email confirmation');
                        deleteConfirmationForm.reset({
                          confirmation: '' as unknown as 'DELETE',
                        });
                      })}
                    >
                      <div>
                        <p className="text-sm font-medium text-foreground">Delete Account</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Permanently delete your account and all associated data
                        </p>
                      </div>

                      <div className="space-y-2 max-w-sm">
                        <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 px-2">Type DELETE to confirm</label>
                        <input
                          type="text"
                          placeholder="DELETE"
                          className="w-full rounded-lg border border-destructive/30 bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-destructive/30"
                          {...deleteConfirmationForm.register('confirmation')}
                        />
                        {deleteConfirmationForm.formState.errors.confirmation && (
                          <p className="px-2 text-xs font-bold text-red-600">
                            {deleteConfirmationForm.formState.errors.confirmation.message}
                          </p>
                        )}
                      </div>

                      <Button
                        type="submit"
                        size="sm"
                        variant="danger"
                        disabled={!deleteConfirmationForm.formState.isValid || deleteConfirmationForm.formState.isSubmitting}
                      >
                        <Trash2 className="w-3 h-3 mr-1" />
                        Delete
                      </Button>
                    </form>
                  </div>
                </div>
              </SectionCard>
            </motion.div>

            {/* Save notification */}
            <motion.div variants={itemVariants} className="pb-8">
              <p className="text-xs text-center text-muted-foreground">
                Changes are saved automatically - ApnaResume © 2026
              </p>
            </motion.div>
          </motion.div>
        </main>
      </div>
    </div>
  );
}
