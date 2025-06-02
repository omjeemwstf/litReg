import path from "path";
import services from "../../services";
import { Request, Response } from "express";
import { ErrorTypes, handleError, throwError } from "../../config/error";
import fs from "fs"
import { v4 as uuidv4 } from "uuid";
import { envConfig } from "../../config/envConfigs";
import { s3Uploader } from "../../config/constants";
import axios from "axios";
import { successResponse } from "../../config/response";
import { SetType } from "../../types/user";


export class indegators {

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

    static getALLUserSheetInfo: any = async (req: Request, res: Response) => {
        try {
            const userId = req["userId"]
            const data = await services.indegators.getAllUsersSheet(userId)
            return successResponse(res, 200, "All User Sheets Fetched Successfully", data)

        } catch (error) {
            return handleError(res, error)
        }
    }

    static uploadInstructionSheet: any = async (req: Request, res: Response) => {
        const excelFile = req["file"]
        const filePath = excelFile.path
        try {
            const allowedExtensions = ['.xlsx'];
            const ext = path.extname(excelFile.originalname).toLowerCase()
            if (!allowedExtensions.includes(ext)) {
                throw new Error(`Only ${allowedExtensions.join(" ")} file types are allowed`)
            }
            const userId = req["userId"]
            const setId = String(req.params.setId)
            if (!setId) {
                throw new Error("Set Id is required")
            }
            const isSetBelongsToUser = await services.indegators.isSetBelongsToUserAndLLMType(setId, userId)
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

            await s3Uploader.upload(params).promise().then((result) => {
                console.log("Upload result is >>>> ", result)
                link = result.Location
            });

            const response = await services.documents.createInstructionSheet(userId, isSetBelongsToUser.id, link, meta)
            console.log("Response is >>> ", response)

            const saveDataToAi = await axios.post(`${envConfig.aiBackendUrl}/upload-excel`, {
                link: response[0].link,
                inst_id: response[0].id
            })
            this.deleteFilePaths([filePath])
            return successResponse(
                res,
                200,
                "Sheet Uploaded Successfully",
                {
                    sheetId: response[0].sheetId,
                    inst_data: saveDataToAi.data.data,
                })
        } catch (error) {
            this.deleteFilePaths([filePath])
            return handleError(res, error)
        }
    }

    static getSheetData: any = async (req: Request, res: Response) => {
        try {
            const userId = req["userId"]
            const sheetId = req.params.sheetId

            const sheetData: any = await services.indegators.isSheetBelongsToUser(sheetId, userId)
            console.log(userId, sheetId, "Sheet data is ", sheetData)
            if (!sheetData) {
                throw new Error("Sheet not exists or not belongs to you")
            }
            const aiResponse = await axios.get(`${envConfig.aiBackendUrl}/get_inst_id/${sheetId}`)

            return successResponse(res, 200, "Sheet Data Fetched Successfully", { sheetId, inst_data: aiResponse.data.data })
        } catch (error) {
            return handleError(res, error)
        }
    }



    static getALLSetsSheet: any = async (req: Request, res: Response) => {
        try {
            const userId = req["userId"]
            const setId = req.params.setId
            if (!setId) {
                throw new Error("Set Id is required")
            }
            const isSetBelongsToUser = await services.set.setDataWithSetIdAndUserId(setId, userId)
            if (!isSetBelongsToUser) {
                throw new Error("This set is not belongs to user")
            }
            if (isSetBelongsToUser.type !== SetType.LLM) {
                throw new Error("Given Set is not of type LLM")
            }
            const data = await services.indegators.getAllSetSheets(isSetBelongsToUser.id)
            return successResponse(res, 200, "All Sets Sheet Fetched successfully", data)
        } catch (error) {
            return handleError(res, error)
        }
    }

    static deleteSheet: any = async (req: Request, res: Response) => {
        try {
            const userId = req["userId"]
            const sheetId = req.params.sheetId
            const data = await services.indegators.deleteSheet(sheetId, userId)
            console.log("Deletd data ", data)
            if (!data || data.length === 0) {
                throw new Error("Sheet Not exists or not belongs to you!")
            }
            return successResponse(res, 200, "Sheet Deleted Successfully", data)
        } catch (error) {
            return handleError(res, error)
        }
    }

    static createDescription: any = async (req: Request, res: Response) => {
        try {
            const body = req.body
            const response = await axios.post(`${envConfig.aiBackendUrl}/create-description`, body)
            console.log("Create desc", response.data)
            return successResponse(res, 200, "Group Description Created", response.data)
        } catch (error) {
            return handleError(res, error)
        }
    }

    static updateDescription: any = async (req: Request, res: Response) => {
        try {
            const body = req.body
            const response = await axios.put(`${envConfig.aiBackendUrl}/update-description`, body)
            console.log("update desc", response.data)
            return successResponse(res, 200, "Group Description Updated Created", response.data)
        } catch (error) {
            return handleError(res, error)
        }
    }


