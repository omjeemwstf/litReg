import { Request, Response } from "express"
import { ErrorTypes, handleError, throwError } from "../../config/error"
import { successResponse } from "../../config/response"
import services from "../../services"
import { FolderObjectType } from "../../types/user"
import fs from "fs"
import FormData from "form-data"
import axios from "axios"
import { envConfig } from "../../config/envConfigs"
import https from 'https';
import http from 'http';
import { URL } from 'url';


export class documents {



    static proxyPdf: any = (req: Request, res: Response) => {
        const src = req.query.src as string;

        if (!src) {
            return res.status(400).send('Missing "src" query parameter.');
        }

        try {
            const url = new URL(src);
            const client = url.protocol === 'https:' ? https : http;

            const options = {
                headers: {
                    'User-Agent': 'Mozilla/5.0',
                    'Accept': 'application/pdf',
                },
            };

            client.get(src, options, (pdfRes) => {
                if (pdfRes.statusCode !== 200) {
                    console.error(`PDF fetch failed. Status code: ${pdfRes.statusCode}`);
                    return res.status(pdfRes.statusCode || 500).send('Failed to fetch PDF.');
                }

                // Forward proper headers
                res.setHeader('Content-Type', pdfRes.headers['content-type'] || 'application/pdf');
                res.setHeader('Content-Disposition', 'inline; filename="document.pdf"');
                res.setHeader('Cache-Control', 'public, max-age=3600');
                res.setHeader('Access-Control-Allow-Origin', '*'); // optional for debugging

                pdfRes.pipe(res);
            }).on('error', (err) => {
                console.error('Error fetching PDF:', err);
                res.status(500).send('Error fetching PDF');
            });

        } catch (error) {
            console.error('Invalid URL:', error);
            return res.status(400).send('Invalid URL provided.');
        }
    };


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
            const response = await axios.post(`${envConfig.aiBackendUrl}/upload-and-ingest`, formData, {
                headers: {
                    ...formData.getHeaders()
                }
            })
            const data = response.data.data
            console.log("Response is >>>>>>>>>>> ", data, "$$$", response.data)
            const id = data.id
            const title = data.title
            const link = response.data.link
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

            if (req["files"] && Array.isArray(req["files"])) {
                req["files"].forEach((file: Express.Multer.File) => {
                    formData.append('files', fs.createReadStream(file.path), file.originalname);
                    filePaths.push(file.path);
                    metaInfo.push({
                        originalname: file.originalname,
                        mimetype: file.mimetype,
                        size: file.size
                    })
                });
            }
            console.log("Mets info ", metaInfo)
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
                    link: data.url,
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