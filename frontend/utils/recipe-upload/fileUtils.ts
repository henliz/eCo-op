export const detectFileType = (file: File): 'pdf' | 'image' | 'unsupported' => {
  // Check by MIME type first
  if (file.type === 'application/pdf') return 'pdf';
  if (file.type.startsWith('image/')) return 'image';

  // Fallback to extension
  const extension = file.name.toLowerCase().split('.').pop();
  if (extension === 'pdf') return 'pdf';
  if (['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp'].includes(extension || '')) return 'image';

  return 'unsupported';
};

export const formatFileSize = (bytes: number): string => {
  return (bytes / 1024 / 1024).toFixed(2) + ' MB';
};

export const debugLog = (step: string, data?: any) => {
  console.log(`[RecipeUpload] ${step}:`, data);
};