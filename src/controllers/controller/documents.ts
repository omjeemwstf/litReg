import { Request, Response, response } from "express"
import { ErrorTypes, handleError, throwError } from "../../config/error"
import { successResponse } from "../../config/response"
import services from "../../services"
import { FolderObjectType } from "../../types/user"
import fs from "fs"
import FormData from "form-data"
import axios from "axios"
import { envConfig } from "../../config/envConfigs"
import AWS from 'aws-sdk';
import { v4 as uuidv4 } from "uuid";
import path from 'path';



import https from 'https';
import http from 'http';
import { URL } from 'url';
// import azureContainerClient from "../../config/azureContainerClient"
import { uploadFileToAzure } from "../../services/dbservices/uploader"
import { generateRandomUUId } from "../../config/constants"

const spacesEndpoint = new AWS.Endpoint(envConfig.uploader.endPoint);

const s3 = new AWS.S3({
    endpoint: spacesEndpoint,
    accessKeyId: envConfig.uploader.accessKey,
    secretAccessKey: envConfig.uploader.secretKey,
    region: envConfig.uploader.region,
});

export class documents {


    static getFileById: any = async (req: Request, res: Response) => {
        try {
            const userId = req["user"]["userId"]
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
            console.log("Data for update is ", data)
            const response = await services.documents.updateFoldersId(data)
            console.log("Response >>>>>>>>>>>> ", response)
            return successResponse(res, 200, "File Updated Successfully", response)
        } catch (error) {
            return handleError(res, error)
        }
    }

    static deleteFolderOrFile: any = async (req: Request, res: Response) => {
        try {
            const userId = req["user"]["userId"]
            const fileId = req.params.id
            if (!fileId) {
                throw new Error("File Id is required")
            }
            const user = await services.user.getUserById(userId)
            if (!user) {
                throwError(ErrorTypes.USER_NOT_FOUND)
            }
            const response = await services.documents.deleteOrRecoverFileOrFolder(fileId, user.id, true)
            return successResponse(res, 200, "File deleted Successfully", response)
        } catch (error) {
            return handleError(res, error)
        }
    }

    static recoverFolderOrFile: any = async (req: Request, res: Response) => {
        try {
            const userId = req["user"]["userId"]
            const fileId = req.params.id
            if (!fileId) {
                throw new Error("File Id is required")
            }
            const user = await services.user.getUserById(userId)
            if (!user) {
                throwError(ErrorTypes.USER_NOT_FOUND)
            }
            const response = await services.documents.deleteOrRecoverFileOrFolder(fileId, user.id, false)
            return successResponse(res, 200, "File Recovered Successfully", response)
        } catch (error) {
            return handleError(res, error)
        }
    }

    static deleteFilesRelatedToFolder = async (req: Request, res: Response) => {
        try {
            const userId = req["user"]["userId"]
            const folderId = req.params.folderId
        } catch (error) {
            return handleError(res, error)
        }
    }



    static getAllFoldersAndFiles: any = async (req: Request, res: Response) => {
        try {
            const userId = req["user"]["userId"]
            const integerUserId = await services.user.getUserById(userId)
            if (!integerUserId) {
                throw new Error("User not exists")
            }
            const data = await services.documents.getALLUserFoldersAndFiles(integerUserId.id)
            // console.log("Data is ", data)
            return successResponse(res, 200, "All folders retrive successfully", data)
        } catch (error) {
            return handleError(res, error)
        }
    }

    static uploadFolder: any = async (req: Request, res: Response) => {
        try {
            const userId = req["user"]["userId"]
            const { folderName, parentId } = req.body
            if (!folderName) {
                throw new Error("FolderName is required")
            }
            const integerUserId = await this.validateUserAndFolder(userId, parentId)
            const data = await services.documents.addFolder(folderName, parentId, FolderObjectType.FOLDER, integerUserId)
            return successResponse(res, 200, "Folder Added Successfully", data)
        } catch (error) {
            return handleError(res, error)
        }
    }

