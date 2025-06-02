import { Request, Response, response } from "express"
import { ErrorTypes, handleError, throwError } from "../../config/error"
import { successResponse } from "../../config/response"
import services from "../../services"
import { FolderObjectType } from "../../types/user"
import fs from "fs"
import FormData from "form-data"
import axios from "axios"
import { envConfig } from "../../config/envConfigs"
import { v4 as uuidv4 } from "uuid";
import path from 'path';



import https from 'https';
import http from 'http';
import { URL } from 'url';
// import azureContainerClient from "../../config/azureContainerClient"
import { uploadFileToAzure } from "../../services/dbservices/uploader"
import { generateRandomUUId, s3Uploader } from "../../config/constants"



export class documents {


    static getFileById: any = async (req: Request, res: Response) => {
        try {
            const userId = req["userId"]
            const id = req.params.id
            if (!id) {
                throw new Error("File Id is required")
            }
            console.log("Id is >>> ", id)
            const data = await services.documents.getFileDataById(id, userId)
            console.log("Data ios ", data)
            return successResponse(res, 200, "File Data Fetched Successfully", data)
        } catch (error) {
            return handleError(res, error)
        }
    }

    static updateMultipleFiles: any = async (req: Request, res: Response) => {
        try {
            const data = req.body.data
            const response = await services.documents.updateFoldersId(data)
            return successResponse(res, 200, "File Updated Successfully", response)
        } catch (error) {
            return handleError(res, error)
        }
    }

    static deleteFolderOrFile: any = async (req: Request, res: Response) => {
        try {
            const userId = req["userId"]
            const fileId = req.params.id
            if (!fileId) {
                throw new Error("File Id is required")
            }
            const response = await services.documents.deleteOrRecoverFileOrFolder(fileId, userId, true)
            return successResponse(res, 200, "File deleted Successfully", response)
        } catch (error) {
            return handleError(res, error)
        }
    }

    static recoverFolderOrFile: any = async (req: Request, res: Response) => {
        try {
            const userId = req["userId"]
            const fileId = req.params.id
            if (!fileId) {
                throw new Error("File Id is required")
            }
            const response = await services.documents.deleteOrRecoverFileOrFolder(fileId, userId, false)
            return successResponse(res, 200, "File Recovered Successfully", response)
        } catch (error) {
            return handleError(res, error)
        }
    }


    static getAllFoldersAndFiles: any = async (req: Request, res: Response) => {
        try {
            const userId = req["userId"]
            const data = await services.documents.getALLUserFoldersAndFiles(userId)
            return successResponse(res, 200, "All folders retrive successfully", data)
        } catch (error) {
            return handleError(res, error)
        }
    }

    static uploadFolder: any = async (req: Request, res: Response) => {
        try {
            const userId = req["userId"]
            const { folderName, parentId } = req.body
            if (!folderName) {
                throw new Error("FolderName is required")
            }
            await this.validateUserAndFolder(userId, parentId)
            const data = await services.documents.addFolder(folderName, parentId, FolderObjectType.FOLDER, userId)
            return successResponse(res, 200, "Folder Added Successfully", data)
        } catch (error) {
            return handleError(res, error)
        }
    }

    private static validateUserAndFolder = async (userId: number, parentId: string) => {
        if (parentId && parentId !== "null" && parentId !== "") {
            console.log("Parent id is ", parentId)
            const folder = await services.documents.isFolderExists(parentId)
            if (!folder) {
                throwError(ErrorTypes.PARENT_FOLDER_NOT_EXISTS)
            }
            if (folder.type === FolderObjectType.FILE) {
                throw throwError(ErrorTypes.CANNOT_STORE_DATA_INSIDE_FILE)
            }
            if (folder.userId !== userId) {
                throw new Error("This folder is not belongs to this user")
            }
        }
    }


    static deleteFilePaths = (filePaths: string[]) => {
        for (const path of filePaths) {
            fs.unlink(path, (err) => {
                if (err) {
                    console.error(`Failed to delete file: ${path}`, err);
                } else {
                    console.log(`Deleted temp file: ${path}`);
                }
            });
        }
    }


