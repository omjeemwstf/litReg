import { Request, Response } from "express"
import services from "../../services"
import { successResponse } from "../../config/response"
import { ErrorTypes, handleError, throwError } from "../../config/error"
import { generateRandomUUId } from "../../config/constants"
import axios from "axios"
import { envConfig } from "../../config/envConfigs"
import { SetType } from "../../types/user"

export class set {

    static createSet: any = async (req: Request, res: Response) => {
        try {
            const { name, purpose, ids, type } = req.body
            const setType = type || SetType.QUERY
            const userId = req["userId"]
            if (
                !name ||
                !purpose ||
                !ids
            ) {
                throw new Error("Name, Ids of Files, and Purpose are required for creating the set");
            }
            if (!setType || !(setType === SetType.LLM || setType === SetType.QUERY)) {
                throw new Error(`Set type can be only '${SetType.LLM}' or '${SetType.QUERY}'`)
            }

            if (!Array.isArray(ids) || !ids.every(id => typeof id === 'string')) {
                throw new Error('Ids must be an array of strings.')
            }
            const response = await services.set.createSet(userId, name, purpose, ids, setType)
            console.log("Set created >>> ", response)
            return successResponse(res, 200, "Set created Successfully", response)
        } catch (error) {
            return handleError(res, error)
        }
    }

    static deleteSet: any = async (req: Request, res: Response) => {
        try {
            const userId = req["userId"]
            const setId = req.params.setId
            if (!setId) {
                throw new Error("Set Id is required")
            }
            const response = await services.set.deleteSet(setId, userId)
            if (!response || response.length === 0) {
                throw new Error("Either set not exists or not belongs to you")
            }
            return successResponse(res, 200, "Set Deleted Successfully")
        } catch (error) {
            return handleError(res, error)
        }
    }

    static addFilesToSet: any = async (req: Request, res: Response) => {
        try {
            const userId = req["userId"]
            const { ids } = req.body
            if (
                !Array.isArray(ids) ||
                !ids.every(id => typeof id === 'string') ||
                new Set(ids).size !== ids.length
            ) {
                throw new Error('Ids must be an array of unique strings.')
            }
            const id = req.params.id
            const response = await services.set.addFilesIntoSets(userId, id, ids)
            return successResponse(res, 200, "New Files are successfully added to the set", response)
        } catch (error) {
            return handleError(res, error)
        }
    }

    static getAllSets: any = async (req: Request, res: Response) => {
        try {
            const userId = req["userId"]
            const type = req.query.type || SetType.QUERY
            if (!type || !(type === SetType.LLM || type === SetType.QUERY)) {
                throw new Error(`Set type can be only '${SetType.LLM}' or '${SetType.QUERY}'`)
            }
            const response = await services.set.getAllUserSets(userId, type)
            return successResponse(res, 200, "All User Sets Fetched Successfully", response)
        } catch (error) {
            return handleError(res, error)
        }
    }

    static query: any = async (req: Request, res: Response) => {
        try {
            const userId = req["userId"]
            const { setId, query } = req.body
            if (!setId || !query) {
                throw new Error("SetId and query is required")
            }
            const { files, id, links } = await services.set.getSetFilesIdBySetId(setId, userId)
            console.log("Files atre>>> ", files, links)
            const aiData = await axios.post(`${envConfig.aiBackendUrl}/query`, {
                doc_ids: files,
                query,
            })
            const responseData = aiData.data
            responseData.links = links
            console.log("response data is >>>>> ", responseData)
            await services.set.saveQueryId(id, responseData.id)
            return successResponse(res, 200, "Query Data", responseData)
        } catch (error) {
            return handleError(res, error)
        }
    }

    static getAllSetQueriesById: any = async (req: Request, res: Response) => {
        try {
            const userId = req["userId"]
            const setId = req.params.setId
            console.log("Set id is ", setId)
            if (!setId) {
                throw new Error("Set Id is required")
            }
            const { formatted, links } = await services.set.getAllSetsQueryById(setId, userId)
            console.log("Data query set s??? ", formatted, links)
            const response = await axios.post(`${envConfig.aiBackendUrl}/get-query`, {
                doc_ids: formatted
            })
            console.log("Links are >>> ", links)
            const responseData = response.data
            responseData.links = links
            const newData = {
                query: responseData.query,
                links: links
            }
            console.log("Response datra >>>> ", responseData)
            return successResponse(res, 200, "Sets Data", newData)
        } catch (error) {
            return handleError(res, error)
        }
    }

    static getSetById: any = async (req: Request, res: Response) => {
        try {
            const userId = req["userId"]
            const setId = String(req.params.setId)
            if (!setId) {
                throw new Error("Set Id is required")
            }
            const setsData = await services.set.getSetFilesDataBySetId(setId, userId)
            return successResponse(res, 200, "Sets Details fetched successfully!", setsData)
        } catch (error) {
            return handleError(res, error)
        }
    }

    static deleteFileFromSet: any = async (req: Request, res: Response) => {
        try {
            const userId = req["userId"]
            const setId = req.params.setId
            const fileId = req.params.fileId

            if (!setId || !fileId) {
                throw new Error("Set id and File Id is required")
            }
            const isSetBelongToUser = await services.set.setDataWithSetIdAndUserId(setId, userId)
            if (!isSetBelongToUser) {
                throwError(ErrorTypes.SET_NOT_BELONGS_TO_THIS_USER)
            }
            const response = await services.set.deleteFileFromSet(isSetBelongToUser.id, fileId)
            return successResponse(res, 200, "Set from File Deleted Successfully")
        } catch (error) {
            return handleError(res, error)
        }
    }

}