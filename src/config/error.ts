import { Response } from "express";
import { errorResponse } from "./response";
import logger from "./logger";

export enum ErrorTypes {
    INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
    USER_NOT_FOUND = 'USER_NOT_FOUND',
    ACCESS_DENIED = 'ACCESS_DENIED',
    INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
    INVALID_TOKEN = "INVALID_TOKEN",
    EMAIL_NOT_FOUND = "EMAIL_NOT_FOUND",
    PASSWORD_NOT_FOUND = "PASSWORD_NOT_FOUND",
    INVALID_PASSWORD = "INVALID_PASSWORD",
    USER_ALREADY_EXISTS = "USER_ALREADY_EXISTS",
    USER_NOT_VERIFIED = "USER_NOT_VERIFIED",
    EMAIL_ALREADY_VERIFIED = "EMAIL_ALREADY_VERIFIED"
}

export const ErrorMessages: Record<ErrorTypes, { message: string; statusCode: number }> = {
    [ErrorTypes.INVALID_TOKEN]: {
        message: 'Expired or invalid token',
        statusCode: 498,
    },
    [ErrorTypes.EMAIL_ALREADY_VERIFIED]: {
        message: 'Your Email is already verified you can login directly',
        statusCode: 400,
    },
    [ErrorTypes.USER_NOT_VERIFIED]: {
        message: 'You have not verified though the email that we sent you on you mailBox',
        statusCode: 400,
    },
    [ErrorTypes.USER_ALREADY_EXISTS]: {
        message: 'User Already exists',
        statusCode: 400,
    },
    [ErrorTypes.INVALID_PASSWORD]: {
        message: 'You have not Logged in using password. Please login using Google or Microsoft',
        statusCode: 400,
    },
    [ErrorTypes.PASSWORD_NOT_FOUND]: {
        message: 'You have not Logged in using password. Please login using Google or Microsoft',
        statusCode: 400,
    },
    [ErrorTypes.INVALID_CREDENTIALS]: {
        message: 'Invalid Credentials',
        statusCode: 401,
    },
    [ErrorTypes.EMAIL_NOT_FOUND]: {
        message: 'Email Not Found',
        statusCode: 404,
    },
    [ErrorTypes.USER_NOT_FOUND]: {
        message: 'User not found',
        statusCode: 404,
    },
    [ErrorTypes.ACCESS_DENIED]: {
        message: 'Access denied',
        statusCode: 403,
    },
    [ErrorTypes.INTERNAL_SERVER_ERROR]: {
        message: 'Internal Server Error',
        statusCode: 500,
    },
};

export class CustomError extends Error {
    status: number;

    constructor(message: string, status: number) {
        super(message);
        this.status = status;
        Object.setPrototypeOf(this, CustomError.prototype);
    }
}

export const handleError = (res: Response, err: unknown) => {
    console.log("Error is ", err)
    if (err instanceof CustomError) {
        logger.error(err.message, err)
        return errorResponse(res, err.status, err.message);
    } else if (err instanceof Error) {
        logger.error(err.message, err)
        return errorResponse(res, 500, err.message);
    } else {
        logger.error("Internal Server Error", err)
        return errorResponse(res, 500, "Internal Server Error");
    }
};

export function throwError(error: ErrorTypes) {
    const err = ErrorMessages[error]
    throw new CustomError(err.message, err.statusCode)
}
