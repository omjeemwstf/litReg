import express, { Request, Response } from "express";
import authRouter from "./routes/auth";
import { successResponse } from "../config/response";

const router = express.Router()


const routes = [
    {
        path: "/auth",
        route: authRouter
    }
]

routes.forEach((route) => {
    router.use(route.path, route.route)
})

router.get("/", (req: Request, res: Response): any => {
    return successResponse(res, 200, "Welcome to Lit Reg Api")
})


export default router;