    static createPrompt: any = async (req: Request, res: Response) => {
        try {
            const body = req.body
            const response = await axios.post(`${envConfig.aiBackendUrl}/create-prompt`, body)
            console.log("Create prompt", response.data)
            return successResponse(res, 200, "Prompt Description Created", response.data)
        } catch (error) {
            return handleError(res, error)
        }
    }

    static updatePrompt: any = async (req: Request, res: Response) => {
        try {
            const body = req.body
            const response = await axios.put(`${envConfig.aiBackendUrl}/update-prompt`, body)
            console.log("update prompt", response.data)
            return successResponse(res, 200, "Group Prompt Updated Created", response.data)
        } catch (error) {
            return handleError(res, error)
        }
    }

    static createContext: any = async (req: Request, res: Response) => {
        try {
            const userId = req["userId"]
            const { group_ids } = req.body
            const sheetId = req.params.sheetId

            const { files, links } = await this.getGroupIdsAndDocIDS(group_ids, sheetId, userId)
            const response = await axios.post(`${envConfig.aiBackendUrl}/create-context`, {
                group_ids,
                doc_ids: files
            })
            const responseData = response.data
            console.log("Respons eo fcontext >>> ", responseData)
            responseData.links = links
            console.log("Create context", responseData)

            return successResponse(res, 200, "Context Generated Successfully", responseData)
        } catch (error) {
            return handleError(res, error)
        }
    }

    static updateContext: any = async (req: Request, res: Response) => {
        try {
            const body = req.body
            console.log("Context body is ", req.body)
            const response = await axios.put(`${envConfig.aiBackendUrl}/update-context`, body)
            console.log("update context", response.data)
            return successResponse(res, 200, "Context Updated Successfully", response.data)
        } catch (error) {
            return handleError(res, error)
        }
    }

    static getGroupIdsAndDocIDS: any = async (group_ids: string[], sheetId: string, userId: number) => {
        if (
            !Array.isArray(group_ids) ||
            !group_ids.every(id => typeof id === 'string') ||
            new Set(group_ids).size !== group_ids.length
        ) {
            throw new Error('Ids must be an array of unique strings.')
        }

        const sheetData: any = await services.indegators.isSheetBelongsToUser(sheetId, userId)
        console.log(userId, sheetId, "Indegator Sheet data is ", sheetData)
        if (!sheetData) {
            throw new Error("Sheet not exists or not belongs to you")
        }
        const { files, links } = await services.set.getSetFilesIdBySetId(sheetData.set.setId, userId)
        console.log("Files to process >>>>>> ", files, "Indegator Sheet data >>>>> ", sheetData)
        return { files, links }
    }

    static createIndegatorPrompt: any = async (req: Request, res: Response) => {
        try {
            const userId = req["userId"]
            const { group_ids } = req.body
            const sheetId = req.params.sheetId
            console.log("Request body is ", req.body)
            const { files, links } = await this.getGroupIdsAndDocIDS(group_ids, sheetId, userId)
            const response = await axios.post(`${envConfig.aiBackendUrl}/create-indicator-prompt`, {
                group_ids,
                doc_ids: files
            })
            const responseData = response.data
            console.log("Respons indicator fcontext >>> ", responseData)
            responseData.links = links
            console.log("Create indicator", responseData)

            return successResponse(res, 200, "Indicator Prompt Generated Successfully", responseData)
        } catch (error) {
            return handleError(res, error)
        }
    }

    static updateIndicatorPrompt: any = async (req: Request, res: Response) => {
        try {
            const body = req.body
            console.log("Indicator Update body is ", req.body)
            const response = await axios.put(`${envConfig.aiBackendUrl}/update-indicator-prompt`, body)
            console.log("update context", response.data)
            return successResponse(res, 200, "Indicator Prompt Updated Successfully", response.data)
        } catch (error) {
            return handleError(res, error)
        }
    }

    static generateIndegatorContext: any = async (req: Request, res: Response) => {
        try {
            const userId = req["userId"]
            const { group_ids } = req.body
            const sheetId = req.params.sheetId

            const { files, links } = await this.getGroupIdsAndDocIDS(group_ids, sheetId, userId)
            const response = await axios.post(`${envConfig.aiBackendUrl}/create-indicator-context`, {
                group_ids,
                doc_ids: files
            })
            const responseData = response.data
            console.log("generate  indicator fcontext context >>>>> >>> ", responseData)
            responseData.links = links
            console.log("generate indicator", responseData)

            return successResponse(res, 200, "Indicator Prompt Generated Successfully", responseData)
        } catch (error) {
            return handleError(res, error)
        }
    }

    static updateIndegatorContext: any = async (req: Request, res: Response) => {
        try {
            const body = req.body
            console.log("Indicator Update context  body is ", req.body)
            const response = await axios.put(`${envConfig.aiBackendUrl}/update-indicator-context`, body)
            console.log("indicator update context", response.data)
            return successResponse(res, 200, "Indicator Context Updated Successfully", response.data)
        } catch (error) {
            return handleError(res, error)
        }
    }
}