"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { type UndoQueueEntry } from "@/hooks/useUndo";

type DeletedResumeUndoPanelProps<T> = {
  entries: UndoQueueEntry<T>[];
  onUndo: (queueKey: string) => void;
  onRetry: (queueKey: string) => void;
};

const TOTAL_MS = 8000;
const RADIUS = 14;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function CountdownRing({ remainingMs }: { remainingMs: number }) {
  const progress = Math.max(0, Math.min(1, remainingMs / TOTAL_MS));
  const dashOffset = CIRCUMFERENCE * (1 - progress);

  return (
    <svg width="34" height="34" viewBox="0 0 34 34" className="shrink-0">
      <circle
        cx="17"
        cy="17"
        r={RADIUS}
        stroke="currentColor"
        strokeWidth="3"
        className="text-amber-200"
        fill="none"
      />
      <circle
        cx="17"
        cy="17"
        r={RADIUS}
        stroke="currentColor"
        strokeWidth="3"
        className="text-amber-600"
        fill="none"
        strokeDasharray={CIRCUMFERENCE}
        strokeDashoffset={dashOffset}
        strokeLinecap="round"
        transform="rotate(-90 17 17)"
      />
    </svg>
  );
}

export default function DeletedResumeUndoPanel<T>({
  entries,
  onUndo,
  onRetry,
}: DeletedResumeUndoPanelProps<T>) {
  if (entries.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <AnimatePresence initial={false}>
        {entries.map((entry) => (
          <motion.div
            key={entry.queueKey}
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 60 }}
            transition={{ duration: 0.25 }}
            className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 flex items-center justify-between gap-4"
          >
            <div className="flex items-center gap-3 min-w-0">
              <CountdownRing remainingMs={entry.remainingMs} />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-amber-900 truncate">
                  &quot;{entry.name}&quot; deleted
                </p>
                <p className="text-xs text-amber-800">
                  Undo available for {entry.secondsLeft}s
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                className="border-amber-300 text-amber-900 hover:bg-amber-100"
                onClick={() => onUndo(entry.queueKey)}
              >
                Undo
              </Button>
              {entry.restoreFailed && (
                <Button
                  size="sm"
                  className="bg-amber-700 text-white hover:bg-amber-800"
                  onClick={() => onRetry(entry.queueKey)}
                >
                  Retry
                </Button>
              )}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
