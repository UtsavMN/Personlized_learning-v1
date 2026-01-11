import { NextRequest, NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';

const METADATA_FILE = path.join(process.cwd(), 'public', 'uploads', 'documents.json');

export async function GET(request: NextRequest) {
  try {
    if (fs.existsSync(METADATA_FILE)) {
      const data = fs.readFileSync(METADATA_FILE, 'utf-8');
      const documents = JSON.parse(data);
      return NextResponse.json(documents);
    }
    return NextResponse.json([]);
  } catch (error) {
    console.error('Error reading documents:', error);
    return NextResponse.json([], { status: 500 });
  }
}
