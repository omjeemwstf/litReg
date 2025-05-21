import express from "express"
import controllers from "../../controllers";
import { authMiddleware } from "../../middlewares/authMiddleware";

const userRouter = express.Router()

userRouter.get("/", authMiddleware, controllers.user.userInfo)


export default userRouter