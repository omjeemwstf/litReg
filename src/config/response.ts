import { Response } from 'express';
import logger from './logger';

export function successResponse(
    res: Response,
    status: number,
    message?: string,
    data?: any,
) {
    // logger.log(message, data)
    return res.status(status).json({ success: true, message, data });
}

export function errorResponse(res: Response, status: number, error: any) {
    // logger.error(String(error))
    return res.status(status).json({ success: false, error: error || `Error ${error}` });
}
