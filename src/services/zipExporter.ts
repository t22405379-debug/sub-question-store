import JSZip from 'jszip';
import { QuestionPaper } from '../types';

/**
 * Bundles multiple question papers into a single downloadable .zip study pack
 */
export async function downloadPapersAsZip(
  papers: QuestionPaper[],
  zipFilename = 'Question_Papers_Study_Pack.zip'
): Promise<void> {
  const zip = new JSZip();

  for (let i = 0; i < papers.length; i++) {
    const paper = papers[i];
    const pages = paper.pages && paper.pages.length > 0 ? paper.pages : [paper.file_data_url || ''];

    for (let pIdx = 0; pIdx < pages.length; pIdx++) {
      const dataUrl = pages[pIdx];
      if (!dataUrl) continue;

      const base64Data = dataUrl.split(',')[1];
      if (!base64Data) continue;

      const ext = dataUrl.includes('image/png')
        ? 'png'
        : dataUrl.includes('application/pdf')
        ? 'pdf'
        : 'jpg';

      const pageSuffix = pages.length > 1 ? `_p${pIdx + 1}` : '';
      const safeCode = (paper.course_code || 'PAPER').replace(/[^a-zA-Z0-9_-]/g, '_');
      const safeExam = (paper.exam_type_name || 'Exam').replace(/[^a-zA-Z0-9_-]/g, '_');
      const safeSession = (paper.session_year || '2025').replace(/[^a-zA-Z0-9_-]/g, '_');

      const fileName = `${safeCode}_${safeExam}_${safeSession}${pageSuffix}.${ext}`;
      zip.file(fileName, base64Data, { base64: true });
    }
  }

  const content = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(content);
  const link = document.createElement('a');
  link.href = url;
  link.download = zipFilename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
