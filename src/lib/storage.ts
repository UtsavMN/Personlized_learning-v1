import fs from 'fs-extra';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const UPLOAD_DIR = path.join(process.cwd(), 'data', 'uploads');

// Ensure upload directory exists
fs.ensureDirSync(UPLOAD_DIR);

export async function saveFile(file: File): Promise<{ filePath: string; fileName: string; fileSize: number; fileType: string }> {
    try {
        const buffer = Buffer.from(await file.arrayBuffer());
        // Create safe filename
        const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const fileName = `${uuidv4()}-${sanitizedName}`;
        const filePath = path.join(UPLOAD_DIR, fileName);

        await fs.writeFile(filePath, buffer);

        return {
            filePath,
            fileName: file.name,
            fileSize: file.size,
            fileType: file.type,
        };
    } catch (error) {
        console.error('Error saving file:', error);
        throw new Error('Failed to save file to storage');
    }
}

export async function deleteFile(filePath: string) {
    try {
        if (await fs.pathExists(filePath)) {
            await fs.remove(filePath);
        }
    } catch (error) {
        console.error('Error deleting file:', error);
    }
}

export function getAbsoluteFilePath(filePath: string) {
    // If it's already absolute (e.g. for testing), return it
    if (path.isAbsolute(filePath)) return filePath;
    // Otherwise join with upload dir? No, filePath stored should be full path or relative?
    // Let's assume we stored full path for simplicity in saving.
    return filePath;
}
