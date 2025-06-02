import { Request, Response } from "express";
import { ErrorTypes, handleError, throwError } from "../../config/error";
import { successResponse } from "../../config/response";
import services from "../../services";
import controllers from "..";
import { generateAuthTokens } from "../../config/token";
import { FolderObjectType } from "../../types/user";

export class user {
    static userInfo: any = async (req: Request, res: Response) => {
        try {
            const userId = req["user"]["userId"]
            const data = await services.user.getUserById(userId)
            if (!data) throwError(ErrorTypes.USER_NOT_FOUND)
            return successResponse(res, 200, "User Info", data)
        } catch (error) {
            return handleError(res, error)
        }
    }
    
    

 
}