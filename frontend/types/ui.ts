export interface UploadStatus {
  type: 'idle' | 'loading' | 'success' | 'error' | 'auth-required';
  message: string;
}