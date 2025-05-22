import { Request, Response } from "express"
import { ErrorTypes, handleError, throwError } from "../../config/error"
import { successResponse } from "../../config/response"
import services from "../../services"
import { FolderObjectType } from "../../types/user"
import fs from "fs"
import FormData from "form-data"
import axios from "axios"
import { envConfig } from "../../config/envConfigs"


export class documents {


    static getAllFoldersAndFiles: any = async (req: Request, res: Response) => {
        try {
            const userId = req["user"]["userId"]
            const integerUserId = await services.user.getUserById(userId)
            if (!integerUserId) {
                throw new Error("User not exists")
            }
            const data = await services.documents.getALLUserFoldersAndFiles(integerUserId.id)
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
            if (!folder) {
                throwError(ErrorTypes.PARENT_FOLDER_NOT_EXISTS)
            }
            if (folder.type === FolderObjectType.FILE) {
                throw throwError(ErrorTypes.CANNOT_STORE_DATA_INSIDE_FILE)
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

        try {

            const integerUserId = await this.validateUserAndFolder(userId, parentId)

            if (req["file"]) {
                formData.append('file', fs.createReadStream(filePath), req["file"].originalname);
            } else {
                throw new Error("File is required")
            }
            const response = await axios.post(`${envConfig.aiBackendUrl}/upload-and-ingest`, formData, {
                headers: {
                    ...formData.getHeaders()
                }
            })
            const data = response.data.data
            console.log("Response is >>>>>>>>>>> ", data,"$$$", response.data)
            const id = data.id
            const title = data.title
            const link = response.data.link
            const files = [{ id, name: title, link }]
            const filesArray: any = files.map((file) => {
                return {
                    id: file.id,
                    name: file.name,
                    parentId: parentId !== "null" && parentId ? parentId : null,
                    userId: integerUserId,
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
        try {
            const userId = req["user"]["userId"]
            const parentId = req.body.parentId
            const formData = new FormData();
            const integerUserId = await this.validateUserAndFolder(userId, parentId)

            if (req["files"] && Array.isArray(req["files"])) {
                req["files"].forEach((file: Express.Multer.File) => {
                    formData.append('files', fs.createReadStream(file.path), file.originalname);
                    filePaths.push(file.path);
                });
            }
            const response = await axios.post(`${envConfig.aiBackendUrl}/upload-multiple-and-ingest`, formData, {
                headers: {
                    ...formData.getHeaders()
                }
            });
            const responseData = response.data;
            console.log("Response data is >>>>>> ", responseData)
            const files = responseData.uploaded_files?.map((data: any, index: number) => {
                return {
                    name: responseData.data[index].title,
                    id: responseData.data[index]._id,
                    link: data.url
                }
            })
            console.log("Files >>>>>>>>>>>>> ", files)
            const filesArray: any = files.map((file: any) => {
                return {
                    id: file.id,
                    name: file.name,
                    parentId: parentId ? parentId : null,
                    userId: integerUserId,
                    link: file.link,
                    type: FolderObjectType.FILE
                }
            })
            console.log("Files array ", filesArray)
            const folderFileData = await services.documents.addFiles(filesArray)
            console.log("Folder file path data >>>> ", folderFileData)
            this.deleteFilePaths(filePaths)
            return successResponse(res, 200, responseData.message || "File Uploaded Successfully!", folderFileData);
        } catch (error) {
            this.deleteFilePaths(filePaths)
            return handleError(res, error);
        }
    };

}