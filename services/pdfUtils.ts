// We rely on the global window.pdfjsLib injected via index.html script tag
declare global {
  interface Window {
    pdfjsLib: any;
  }
}

export const convertPdfToImages = async (file: File, maxPages = 30): Promise<string[]> => {
  if (!window.pdfjsLib) {
    throw new Error("PDF.js not loaded");
  }

  // Set worker
  window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  
  const images: string[] = [];
  const count = Math.min(pdf.numPages, maxPages);

  for (let i = 1; i <= count; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 1.5 }); // 1.5 scale for decent OCR quality
    
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) continue;

    canvas.height = viewport.height;
    canvas.width = viewport.width;

    await page.render({
      canvasContext: context,
      viewport: viewport
    }).promise;

    // Convert to base64 (remove prefix for Gemini API usually, but keep for display)
    const base64 = canvas.toDataURL('image/png');
    // Return pure base64 for Gemini
    images.push(base64.split(',')[1]);
  }

  return images;
};