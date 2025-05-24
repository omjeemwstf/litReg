import express from "express"
import { authMiddleware } from "../../middlewares/authMiddleware"
import controllers from "../../controllers"

const setsRouter = express.Router()

setsRouter.post("/", authMiddleware, controllers.set.createSet)
setsRouter.post("/:id", authMiddleware, controllers.set.addFilesToSet)
setsRouter.get("/", authMiddleware, controllers.set.getAllSets)

export default setsRouter;