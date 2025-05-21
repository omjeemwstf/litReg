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
        try {
            const userId = req["user"]["userId"]
            const parentId = req.body.parentId
            console.log("Parent id is ", parentId)
            const formData = new FormData();
            const integerUserId = await this.validateUserAndFolder(userId, parentId)

            if (req["file"]) {
                formData.append('file', fs.createReadStream(req["file"].path), req["file"].originalname);
            } else {
                throw new Error("File is required")
            }
            const response = await axios.post(`${envConfig.aiBackendUrl}/upload-and-ingest`, formData, {
                headers: {
                    ...formData.getHeaders()
                }
            })
            const data = response.data.data
            console.log("Response is >>>>>>>>>>> ", data)
            const id = data.id
            const title = data.title
            const link = data.link
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
            return successResponse(res, 200, "File Uploaded Successfully", folderFileData)
        } catch (error) {
            console.log("Error in uploading ", error)
            return handleError(res, error)
        }
    }


    static uploadMultipleFiles: any = async (req: Request, res: Response) => {
        try {
            const userId = req["user"]["userId"]
            const parentId = req.body.parentId
            const formData = new FormData();
            const integerUserId = await this.validateUserAndFolder(userId, parentId)

            if (req["files"] && Array.isArray(req["files"])) {
                req["files"].forEach((file: Express.Multer.File) => {
                    formData.append('files', fs.createReadStream(file.path), file.originalname);
                });
            }
            const response = await axios.post(`${envConfig.aiBackendUrl}/upload-and-ingest`, formData, {
                headers: {
                    ...formData.getHeaders()
                }
            });
            const files = response.data.data;
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
            const folderFileData = await services.documents.addFiles(filesArray)
            return successResponse(res, 200, "Files Uploaded Successfully", folderFileData);
        } catch (error) {
            return handleError(res, error);
        }
    };

}