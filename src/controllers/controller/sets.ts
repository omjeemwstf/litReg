import { Request, Response } from "express"
import services from "../../services"
import { successResponse } from "../../config/response"
import { ErrorTypes, handleError, throwError } from "../../config/error"

export class set {

    static createSet: any = async (req: Request, res: Response) => {
        try {
            const { name, purpose, ids } = req.body
            const userId = req["user"]["userId"]
            if (!name || !purpose || !ids) {
                throw new Error("Name. Ids of Files and Purpose are required for creating the set")
            }

            if (!Array.isArray(ids) || !ids.every(id => typeof id === 'string')) {
                throw new Error('Ids must be an array of strings.')
            }
            const response = await services.set.createSet(userId, name, purpose, ids)
            return successResponse(res, 200, "Set created Successfully", response)
        } catch (error) {
            return handleError(res, error)
        }
    }

    static addFilesToSet: any = async (req: Request, res: Response) => {
        try {
            const userId = req["user"]["userId"]
            const { ids } = req.body
            if (!Array.isArray(ids) || !ids.every(id => typeof id === 'string')) {
                throw new Error('Ids must be an array of strings.')
            }
            const id = req.params.id
            const user = await services.user.getUserById(userId)
            if (!user) throwError(ErrorTypes.USER_NOT_FOUND)
            const response = await services.set.addFilesIntoSets(user.id, id, ids)
            return successResponse(res, 200, "All User Sets Fetched Successfully", response)
        } catch (error) {
            return handleError(res, error)
        }
    }

    static getAllSets: any = async (req: Request, res: Response) => {
        try {
            const userId = req["user"]["userId"]
            const response = await services.set.getAllUserSets(userId)
            return successResponse(res, 200, "All User Sets Fetched Successfully", response)
        } catch (error) {
            return handleError(res, error)
        }
    }

}