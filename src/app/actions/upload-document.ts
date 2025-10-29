'use server';

import { z } from 'zod';
import { getFirestore, addDoc, collection } from 'firebase/firestore';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { firebaseConfig } from '@/firebase/config';

// This function initializes Firebase within the server action's scope,
// which is a more stable pattern.
function getFirebaseServer() {
  if (!getApps().length) {
    return initializeApp(firebaseConfig);
  }
  return getApp();
}

const formSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters.'),
  description: z.string().min(10, 'Description must be at least 10 characters.'),
  documentFile: z
    .any()
    .refine((file): file is File => file instanceof File && file.name !== 'undefined', 'PDF file is required.')
    .refine(
      (file) => file && file.type === 'application/pdf',
      'Only .pdf files are accepted.'
    ),
});

export async function uploadDocumentAction(prevState: any, formData: FormData) {
  try {
    // Lazily initialize Firebase services inside the action
    const firebaseApp = getFirebaseServer();
    const firestore = getFirestore(firebaseApp);

    const validatedFields = formSchema.safeParse({
      title: formData.get('title'),
      description: formData.get('description'),
      documentFile: formData.get('documentFile'),
    });

    if (!validatedFields.success) {
      return {
        success: false,
        message: 'Validation failed.',
        errors: validatedFields.error.flatten().fieldErrors,
      };
    }

    const { title, description, documentFile } = validatedFields.data;

    const fileContent = 'Manually add PDF content here in Firestore.';

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

    return { success: true, message: `Document "${title}" uploaded successfully.`, docId: docRef.id, errors: {} };
  } catch (error: any) {
    console.error('Error in uploadDocumentAction:', error);
    return {
      success: false,
      message: error.message || 'An unexpected server error occurred.',
      errors: {},
    };
  }
}
