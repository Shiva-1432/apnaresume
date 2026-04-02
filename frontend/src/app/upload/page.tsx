"use client";

import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { AlertCircle, CheckCircle2, Upload, FileText, ArrowLeft, Loader2 } from "lucide-react";
import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

/**
 * ApnaResume Upload Resume Page
 *
 * Design Philosophy:
 * - Large, prominent drag-and-drop zone
 * - Clear file validation and error messages
 * - Visual feedback for all states
 * - Progress indication during upload
 * - Smooth transitions between states
 */

type UploadState = "idle" | "uploading" | "processing" | "success" | "error";

const uploadSchema = z.object({
  attachment: z
    .instanceof(File, { message: "Please choose a resume file" })
    .refine(
      (file) => ["application/pdf", "image/jpeg", "image/png"].includes(file.type),
      "Please upload a PDF or image file (JPG, PNG)"
    )
    .refine(
      (file) => file.size <= 10 * 1024 * 1024,
      "File size exceeds 10MB limit. Please choose a smaller file."
    ),
});

type UploadFormValues = z.infer<typeof uploadSchema>;

export default function UploadPage() {
  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [fileName, setFileName] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    trigger,
    formState: { errors },
  } = useForm<UploadFormValues>({
    resolver: zodResolver(uploadSchema),
    mode: "onChange",
  });

  const allowedFormats = ["application/pdf", "image/jpeg", "image/png"];
  const maxFileSize = 10 * 1024 * 1024;

  const validateFile = (file: File): boolean => {
    if (!allowedFormats.includes(file.type)) {
      setError("Please upload a PDF or image file (JPG, PNG)");
      return false;
    }
    if (file.size > maxFileSize) {
      setError("File size exceeds 10MB limit. Please choose a smaller file.");
      return false;
    }
    return true;
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      void setValue('attachment', file, { shouldDirty: true, shouldValidate: true });
      void trigger('attachment').then((isValid) => {
        if (isValid) {
          handleFileSelect(file);
          return;
        }

        setUploadState('error');
      });
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const simulateUpload = () => {
    setUploadState("uploading");
    setProgress(0);

    const uploadInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          clearInterval(uploadInterval);
          return prev;
        }
        return prev + Math.random() * 30;
      });
    }, 300);

    setTimeout(() => {
      clearInterval(uploadInterval);
      setProgress(100);
      setUploadState("processing");

      setTimeout(() => {
        setUploadState("success");
      }, 2000);
    }, 3000);
  };

  const handleRetry = () => {
    setUploadState("idle");
    setFileName("");
    setError("");
    setProgress(0);
    reset({ attachment: undefined });
    fileInputRef.current?.click();
  };

  const handleContinue = () => {
    router.push("/dashboard");
  };

  const handleFileSelect = (file: File) => {
    setError("");
    if (!validateFile(file)) {
      setUploadState("error");
      return;
    }

    setFileName(file.name);
    simulateUpload();
  };

  const startUpload = (values: UploadFormValues) => {
    handleFileSelect(values.attachment);
  };

  const handleBack = () => {
    if (window.history.length > 1) {
      router.back();
      return;
    }
    router.push("/home");
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="container flex items-center justify-between h-16 px-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <div className="flex items-center gap-3 group">
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black group-hover:rotate-12 transition-transform shadow-lg shadow-indigo-200">
                <span className="text-sm">A</span>
              </div>
              <h1 className="text-xl font-black tracking-tight text-neutral-900 group-hover:text-indigo-600 transition-colors font-syne">ApnaResume</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto max-w-5xl px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-8 max-w-3xl mx-auto"
        >
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold text-foreground">Upload Your Resume</h2>
            <p className="text-muted-foreground">
              Supported formats: PDF, JPG, PNG (Max 10MB)
            </p>
          </div>

          <div
            id="upload-area"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            className={`relative rounded-lg border-2 border-dashed transition-all ${
              uploadState === "idle"
                ? "border-primary/30 bg-primary/5 hover:border-primary/50 hover:bg-primary/10"
                : uploadState === "error"
                  ? "border-destructive/30 bg-destructive/5"
                  : "border-muted bg-muted/5"
            }`}
          >
            <Card className="border-0 bg-transparent shadow-none">
              <CardContent className="pt-12 pb-12">
                {uploadState === "idle" && (
                  <div className="text-center space-y-4 flex flex-col items-center">
                    <div className="flex justify-center mb-4">
                      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                        <Upload className="w-8 h-8 text-primary" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-foreground mb-2">
                        Drag and drop your resume
                      </h3>
                      <p className="text-muted-foreground mb-6">or click to browse your files</p>
                    </div>
                    <Button
                      size="lg"
                      className="inline-flex mx-auto bg-primary hover:bg-primary/90"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Choose File
                    </Button>
                    <Controller
                      control={control}
                      name="attachment"
                      render={({ field }) => (
                        <input
                          ref={(element) => {
                            field.ref(element);
                            fileInputRef.current = element;
                          }}
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          className="hidden"
                          onChange={(event) => {
                            const file = event.target.files?.[0];
                            field.onChange(file);
                            if (file) {
                              void handleSubmit(startUpload, () => {
                                setUploadState("error");
                              })();
                            }
                          }}
                        />
                      )}
                    />
                    {errors.attachment && (
                      <p className="text-xs font-bold text-red-600">{errors.attachment.message}</p>
                    )}
                  </div>
                )}

                {uploadState === "uploading" && (
                  <div className="text-center space-y-4">
                    <div className="flex justify-center mb-4">
                      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                        <Loader2 className="w-8 h-8 text-primary animate-spin" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-foreground mb-2">Uploading</h3>
                      <p className="text-muted-foreground text-sm mb-4">{fileName}</p>
                    </div>
                    <div className="space-y-2">
                      <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-gradient-to-r from-primary to-accent rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${progress}%` }}
                          transition={{ duration: 0.3 }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">{Math.round(progress)}%</p>
                    </div>
                  </div>
                )}

                {uploadState === "processing" && (
                  <div className="text-center space-y-4">
                    <div className="flex justify-center mb-4">
                      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                        <Loader2 className="w-8 h-8 text-primary animate-spin" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-foreground mb-2">
                        Analyzing your resume
                      </h3>
                      <p className="text-muted-foreground text-sm">
                        Our AI is reviewing your resume. This usually takes 2-5 seconds.
                      </p>
                    </div>
                  </div>
                )}

                {uploadState === "success" && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                    className="text-center space-y-4"
                  >
                    <div className="flex justify-center mb-4">
                      <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center">
                        <CheckCircle2 className="w-8 h-8 text-accent" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-foreground mb-2">
                        Analysis Complete!
                      </h3>
                      <p className="text-muted-foreground text-sm mb-6">
                        Your resume has been analyzed. Let&apos;s see your ATS score!
                      </p>
                    </div>
                    <Button
                      size="lg"
                      className="bg-primary hover:bg-primary/90"
                      onClick={handleContinue}
                    >
                      View Results
                      <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
                    </Button>
                  </motion.div>
                )}

                {uploadState === "error" && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                    className="text-center space-y-4"
                  >
                    <div className="flex justify-center mb-4">
                      <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
                        <AlertCircle className="w-8 h-8 text-destructive" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-foreground mb-2">Upload Failed</h3>
                      <p className="text-destructive text-sm mb-6">
                        {errors.attachment?.message || error || 'Please choose a valid file.'}
                      </p>
                    </div>
                    <Button
                      size="lg"
                      className="bg-primary hover:bg-primary/90"
                      onClick={handleRetry}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Try Again
                    </Button>
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-0 shadow-md">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    <FileText className="w-6 h-6 text-primary flex-shrink-0" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground text-sm">Supported Formats</p>
                    <p className="text-muted-foreground text-xs mt-1">PDF, JPG, PNG</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    <Upload className="w-6 h-6 text-primary flex-shrink-0" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground text-sm">File Size</p>
                    <p className="text-muted-foreground text-xs mt-1">Up to 10MB</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    <CheckCircle2 className="w-6 h-6 text-primary flex-shrink-0" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground text-sm">Processing Time</p>
                    <p className="text-muted-foreground text-xs mt-1">2-5 seconds</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="border-0 bg-muted/30">
            <CardHeader>
              <CardTitle className="text-base">Need Help?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>
                💡 <strong>Tip:</strong> Make sure your resume is clear and well-formatted for best results.
              </p>
              <p>
                📧 <strong>Support:</strong> Having issues? Contact us at support@annaresume.com
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  );
}
