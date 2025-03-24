import { NextResponse } from 'next/server';
import {
  StorageSharedKeyCredential,
  ContainerSASPermissions
 
} from "@azure/storage-blob";
import { getContainerSas } from '@/lib/blobUtils';

const DEMO_FILES_WHITELIST = [
  // Add your demo PDF filenames here
  '0b5bf3a0-314a-46c1-b6cc-d8710cbab678_question.pdf',
  '0b5bf3a0-314a-46c1-b6cc-d8710cbab678_solution.pdf',
  '1a9e1115-9bdf-4134-aa1a-2b6c01c57e86_question.pdf',
  '1a9e1115-9bdf-4134-aa1a-2b6c01c57e86_solution.pdf',
  '1a350a2b-7126-47f8-bfcb-69d241c1a513_question.pdf',
  '1a350a2b-7126-47f8-bfcb-69d241c1a513_solution.pdf',
  '0bb7ae26-e23b-41b0-894e-45f02699073d_question.pdf',
  '0bb7ae26-e23b-41b0-894e-45f02699073d_solution.pdf',
  '1be78cdc-5c8a-449a-9741-4be2c2914a7b_question.pdf',
  '1be78cdc-5c8a-449a-9741-4be2c2914a7b_solution.pdf',
];

const account = process.env.AZURE_STORAGE_ACCOUNT_NAME as string;
const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME as string;
const key = process.env.AZURE_STORAGE_ACCOUNT_KEY as string;

if (!account || !containerName || !key) {
  throw new Error('Missing required environment variables for Azure Storage');
}

export async function POST(request: Request) {
  try {
    const { file } = await request.json();

    if (!file || !DEMO_FILES_WHITELIST.includes(file)) {
      return NextResponse.json(
        { error: 'Invalid demo file request' },
        { status: 403 }
      );
    }

        const sharedKeyCred = new StorageSharedKeyCredential(account, key);
        const permission = ContainerSASPermissions.parse("r");
        const sas = getContainerSas(
          containerName,
          sharedKeyCred,
          null,
          permission,
          "attachment",
          new Date(new Date().getTime() + 60 * 1000) // 1 minute
        );

    const downloadLink = `https://${account}.blob.core.windows.net/${containerName}/${file}?${sas}`;

    return NextResponse.json({ downloadLink }, { status: 200 });
  } catch (error) {
    console.error('Demo PDF proxy error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
