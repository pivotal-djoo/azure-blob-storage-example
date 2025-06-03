import { BlobServiceClient } from '@azure/storage-blob';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING!;
const containerName = process.env.AZURE_CONTAINER_NAME!;

const blobServiceClient =
  BlobServiceClient.fromConnectionString(connectionString);
const containerClient = blobServiceClient.getContainerClient(containerName);

export async function uploadFileToBlob(
  fileName: string,
  buffer: Buffer
): Promise<void> {
  await containerClient.createIfNotExists();
  const blockBlobClient = containerClient.getBlockBlobClient(fileName);
  await blockBlobClient.uploadData(buffer);
}

export async function downloadFileFromBlob(
  fileName: string
): Promise<NodeJS.ReadableStream> {
  const blockBlobClient = containerClient.getBlockBlobClient(fileName);
  const downloadResponse = await blockBlobClient.download();
  return downloadResponse.readableStreamBody!;
}

export async function deleteFileFromBlob(fileName: string): Promise<void> {
  const blockBlobClient = containerClient.getBlockBlobClient(fileName);
  await blockBlobClient.delete();
}

export async function getAllFilenamesFromBlob(): Promise<string[]> {
  const filenames = [];
  const allFiles = containerClient.listBlobsFlat();
  for await (const blob of allFiles) {
    filenames.push(blob.name);
  }
  return filenames;
}
