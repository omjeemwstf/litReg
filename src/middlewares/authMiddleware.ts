import { Request, NextFunction, Response } from "express";
import { AUTH_TOKEN } from "../config/constants";
import { ErrorTypes, handleError, throwError } from "../config/error";
import { verifyTokenAndGetPayload } from "../config/token";
import services from "../services";

export const authMiddleware: any = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    try {
        // const token = req.cookies[AUTH_TOKEN];
        const auth = req.headers.authorization;
        const token = auth?.split(" ")[1];

        // console.log("TOken is ", token, req.cookies)
        if (!token) {
            throwError(ErrorTypes.INVALID_TOKEN);
        }
        const decoded: any = verifyTokenAndGetPayload(token);
        if (!decoded) {
            throwError(ErrorTypes.INVALID_TOKEN);
        }
        if(!decoded.valid){
            throw new Error(`Your Jwt is expired please login again`)
        }
        req["user"] = decoded.payload;
        const userId = decoded.payload.userId
        const user = await services.user.getUserById(userId)
        if (!user) {
            throwError(ErrorTypes.USER_NOT_FOUND)
        }
        req["userId"] = user.id
        console.log(`Request Hit By User ${Date.now()}`, user)
        next();
    } catch (error) {
        console.log("Error in middleware >> ", error)
        return handleError(res, error)
    }
};