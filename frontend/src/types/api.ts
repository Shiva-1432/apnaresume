export interface ErrorEnvelope {
  message: string;
  code: string;
}

export interface ApiError {
  status: number;
  error: ErrorEnvelope;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: ErrorEnvelope;
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: PaginationMeta;
  error?: ErrorEnvelope;
}
