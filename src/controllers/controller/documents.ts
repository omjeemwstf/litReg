import { Request, Response } from "express"
import { handleError } from "../../config/error"
import { successResponse } from "../../config/response"
import services from "../../services"
import { FolderObjectType } from "../../types/user"
import fs from "fs"
import FormData from "form-data"
import axios from "axios"
import { envConfig } from "../../config/envConfigs"


export class documents {
    static addFolderOrFile: any = async (req: Request, res: Response) => {
        try {
            const userId = req["user"]["userId"]
            const { folderName, parentId } = req.body
            console.log("Request body is ", req.body)
            if (!folderName) {
                throw new Error("FolderName is required")
            }
            if (parentId) {
                const isParentExists = await services.user.isFolderExists(parentId)
                if (!isParentExists) {
                    throw new Error("The Parent folder you mentioned is not exists")
                }
                if (isParentExists.type === FolderObjectType.FILE) {
                    throw new Error("You cannot append file into file")
                }
            }
            const integerUserId = await services.user.getUserById(userId)
            const data = await services.user.addFolderOrFile(folderName, parentId, FolderObjectType.FOLDER, integerUserId.id, [])
            return successResponse(res, 200, "Folder Added Successfully", data)
        } catch (error) {
            return handleError(res, error)
        }
    }

    static getAllFolders: any = async (req: Request, res: Response) => {
        try {
            const userId = req["user"]["userId"]
            const integerUserId = await services.user.getUserById(userId)
            if (!integerUserId) {
                throw new Error("User not exists")
            }
            const data = await services.user.getALlUserFolders(integerUserId.id)
            return successResponse(res, 200, "All folders retrive successfully", data)
        } catch (error) {
            return handleError(res, error)
        }
    }
    

    static uploadFile: any = async (req: Request, res: Response) => {
        try {
            const userId = req["user"]["userId"]
            const integerUserId = await services.user.getUserById(userId)
            if (!integerUserId) {
                throw new Error("User not Exists")
            }
            const formData = new FormData();
            const parentId = req.body.parentId
            if (parentId) {
                const folder = await services.user.isFolderExists(parentId)
                if (!folder) {
                    throw new Error("The parent folder you mentiond is not exists")
                }
                if (folder.type === FolderObjectType.FILE) {
                    throw new Error("You cannot store file inside file")
                }
            }
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
                    parentId: parentId ? parentId : null,
                    userId: integerUserId.id,
                    link : file.link,
                    type: FolderObjectType.FILE
                }
            })
            const folderFileData = await services.user.addFiles(filesArray)
            console.log("data is >>>>>>>>>>> ", data, folderFileData)
            return successResponse(res, 200, "File Uploaded Successfully", folderFileData)
        } catch (error) {
            return handleError(res, error)
        }
    }
    static uploadMultipleFiles: any = async (req: Request, res: Response) => {
        try {
            const userId = req["user"]["userId"];
            const formData = new FormData();

            if (req.body.collectionName) {
                formData.append('collection_name', req.body.contract);
            }

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

            const data = response.data;
            console.log("data is >>>>>>>>>>> ", data);

            return successResponse(res, 200, "Files Uploaded Successfully", data);
        } catch (error) {
            return handleError(res, error);
        }
    };

}