    private static validateUserAndFolder = async (userId: string, parentId: string) => {
        const integerUserId = await services.user.getUserById(userId)
        if (!integerUserId) {
            throw throwError(ErrorTypes.USER_NOT_FOUND)
        }
        if (parentId && parentId !== "null" && parentId !== "") {
            console.log("Parent id is ", parentId)
            const folder = await services.documents.isFolderExists(parentId)
            console.log("Folder details are ", folder)
            if (!folder) {
                throwError(ErrorTypes.PARENT_FOLDER_NOT_EXISTS)
            }
            if (folder.type === FolderObjectType.FILE) {
                throw throwError(ErrorTypes.CANNOT_STORE_DATA_INSIDE_FILE)
            }
            if (folder.userId !== integerUserId.id) {
                throw new Error("This folder is not belongs to this user")
            }
        }
        console.log("Inyteger >>> ", integerUserId)
        return integerUserId.id
    }



    static uploadFile: any = async (req: Request, res: Response) => {
        const userId = req["user"]["userId"]
        const parentId = req.body.parentId
        const formData = new FormData();
        const filePath = req["file"].path
        let meta: any = {}
        try {
            const integerUserId = await this.validateUserAndFolder(userId, parentId)
            if (req["file"]) {
                const file = req["file"];
                meta.originalname = file.originalname
                meta.mimetype = file.mimetype
                meta.size = file.size
                formData.append('file', fs.createReadStream(filePath), req["file"].originalname);
            } else {
                throw new Error("File is required")
            }
            console.log("GOne>>>>>>>>>>>>>>>>>>>> ")
            const response = await axios.post(`${envConfig.aiBackendUrl}/upload-and-ingest`, formData, {
                headers: {
                    ...formData.getHeaders()
                }
            })
            const data = response.data.data
            const id = data.id
            const title = data.title
            const link = data.url
            const files = [{ id, name: title, link, meta }]
            const filesArray: any = files.map((file) => {
                return {
                    id: file.id,
                    name: file.name,
                    parentId: parentId !== "null" && parentId ? parentId : null,
                    userId: integerUserId,
                    meta: file.meta,
                    link: file.link,
                    type: FolderObjectType.FILE
                }
            })
            const folderFileData = await services.documents.addFiles(filesArray)
            this.deleteFilePaths([filePath])
            return successResponse(res, 200, response.data.message || "File Uploaded Successfully", folderFileData)
        } catch (error) {
            this.deleteFilePaths([filePath])
            console.log("Error in uploading ", error)
            return handleError(res, error)
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


    static uploadMultipleFiles: any = async (req: Request, res: Response) => {
        const filePaths: string[] = [];
        const metaInfo: any[] = [];
        try {
            const userId = req["user"]["userId"]
            const parentId = req.body.parentId
            const formData = new FormData();
            const integerUserId = await this.validateUserAndFolder(userId, parentId)

            const set = new Set()
            let totalSizeInBytes = 0;

            if (req["files"] && Array.isArray(req["files"])) {
                req["files"].forEach((file: Express.Multer.File) => {
                    formData.append('files', fs.createReadStream(file.path), file.originalname);

                    filePaths.push(file.path);
                    if (set.has(file.originalname)) {
                        throwError(ErrorTypes.DUPLICATE_FILE_NAME_NOT_ALLOWED)
                    } else {
                        set.add(file.originalname)
                    }
                    metaInfo.push({
                        originalname: file.originalname,
                        mimetype: file.mimetype,
                        size: file.size
                    })
                    totalSizeInBytes += file.size;

                });
            }
            const totalSizeInMB = totalSizeInBytes / (1024 * 1024);
            console.log(`Total upload size: ${totalSizeInMB.toFixed(2)} MB`);

            console.log("Env >>> ", envConfig.aiBackendUrl)
            const response = await axios.post(`${envConfig.aiBackendUrl}/upload-multiple-and-ingest`, formData, {
                headers: {
                    ...formData.getHeaders()
                },
                timeout: 600000
            });
            const responseData = response.data;
            const files = responseData.data?.map((data: any, index: number) => {
                return {
                    name: data.title,
                    id: data._id,
                    link: data.link,
                    meta: metaInfo[index] ? metaInfo[index] : null
                }
            })
            console.log("Files >>>>>>>>>>>>> ", files)
            const filesArray: any = files.map((file: any, index: number) => {
                return {
                    id: file.id,
                    name: file.name,
                    parentId: parentId ? parentId : null,
                    userId: integerUserId,
                    link: file.link,
                    type: FolderObjectType.FILE,
                    meta: file.meta
                }
            })
            const folderFileData = await services.documents.addFiles(filesArray)
            this.deleteFilePaths(filePaths)
            return successResponse(res, 200, responseData.message || "File Uploaded Successfully!", folderFileData);
        } catch (error) {
            this.deleteFilePaths(filePaths)
            return handleError(res, error);
        }
    };

    static uploadMultipleFilesToS3: any = async (req: Request, res: Response) => {
        const filePaths: string[] = [];
        let totalSizeInMB = 0;
        try {
            const userId = req["user"]["userId"]
            const parentId = req.body.parentId || null
            const integerUserId = await this.validateUserAndFolder(userId, parentId)


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

                        return s3.upload(params).promise().then((result) => ({
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
                    userId: integerUserId
                }
            })

            const responseData = await services.documents.addFiles(newFileData)
            // console.log("Response dtra ??? ", responseData)
            console.log("CDN links are >>>>>>>>>>>>>>>>> ", cdn_links)
            axios.post(`${envConfig.aiBackendUrl}/upload-multiple-and-ingest`, { cdn_links }, {
                headers: {
                    "Content-Type": "application/json"
                },
            });
            // this.documentProcessApiCall(cdn_links)
            // console.log("Kate reponse is ", response)
            this.deleteFilePaths(filePaths)
            return successResponse(res, 200, "File Uploaded Successfully!", responseData);
        } catch (error) {
            this.deleteFilePaths(filePaths)
            console.log(`Total upload size: ${totalSizeInMB.toFixed(2)} MB`);
            return handleError(res, error);
        }
    };

    static uploadInstructionSheet: any = async (req: Request, res: Response) => {
        const excelFile = req["file"]
        const filePath = excelFile.path
        try {
            const allowedExtensions = ['.xlsx'];
            const ext = path.extname(excelFile.originalname).toLowerCase()
            if (!allowedExtensions.includes(ext)) {
                throw new Error(`Only ${allowedExtensions.join(" ")} file types are allowed`)
            }
            const userId = req["user"]["userId"]
            const user = await services.user.getUserById(userId)
            const setId = String(req.params.setId)
            if (!user) {
                throwError(ErrorTypes.USER_NOT_FOUND)
            }
            if (!setId) {
                throw new Error("Set Id is required")
            }
            const isSetBelongsToUser = await services.set.isSetBelongsToUser(setId, user.id)
            if (!isSetBelongsToUser) {
                throw new Error("Either set not exists or not belongs to you")
            }
            const fileContent = fs.readFileSync(filePath)

            const uniqueKey = `${uuidv4()}-${excelFile.originalname}`;

            const params = {
                Bucket: envConfig.uploader.bucket,
                Key: uniqueKey,
                Body: fileContent,
                ContentType: excelFile.mimetype,
                ACL: 'public-read',
            };

            const meta = {
                originalname: excelFile.originalname,
                mimetype: excelFile.mimetype,
                size: excelFile.size,
            };
            let link = "";

            await s3.upload(params).promise().then((result) => {
                console.log("Upload result is >>>> ", result)
                link = result.Location
            });

            const response = await services.documents.createInstructionSheet(user.id, isSetBelongsToUser.id, link, meta)
            console.log("Response is >>> ", response)

            const saveDataToAi = await axios.post(`${envConfig.aiBackendUrl}/upload-excel`, {
                link: response[0].link,
                inst_id: response[0].id
            })
            this.deleteFilePaths([filePath])
            return successResponse(res, 200, "Sheet Uploaded Successfully", { inst_data : saveDataToAi.data })
        } catch (error) {
            this.deleteFilePaths([filePath])
            return handleError(res, error)
        }
    }

    static documentProcessApiCall: any = (cdn_links: any) => {
        axios.post(`${envConfig.aiBackendUrl}/upload-multiple-and-ingest`, { cdn_links }, {
            headers: {
                "Content-Type": "application/json"
            },
        });
    }

    static reprocessTheDocs: any = async (req: Request, res: Response) => {
        try {
            // const userId = req["user"]["userId"]
            // const user = await services.user.getUserById(userId)
            // if (!user) {
            //     throwError(ErrorTypes.USER_NOT_FOUND)
            // }
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