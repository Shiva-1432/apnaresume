export type ResumeCacheItem = {
  _id?: string;
  id?: string;
  starred?: boolean;
  is_deleted?: boolean;
  deleted_at?: string | Date | null;
  created_at?: string | Date | null;
  updated_at?: string | Date | null;
  [key: string]: unknown;
};

export function getResumeCacheId(resume: ResumeCacheItem): string {
  return String(resume._id || resume.id || "").trim();
}

export function removeResumeFromCache<T extends ResumeCacheItem>(
  items: T[],
  resumeId: string
) {
  return items.filter((item) => getResumeCacheId(item) !== resumeId);
}

export function upsertResumeToFront<T extends ResumeCacheItem>(
  items: T[],
  resume: T
) {
  const resumeId = getResumeCacheId(resume);
  const nextItems = items.filter((item) => getResumeCacheId(item) !== resumeId);
  nextItems.unshift(resume);
  return nextItems;
}

export function toggleStarInCache<T extends ResumeCacheItem>(
  items: T[],
  resumeId: string,
  currentStarred: boolean
) {
  return items.map((item) =>
    getResumeCacheId(item) === resumeId
      ? { ...item, starred: !currentStarred }
      : item
  );
}

export function markDeletedInCache<T extends ResumeCacheItem>(resume: T) {
  return {
    ...resume,
    is_deleted: true,
    deleted_at: new Date().toISOString(),
  };
}

export function markRestoredInCache<T extends ResumeCacheItem>(resume: T) {
  return {
    ...resume,
    is_deleted: false,
    deleted_at: null,
  };
}