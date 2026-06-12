export type SelectedImage = {
  id: string;
  file: File;
  previewUrl: string;
};

export type UploadProgress = {
  label: string;
  detail: string;
  current: number;
  total: number;
};

