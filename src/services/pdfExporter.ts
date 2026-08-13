import { jsPDF } from 'jspdf';
import { QuestionPaper } from '../types';

/**
 * Converts multi-page image scans into a single downloadable PDF booklet
 */
export async function exportPaperToPdf(paper: QuestionPaper): Promise<void> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pages = paper.pages && paper.pages.length > 0 ? paper.pages : [paper.file_data_url || ''];
  const validPages = pages.filter(Boolean);

  if (validPages.length === 0) {
    throw new Error('No page scan data available to generate PDF');
  }

  for (let i = 0; i < validPages.length; i++) {
    if (i > 0) {
      doc.addPage('a4', 'portrait');
    }

    const pageUrl = validPages[i];
    const imgProps = await getImageDimensions(pageUrl);

    // Calculate scaling to fit A4 page margins (210mm x 297mm)
    const margin = 10;
    const pageWidth = 210 - margin * 2;
    const pageHeight = 297 - margin * 2 - 15; // 15mm header space

    const ratio = Math.min(pageWidth / imgProps.width, pageHeight / imgProps.height);
    const renderWidth = imgProps.width * ratio;
    const renderHeight = imgProps.height * ratio;
    const xOffset = margin + (pageWidth - renderWidth) / 2;
    const yOffset = margin + 12;

    // Header text
    doc.setFontSize(10);
    doc.setTextColor(50, 50, 50);
    doc.text(`${paper.course_code}: ${paper.subject_name || 'Question Paper'}`, margin, margin + 4);
    doc.text(
      `${paper.exam_type_name || 'Exam'} (${paper.session_year}) • Page ${i + 1}/${validPages.length}`,
      210 - margin,
      margin + 4,
      { align: 'right' }
    );

    // Line divider
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    doc.line(margin, margin + 6, 210 - margin, margin + 6);

    // Draw image
    doc.addImage(pageUrl, 'JPEG', xOffset, yOffset, renderWidth, renderHeight, undefined, 'FAST');
  }

  doc.save(`${paper.course_code}_${paper.exam_type_name || 'Exam'}_${paper.session_year}_Booklet.pdf`);
}

function getImageDimensions(src: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.width, height: img.height });
    img.onerror = () => resolve({ width: 800, height: 1100 });
    img.src = src;
  });
}
