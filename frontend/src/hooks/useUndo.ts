"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

const COUNTDOWN_MS = 8000;
const MAX_VISIBLE = 5;

type QueueTimer = {
  confirmTimer: ReturnType<typeof setTimeout>;
};

export type UndoQueueEntry<T> = {
  queueKey: string;
  id: string;
  name: string;
  item: T;
  index: number;
  createdAt: number;
  expiresAt: number;
  remainingMs: number;
  secondsLeft: number;
  restoreFailed: boolean;
};

type EnqueueDeleteInput<T> = {
  id: string;
  name: string;
  item: T;
  index: number;
  onConfirmDelete: (id: string) => Promise<void>;
  onRestore: (id: string) => Promise<void>;
  onRestoreLocal: (entry: UndoQueueEntry<T>) => void;
};

type QueueActionCallbacks = {
  onConfirmDelete: (id: string) => Promise<void>;
  onRestore: (id: string) => Promise<void>;
  onRestoreLocal: (entry: UndoQueueEntry<any>) => void;
};

type InternalQueueEntry<T> = UndoQueueEntry<T> & QueueActionCallbacks;

export function useUndo<T>() {
  const [queue, setQueue] = useState<Array<InternalQueueEntry<T>>>([]);
  const queueRef = useRef<Array<InternalQueueEntry<T>>>([]);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timersRef = useRef<Map<string, QueueTimer>>(new Map());

  useEffect(() => {
    queueRef.current = queue;
  }, [queue]);

  const clearQueueTimer = useCallback((queueKey: string) => {
    const timer = timersRef.current.get(queueKey);
    if (!timer) {
      return;
    }

    clearTimeout(timer.confirmTimer);
    timersRef.current.delete(queueKey);
  }, []);

  const removeQueueEntry = useCallback((queueKey: string) => {
    setQueue((prev) => prev.filter((entry) => entry.queueKey !== queueKey));
    clearQueueTimer(queueKey);
  }, [clearQueueTimer]);

  const finalizeDelete = useCallback(async (queueKey: string) => {
    const target = queueRef.current.find((entry) => entry.queueKey === queueKey);
    if (!target) {
      return;
    }

    try {
      await target.onConfirmDelete(target.id);
      removeQueueEntry(queueKey);
    } catch {
      toast.error("Delete failed — resume kept");
      target.onRestoreLocal(target);
      removeQueueEntry(queueKey);
    }
  }, [removeQueueEntry]);

  const enqueueDelete = useCallback((input: EnqueueDeleteInput<T>) => {
    const now = Date.now();
    const queueKey = `${input.id}-${now}`;

    const nextEntry: InternalQueueEntry<T> = {
      queueKey,
      id: input.id,
      name: input.name,
      item: input.item,
      index: input.index,
      createdAt: now,
      expiresAt: now + COUNTDOWN_MS,
      remainingMs: COUNTDOWN_MS,
      secondsLeft: Math.ceil(COUNTDOWN_MS / 1000),
      restoreFailed: false,
      onConfirmDelete: input.onConfirmDelete,
      onRestore: input.onRestore,
      onRestoreLocal: input.onRestoreLocal as QueueActionCallbacks["onRestoreLocal"],
    };

    setQueue((prev) => [nextEntry, ...prev]);

    const confirmTimer = setTimeout(() => {
      finalizeDelete(queueKey).catch(() => {
        // finalizeDelete handles all user-visible error paths.
      });
    }, COUNTDOWN_MS);

    timersRef.current.set(queueKey, { confirmTimer });
    return queueKey;
  }, [finalizeDelete]);

  const undoDelete = useCallback(async (queueKey: string) => {
    const target = queueRef.current.find((entry) => entry.queueKey === queueKey);
    if (!target) {
      return;
    }

    try {
      await target.onRestore(target.id);
      target.onRestoreLocal(target);
      removeQueueEntry(queueKey);
    } catch {
      toast.error("Restore failed");
      setQueue((prev) => prev.map((entry) => (
        entry.queueKey === queueKey
          ? { ...entry, restoreFailed: true }
          : entry
      )));
    }
  }, [removeQueueEntry]);

  const retryRestore = useCallback(async (queueKey: string) => {
    await undoDelete(queueKey);
  }, [undoDelete]);

  useEffect(() => {
    const timers = timersRef.current;

    tickRef.current = setInterval(() => {
      const now = Date.now();
      setQueue((prev) => prev.map((entry) => {
        const remainingMs = Math.max(0, entry.expiresAt - now);
        return {
          ...entry,
          remainingMs,
          secondsLeft: Math.max(0, Math.ceil(remainingMs / 1000)),
        };
      }));
    }, 250);

    return () => {
      if (tickRef.current) {
        clearInterval(tickRef.current);
      }

      timers.forEach((timer) => {
        clearTimeout(timer.confirmTimer);
      });
      timers.clear();
    };
  }, []);

  const visibleQueue = useMemo(
    () => queue.slice(0, MAX_VISIBLE),
    [queue]
  );

  return {
    queue: visibleQueue,
    enqueueDelete,
    undoDelete,
    retryRestore,
  };
}
