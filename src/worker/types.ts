// Cloudflare Workers Type Declarations for D1 & R2
export interface D1Database {
  prepare(query: string): D1PreparedStatement;
  dump(): Promise<ArrayBuffer>;
  batch<T = unknown>(statements: D1PreparedStatement[]): Promise<D1Result<T>[]>;
  exec(query: string): Promise<D1ExecResult>;
}

export interface D1PreparedStatement {
  bind(...values: any[]): D1PreparedStatement;
  first<T = unknown>(colName?: string): Promise<T | null>;
  run<T = unknown>(): Promise<D1Result<T>>;
  all<T = unknown>(): Promise<D1Result<T>>;
  raw<T = unknown>(): Promise<T[]>;
}

export interface D1Result<T = unknown> {
  results?: T[];
  success: boolean;
  error?: string;
  meta: any;
}

export interface D1ExecResult {
  count: number;
  duration: number;
}

export interface R2Bucket {
  get(key: string): Promise<R2ObjectBody | null>;
  put(key: string, value: any, options?: any): Promise<R2Object>;
  delete(keys: string | string[]): Promise<void>;
  list(options?: any): Promise<any>;
}

export interface R2Object {
  key: string;
  version: string;
  size: number;
  etag: string;
  httpEtag: string;
  customMetadata?: Record<string, string>;
  writeHttpMetadata(headers: Headers): void;
}

export interface R2ObjectBody extends R2Object {
  body: ReadableStream;
}

export interface ExecutionContext {
  waitUntil(promise: Promise<any>): void;
  passThroughOnException(): void;
}

export interface Env {
  DB: D1Database;
  PAPERS_BUCKET: R2Bucket;
  AI?: any;
  ENVIRONMENT?: string;
  MAX_UPLOAD_SIZE_BYTES?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  meta?: any;
}
