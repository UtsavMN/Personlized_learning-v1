import { NextRequest, NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';

const DOCUMENTS_DIR = path.join(process.cwd(), 'public', 'uploads', 'documents');
const METADATA_FILE = path.join(process.cwd(), 'public', 'uploads', 'documents.json');

// Ensure upload directory exists
function ensureUploadDir() {
  if (!fs.existsSync(DOCUMENTS_DIR)) {
    fs.mkdirSync(DOCUMENTS_DIR, { recursive: true });
  }
}

// Load all documents metadata
function loadDocuments(): any[] {
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
function saveDocuments(documents: any[]) {
  fs.writeFileSync(METADATA_FILE, JSON.stringify(documents, null, 2), 'utf-8');
}

// Dynamically import pdfParse
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

export async function POST(request: NextRequest) {
  try {
    ensureUploadDir();

    const formData = await request.formData();
    const documentFile = formData.get('documentFile') as File | null;
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;

    // Validation
    if (!documentFile || !title || !description) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (documentFile.type !== 'application/pdf') {
      return NextResponse.json(
        { success: false, message: 'Only .pdf files are accepted.' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const buffer = Buffer.from(await documentFile.arrayBuffer());

    // Extract PDF text
    let fileContent = '';
    try {
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
    const documents = loadDocuments();
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
    saveDocuments(documents);

    return NextResponse.json(
      { success: true, message: `Document "${title}" uploaded successfully.`, docId: newDoc.id },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error uploading document:', error);
    return NextResponse.json(
      { success: false, message: `Server Error: ${error.message || 'An unexpected error occurred.'}` },
      { status: 500 }
    );
  }
}
