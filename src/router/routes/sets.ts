import express from "express"
import { authMiddleware } from "../../middlewares/authMiddleware"
import controllers from "../../controllers"

const setsRouter = express.Router()

setsRouter.get("/query/:setId", authMiddleware, controllers.set.getAllSetQueriesById)
setsRouter.post("/query", authMiddleware, controllers.set.query)
// setsRouter.get("/query", authMiddleware, controllers.set.getAllSets)
setsRouter.post("/", authMiddleware, controllers.set.createSet)
setsRouter.post("/:id", authMiddleware, controllers.set.addFilesToSet)
setsRouter.get("/", authMiddleware, controllers.set.getAllSets)
setsRouter.get("/:setId", authMiddleware, controllers.set.getSetById)


export default setsRouter;