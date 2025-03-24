import {
  StorageSharedKeyCredential,
  ContainerSASPermissions
} from "@azure/storage-blob";
import { NextResponse } from 'next/server';
import { getContainerSas } from "@/lib/blobUtils";


const account = process.env.AZURE_STORAGE_ACCOUNT_NAME as string;
const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME as string;
const key = process.env.AZURE_STORAGE_ACCOUNT_KEY as string;

if (!account || !containerName || !key) {
  throw new Error('Missing required environment variables for Azure Storage');
}

export async function POST(request: Request) {
  try {
    const { file } = await request.json();

    if (!file) {
      return NextResponse.json(
        { error: 'File parameter is required' },
        { status: 400 }
      );
    }

    const sharedKeyCred = new StorageSharedKeyCredential(account, key);
    const permission = ContainerSASPermissions.parse("r");
    const sas = getContainerSas(
      containerName,
      sharedKeyCred,
      null,
      permission,
      "attachment"
    );

    const downloadLink = `https://${account}.blob.core.windows.net/${containerName}/${file}?${sas}`;

    return NextResponse.json(
      { downloadLink },
      { status: 200 }
    );

  } catch (error) {
    console.error('Generate file shared key error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
