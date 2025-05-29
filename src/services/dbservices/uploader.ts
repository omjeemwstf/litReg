import { BlobServiceClient, BlockBlobClient } from "@azure/storage-blob";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import fs from "fs";
import { envConfig } from "../../config/envConfigs";
// import azureContainerClient from "../../config/azureContainerClient";

type UploadResult = {
    name: string;
    mimeType: string;
    size: number;           // in bytes
    url: string;            // public access link
    blobName: string;       // internal blob name
};

export const uploadFileToAzure = async (
    filePath: string,
    originalName: string,
    mimeType: string
): Promise<UploadResult> => {

    console.log(envConfig.azure)
   
    const blobServiceClient: BlobServiceClient = BlobServiceClient.fromConnectionString("");
    let azureContainerClient = blobServiceClient.getContainerClient("regstorage");
    console.log(">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>", azureContainerClient)

    if (!azureContainerClient) {
        throw new Error("Azure Container Client is not initialized.");
    }

    const extension = path.extname(originalName);
    const blobName = `${uuidv4()}${extension}`;
    const blockBlobClient: BlockBlobClient = azureContainerClient.getBlockBlobClient(blobName);

    const stats = fs.statSync(filePath);
    const size = stats.size;

    const fileStream = fs.createReadStream(filePath);

    await blockBlobClient.uploadStream(fileStream, undefined, undefined, {
        blobHTTPHeaders: {
            blobContentType: mimeType || "application/octet-stream",
        },
    });

    return {
        name: originalName,
        mimeType,
        size,
        url: blockBlobClient.url,
        blobName
    };
};
