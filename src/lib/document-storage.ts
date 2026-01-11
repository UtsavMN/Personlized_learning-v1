// Local document storage utilities
// Documents are stored in Firestore as Base64-encoded PDFs (completely free, no Cloud Storage costs)

export async function downloadDocumentFromFirestore(pdfBase64: string, filename: string) {
  try {
    // Convert Base64 to Blob
    const binaryString = atob(pdfBase64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    const blob = new Blob([bytes], { type: 'application/pdf' });

    // Create download link
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename || 'document.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error downloading document:', error);
    throw new Error('Failed to download document');
  }
}

export async function viewDocumentInNewTab(pdfBase64: string, filename: string) {
  try {
    // Convert Base64 to Blob
    const binaryString = atob(pdfBase64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    const blob = new Blob([bytes], { type: 'application/pdf' });

    // Create preview URL
    const url = window.URL.createObjectURL(blob);
    window.open(url, '_blank');
    // Note: URL will be revoked after a delay to avoid issues
    setTimeout(() => window.URL.revokeObjectURL(url), 1000);
  } catch (error) {
    console.error('Error viewing document:', error);
    throw new Error('Failed to view document');
  }
}
