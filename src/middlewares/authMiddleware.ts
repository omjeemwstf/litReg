import { Request, NextFunction, Response } from "express";
import { AUTH_TOKEN } from "../config/constants";
import { ErrorTypes, handleError, throwError } from "../config/error";
import { verifyTokenAndGetPayload } from "../config/token";

export const authMiddleware: any = (
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
        // console.log("Decoded is ", decoded)
        req["user"] = decoded.payload;
        next();
    } catch (error) {
        console.log("Error in middleware >> ", error)
        return handleError(res, error)
    }
};