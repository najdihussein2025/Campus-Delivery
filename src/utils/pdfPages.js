// Printing files: type/size validation and best-effort PDF page detection. Pure (the file reader is injected).
export const MAX_FILE_BYTES = 25 * 1024 * 1024;
export const MAX_PDF_SCAN_BYTES = 10 * 1024 * 1024;
export const PICKER_TYPES = [
  'application/pdf',
  'image/*',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

// 'pdf' | 'word' | 'image' | null (checks the MIME type first, then the extension)
export const fileKind = ({ name = '', mimeType = '' }) => {
  const mime = (mimeType || '').toLowerCase();
  const ext = name.toLowerCase().split('.').pop();
  if (mime === 'application/pdf' || ext === 'pdf') return 'pdf';
  if (mime.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp', 'heic'].includes(ext)) return 'image';
  if (mime === 'application/msword' || mime.includes('wordprocessingml') || ['doc', 'docx'].includes(ext)) return 'word';
  return null;
};

export const formatFileSize = (bytes) => {
  if (!bytes && bytes !== 0) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

// Returns an error message, or '' when the file is fine
export const validateFile = (file) => {
  if (!fileKind(file)) return 'Only PDF, Word or image files';
  if (file.size && file.size > MAX_FILE_BYTES) {
    return `This file is ${Math.round(file.size / (1024 * 1024))} MB, the limit is 25 MB`;
  }
  return '';
};

const MAX_PAGES = 2000;

// Largest "/Count N" of a "/Type /Pages" node, else the number of "/Type /Page" objects. null when unknown.
export const countPagesInPdfText = (text) => {
  let best = 0;
  let leaves = 0;
  text.split('endobj').forEach((obj) => {
    if (/\/Type\s*\/Pages\b/.test(obj)) {
      const m = /\/Count\s+(\d+)/.exec(obj);
      if (m) best = Math.max(best, parseInt(m[1], 10));
    } else if (/\/Type\s*\/Page(?![A-Za-z])/.test(obj)) {
      leaves += 1;
    }
  });
  const pages = best || leaves;
  return pages >= 1 && pages <= MAX_PAGES ? pages : null;
};

// Never throws and never blocks: images = 1, small PDFs are scanned, everything else returns null
export const detectPages = async (file, readBase64) => {
  try {
    const kind = fileKind(file);
    if (kind === 'image') return 1;
    if (kind !== 'pdf' || !file.size || file.size > MAX_PDF_SCAN_BYTES) return null;
    const base64 = await readBase64(file.uri);
    return countPagesInPdfText(atob(base64));
  } catch (error) {
    console.log('Page detection skipped', error.message);
    return null;
  }
};
