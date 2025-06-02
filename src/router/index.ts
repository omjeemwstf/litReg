import express, { Request, Response } from "express";
import authRouter from "./routes/auth";
import { successResponse } from "../config/response";
import userRouter from "./routes/user";
import  documentsRouter  from "./routes/documents";
import setsRouter from "./routes/sets";
import indegatorsRouter from "./routes/indegators";

const router = express.Router()


const routes = [
    {
        path: "/auth",
        route: authRouter
    },
    {
        path: "/user",
        route: userRouter
    },
    {
        path : "/documents",
        route : documentsRouter
    },
    {
        path : "/sets",
        route : setsRouter
    },
    {
        path : "/llm",
        route : indegatorsRouter
    }
]

routes.forEach((route) => {
    router.use(route.path, route.route)
})

router.get("/", (req: Request, res: Response): any => {
    return successResponse(res, 200, "Welcome to Lit Reg Api")
})


export default router;