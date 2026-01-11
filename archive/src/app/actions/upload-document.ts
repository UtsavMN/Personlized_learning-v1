'use server';

import { z } from 'zod';
import * as fs from 'fs';
import * as path from 'path';

// Dynamically import pdfParse to avoid server-side issues
let pdfParse: any = null;

async function getPdfParser() {
  if (!pdfParse) {
    try {
      const module = await import('pdf-parse');
      pdfParse = module.default;
    } catch (error) {
      console.warn('pdf-parse module not available, will skip text extraction');
    }
  }
  return pdfParse;
}

// Local storage directory for uploaded documents
const DOCUMENTS_DIR = path.join(process.cwd(), 'public', 'uploads', 'documents');
const METADATA_FILE = path.join(process.cwd(), 'public', 'uploads', 'documents.json');

// Ensure upload directory exists
async function ensureUploadDir() {
  if (!fs.existsSync(DOCUMENTS_DIR)) {
    fs.mkdirSync(DOCUMENTS_DIR, { recursive: true });
  }
}

// Load all documents metadata
async function loadDocuments(): Promise<any[]> {
  try {
    if (fs.existsSync(METADATA_FILE)) {
      const data = fs.readFileSync(METADATA_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.warn('Error loading documents metadata:', error);
  }
  return [];
}

// Save documents metadata
async function saveDocuments(documents: any[]) {
  fs.writeFileSync(METADATA_FILE, JSON.stringify(documents, null, 2), 'utf-8');
}

// Updated schema to not use `instanceof File` which is problematic in server actions.
const formSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters.'),
  description: z.string().min(10, 'Description must be at least 10 characters.'),
});

export async function uploadDocumentAction(prevState: any, formData: FormData) {
  try {
    await ensureUploadDir();

    const validatedFields = formSchema.safeParse({
      title: formData.get('title'),
      description: formData.get('description'),
    });
    
    if (!validatedFields.success) {
      return {
        success: false,
        message: 'Validation failed.',
        errors: validatedFields.error.flatten().fieldErrors,
      };
    }
    
    const documentFile = formData.get('documentFile') as File | null;
    
    // Manual validation for the file
    if (!documentFile || typeof documentFile === 'string' || documentFile.size === 0) {
      return { success: false, message: 'PDF file is required.', errors: { documentFile: ['PDF file is required.'] } };
    }
    if (documentFile.type !== 'application/pdf') {
       return { success: false, message: 'Only .pdf files are accepted.', errors: { documentFile: ['Only .pdf files are accepted.'] } };
    }

    const { title, description } = validatedFields.data;

    // Convert file to buffer for PDF parsing
    const arrayBuffer = await documentFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    let fileContent = '';
    try {
      // Extract text from PDF
      const parser = await getPdfParser();
      if (parser) {
        const pdfData = await parser(buffer);
        fileContent = pdfData.text || '';
      } else {
        fileContent = `[PDF file: ${documentFile.name}] - PDF parser unavailable.`;
      }
    } catch (pdfError) {
      console.warn('PDF parsing failed, storing file without text extraction:', pdfError);
      fileContent = `[PDF file: ${documentFile.name}] - Text extraction failed. Please manually review the file.`;
    }

    // Generate unique filename
    const timestamp = Date.now();
    const safeFilename = `${timestamp}-${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`;
    const filePath = path.join(DOCUMENTS_DIR, safeFilename);
    
    // Save PDF file locally
    fs.writeFileSync(filePath, buffer);
    
    // Load existing documents and add new one
    const documents = await loadDocuments();
    const newDoc = {
      id: `doc-${timestamp}`,
      filename: documentFile.name,
      storedFilename: safeFilename,
      uploadDate: new Date().toISOString(),
      mimeType: documentFile.type,
      fileSize: documentFile.size,
      storageLocation: 'local-filesystem',
      title: title,
      description: description,
      content: fileContent.substring(0, 50000), // Limit to 50k chars
      contentPreview: fileContent.substring(0, 500), // First 500 chars for preview
    };
    
    documents.push(newDoc);
    await saveDocuments(documents);

    return { success: true, message: `Document "${title}" uploaded successfully (stored locally).`, docId: newDoc.id, errors: {} };
  } catch (error: any) {
    console.error('Error in uploadDocumentAction:', error);
    
    return {
      success: false,
      message: `Server Error: ${error.message || 'An unexpected error occurred.'}`,
      errors: {},
    };
  }
}
