export interface GeneratePdfOptions {
  imageDataUrl: string;
  imageType: 'JPEG' | 'PNG' | 'WEBP';
  codeScale: number;
  marginTopCm: number;
  imagePositionCm: number;
  cropWidthPercent: number;
  cropHeightPercent: number;
}
