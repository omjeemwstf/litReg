import express from "express"
import controllers from "../../controllers";
import { authMiddleware } from "../../middlewares/authMiddleware";

const userRouter = express.Router()

userRouter.get("/", authMiddleware, controllers.user.userInfo)
userRouter.get("/folders", authMiddleware, controllers.documents.getAllFolders)
userRouter.post("/folders", authMiddleware, controllers.documents.addFolderOrFile)



export default userRouter