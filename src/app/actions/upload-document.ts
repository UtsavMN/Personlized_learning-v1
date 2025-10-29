'use server';

import { z } from 'zod';
import { getFirestore, addDoc, collection } from 'firebase/firestore';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { firebaseConfig } from '@/firebase/config';

// This function initializes Firebase within the server action's scope.
function getFirebaseServer() {
  if (!getApps().length) {
    return initializeApp(firebaseConfig);
  }
  return getApp();
}

// Updated schema to not use `instanceof File` which is problematic in server actions.
const formSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters.'),
  description: z.string().min(10, 'Description must be at least 10 characters.'),
});

export async function uploadDocumentAction(prevState: any, formData: FormData) {
  try {
    const firebaseApp = getFirebaseServer();
    const firestore = getFirestore(firebaseApp);

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

    // The content is placeholder as pdf-parse was causing issues.
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
    // Return a specific error message to avoid the generic "unexpected response"
    return {
      success: false,
      message: `Server Error: ${error.message || 'An unexpected error occurred.'}`,
      errors: {},
    };
  }
}
