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


const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_FILE_TYPES = ['application/pdf'];

const formSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters.'),
  description: z.string().min(10, 'Description must be at least 10 characters.'),
  documentFile: z
    .any()
    .refine((file) => file, 'PDF file is required.')
    .refine((file) => file.size <= MAX_FILE_SIZE, `Max file size is 5MB.`)
    .refine(
      (file) => ACCEPTED_FILE_TYPES.includes(file.type),
      'Only .pdf files are accepted.'
    ),
});

async function getPdfText(file: File): Promise<string> {
  const pdf = (await import('pdf-parse/lib/pdf-parse')).default;
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const data = await pdf(buffer);
  return data.text;
}

export async function uploadDocumentAction(formData: FormData) {
  const values = {
    title: formData.get('title'),
    description: formData.get('description'),
    documentFile: formData.get('documentFile'),
  };

  const validatedFields = formSchema.safeParse(values);

  if (!validatedFields.success) {
    console.error('Validation failed:', validatedFields.error.flatten().fieldErrors);
    return {
      success: false,
      error: validatedFields.error.flatten().fieldErrors,
    };
  }
  
  const { title, description, documentFile } = validatedFields.data;

  try {
    const fileContent = await getPdfText(documentFile);

    const documentsCollection = collection(firestore, 'documents');

    await addDoc(documentsCollection, {
      filename: documentFile.name,
      uploadDate: new Date().toISOString(),
      mimeType: documentFile.type,
      storageLocation: 'firestore', // Placeholder
      title: title,
      description: description,
      content: fileContent,
    });

    return { success: true };
  } catch (error) {
    console.error('Error uploading document:', error);
    return {
      success: false,
      error: { _server: ['An unexpected error occurred.'] },
    };
  }
}
