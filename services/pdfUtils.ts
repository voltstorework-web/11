
import type { GeneratePdfOptions } from '../types';

// pdf.js is loaded from CDN as a module, so we need to access its exports this way.
// @ts-ignore
const { pdfjsLib } = globalThis;
if (pdfjsLib) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.3.136/pdf.worker.min.mjs`;
}

// pdf-lib is loaded from CDN and attached to the window object.
// @ts-ignore
const { PDFDocument } = window.PDFLib;

interface CropOptions {
    widthPercent: number;
    heightPercent: number;
}

// This function is kept for generating the live preview image
export const renderCroppedPdfPagesToDataUrls = async (file: File, cropOptions: CropOptions): Promise<string[]> => {
    if (!pdfjsLib) {
        throw new Error('PDF.js library is not loaded.');
    }
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const dataUrls: string[] = [];
    
    const fullPageCanvas = document.createElement('canvas');
    const fullPageContext = fullPageCanvas.getContext('2d');
    const croppedCanvas = document.createElement('canvas');
    const croppedContext = croppedCanvas.getContext('2d');

    if (!fullPageContext || !croppedContext) {
        throw new Error('Could not create canvas context');
    }

    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 2.0 });

        fullPageCanvas.height = viewport.height;
        fullPageCanvas.width = viewport.width;
        await page.render({ canvasContext: fullPageContext, viewport }).promise;

        const cropWidth = fullPageCanvas.width * (cropOptions.widthPercent / 100);
        const cropHeight = fullPageCanvas.height * (cropOptions.heightPercent / 100);
        
        croppedCanvas.width = cropWidth;
        croppedCanvas.height = cropHeight;

        croppedContext.drawImage(fullPageCanvas, 0, 0, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);

        dataUrls.push(croppedCanvas.toDataURL('image/png'));
    }

    fullPageCanvas.remove();
    croppedCanvas.remove();

    return dataUrls;
};

const CM_TO_POINTS = 28.3465;

// New generateLabelsPdf using pdf-lib for vector quality
export const generateLabelsPdf = async (options: GeneratePdfOptions, codesPdfFile: File): Promise<void> => {
    const { imageDataUrl, imageType, codeScale, marginTopCm, imagePositionCm, cropWidthPercent, cropHeightPercent } = options;

    if (!PDFDocument) {
        throw new Error('pdf-lib library is not loaded.');
    }

    const PAGE_WIDTH_PT = 3.5 * CM_TO_POINTS;
    const PAGE_HEIGHT_PT = 15 * CM_TO_POINTS;

    const sourcePdfBytes = await codesPdfFile.arrayBuffer();
    const sourcePdfDoc = await PDFDocument.load(sourcePdfBytes);
    const outputPdfDoc = await PDFDocument.create();

    const imageBytes = await fetch(imageDataUrl).then(res => res.arrayBuffer());
    let userImage;
    if (imageType === 'JPEG') {
        userImage = await outputPdfDoc.embedJpg(imageBytes);
    } else {
        userImage = await outputPdfDoc.embedPng(imageBytes);
    }
    const userImageAspectRatio = userImage.width / userImage.height;
    const userImageWidthPt = PAGE_WIDTH_PT * 0.9;
    const userImageHeightPt = userImageWidthPt / userImageAspectRatio;
    const userImageXPt = (PAGE_WIDTH_PT - userImageWidthPt) / 2;
    const imagePositionYPt = PAGE_HEIGHT_PT - (imagePositionCm * CM_TO_POINTS) - userImageHeightPt;

    for (const sourcePage of sourcePdfDoc.getPages()) {
        const targetPage = outputPdfDoc.addPage([PAGE_WIDTH_PT, PAGE_HEIGHT_PT]);
        const { width: sourceWidth, height: sourceHeight } = sourcePage.getSize();

        // Use embedPage with a clipping box to extract the desired portion of the source page.
        // This is more robust than manual clipping paths.
        const embeddedPage = await outputPdfDoc.embedPage(sourcePage, {
            left: 0,
            right: sourceWidth * (cropWidthPercent / 100),
            bottom: sourceHeight * (1 - (cropHeightPercent / 100)),
            top: sourceHeight,
        });

        const cropWidthPt = sourceWidth * (cropWidthPercent / 100);
        const cropHeightPt = sourceHeight * (cropHeightPercent / 100);
        const cropAspectRatio = cropWidthPt / cropHeightPt;

        const targetCodeWidthPt = (PAGE_WIDTH_PT * 0.95) * codeScale;
        const targetCodeHeightPt = targetCodeWidthPt / cropAspectRatio;
        
        const targetCodeXPt = (PAGE_WIDTH_PT - targetCodeWidthPt) / 2;
        const targetCodeYPt = PAGE_HEIGHT_PT - (marginTopCm * CM_TO_POINTS) - targetCodeHeightPt;
        
        // Corrected: Use `drawPage` instead of `drawForm` to render the embedded page.
        targetPage.drawPage(embeddedPage, {
            x: targetCodeXPt,
            y: targetCodeYPt,
            width: targetCodeWidthPt,
            height: targetCodeHeightPt,
        });

        // Draw the user-supplied image
        targetPage.drawImage(userImage, {
            x: userImageXPt,
            y: imagePositionYPt,
            width: userImageWidthPt,
            height: userImageHeightPt,
        });
    }

    const pdfBytes = await outputPdfDoc.save();
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    const originalName = codesPdfFile.name.replace(/\.pdf$/i, "");
    link.download = `${originalName}_edited.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
};