    static uploadMultipleFilesToS3: any = async (req: Request, res: Response) => {
        const filePaths: string[] = [];
        let totalSizeInMB = 0;
        try {
            const userId = req["userId"]
            const parentId = req.body.parentId || null
            await this.validateUserAndFolder(userId, parentId)


            const fileDataResponse = []
            let totalSizeInBytes = 0;

            if (req["files"] && Array.isArray(req["files"])) {
                const allowedExtensions = ['.pdf', '.docx', '.txt'];

                const uploadPromises = req["files"]
                    .filter((file) => {
                        const ext = path.extname(file.originalname).toLowerCase();
                        return allowedExtensions.includes(ext);
                    }).map((file) => {
                        const fileContent = fs.readFileSync(file.path);
                        filePaths.push(file.path);

                        const uniqueKey = `${uuidv4()}-${file.originalname}`;

                        const params = {
                            Bucket: envConfig.uploader.bucket,
                            Key: uniqueKey,
                            Body: fileContent,
                            ContentType: file.mimetype,
                            ACL: 'public-read',
                        };

                        const meta = {
                            originalname: file.originalname,
                            mimetype: file.mimetype,
                            size: file.size,
                        };

                        totalSizeInBytes += file.size;

                        return s3Uploader.upload(params).promise().then((result) => ({
                            id: generateRandomUUId(),
                            link: result.Location,
                            meta,
                            name: file.originalname
                        }));
                    });

                const uploadResultsWithMeta = await Promise.all(uploadPromises);
                fileDataResponse.push(...uploadResultsWithMeta);
            }

            totalSizeInMB = totalSizeInBytes / (1024 * 1024);
            console.log(`Total upload size: ${totalSizeInMB.toFixed(2)} MB`);

            const cdn_links = []

            const newFileData = fileDataResponse.map((file) => {
                cdn_links.push({
                    id: file.id,
                    link: file.link,
                    name: file.name
                })
                return {
                    id: file.id,
                    name: file.meta.originalname,
                    parentId,
                    type: FolderObjectType.FILE,
                    link: file.link,
                    isProcessed: false,
                    meta: file.meta,
                    userId: userId
                }
            })

            const responseData = await services.documents.addFiles(newFileData)
            // console.log("Response dtra ??? ", responseData)
            console.log("CDN links are >>>>>>>>>>>>>>>>> ", cdn_links)
            // axios.post(`${envConfig.aiBackendUrl}/upload-multiple-and-ingest`, { cdn_links }, {
            //     headers: {
            //         "Content-Type": "application/json"
            //     },
            // });
            this.documentProcessApiCall(cdn_links)
            // console.log("Kate reponse is ", response)
            this.deleteFilePaths(filePaths)
            return successResponse(res, 200, "File Uploaded Successfully!", responseData);
        } catch (error) {
            this.deleteFilePaths(filePaths)
            console.log(`Total upload size: ${totalSizeInMB.toFixed(2)} MB`);
            return handleError(res, error);
        }
    };



    static documentProcessApiCall: any = (cdn_links: any) => {
        axios.post(`https://sweeping-moth-probably.ngrok-free.app/upload-multiple-and-ingest`, { cdn_links }, {
            headers: {
                "Content-Type": "application/json"
            },
        });
    }

    static reprocessTheDocs: any = async (req: Request, res: Response) => {
        try {
            const response = await services.documents.reprocessTheFiles()
            const { process } = req.query
            const formatted = response.map((r: any) => {
                return {
                    id: r.id,
                    link: r.link,
                    name: r.meta?.originalname || `Title-${uuidv4()}`
                }
            })
            if (process === "1") {
                console.log("Initiated>>>>")
                this.documentProcessApiCall(formatted)
            }
            return successResponse(res, 200, "Unprocesses Files fetched successfully!", { len: formatted.length, formatted })
        } catch (error) {
            return handleError(res, error)
        }
    }




}