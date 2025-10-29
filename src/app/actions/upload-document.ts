
'use server';

import { z } from 'zod';
import { getFirestore, addDoc, collection } from 'firebase/firestore';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { firebaseConfig } from '@/firebase/config';

// Since this is a server action, we need to initialize Firebase on the server.
// This is different from the client-side initialization.
function getFirebaseServer() {
    if (!getApps().length) {
        return initializeApp(firebaseConfig);
    }
    return getApp();
}

const firebaseApp = getFirebaseServer();
const firestore = getFirestore(firebaseApp);


const ACCEPTED_FILE_TYPES = ['application/pdf'];

const formSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters.'),
  description: z.string().min(10, 'Description must be at least 10 characters.'),
  documentFile: z
    .any()
    .refine((file) => file, 'PDF file is required.')
    .refine(
      (file) => file && ACCEPTED_FILE_TYPES.includes(file.type),
      'Only .pdf files are accepted.'
    ),
});

async function getPdfText(file: File): Promise<string> {
  const pdf = require('pdf-parse');
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const data = await pdf(buffer);
  return data.text;
}

export async function uploadDocumentAction(formData: FormData) {
  try {
    const values = {
      title: formData.get('title'),
      description: formData.get('description'),
      documentFile: formData.get('documentFile'),
    };

    const validatedFields = formSchema.safeParse(values);

    if (!validatedFields.success) {
      return {
        success: false,
        error: validatedFields.error.flatten().fieldErrors,
      };
    }
    
    const { title, description, documentFile } = validatedFields.data;

    const fileContent = await getPdfText(documentFile);

    const documentsCollection = collection(firestore, 'documents');

    const docRef = await addDoc(documentsCollection, {
      filename: documentFile.name,
      uploadDate: new Date().toISOString(),
      mimeType: documentFile.type,
      storageLocation: 'firestore', // Placeholder
      title: title,
      description: description,
      content: fileContent,
    });

    return { success: true, docId: docRef.id };
  } catch (error: any) {
    console.error('Error uploading document:', error);
    return {
      success: false,
      error: { _server: [error.message || 'An unexpected error occurred while processing the document.'] },
    };
  }
}
