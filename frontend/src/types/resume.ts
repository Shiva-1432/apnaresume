export type ResumeStatus = 'active' | 'deleted' | 'analyzing';

export type ResumeFormat =
  | 'pdf'
  | 'doc'
  | 'docx'
  | 'txt'
  | 'rtf'
  | 'jpg'
  | 'jpeg'
  | 'png'
  | 'other';

export interface Resume {
  id: string;
  userId: string;
  title: string;
  fileName: string;
  format: ResumeFormat;
  status: ResumeStatus;
  version: number;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}
