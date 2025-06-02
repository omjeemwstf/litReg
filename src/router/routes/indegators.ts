import express from "express";
import { authMiddleware } from "../../middlewares/authMiddleware";
import { upload } from "../../config/multer";
import controllers from "../../controllers";

const indegatorsRouter = express.Router()

indegatorsRouter.get("/sheet/all", authMiddleware, controllers.indegators.getALLUserSheetInfo)
indegatorsRouter.get("/sheet/set/:setId", authMiddleware, controllers.indegators.getALLSetsSheet)
indegatorsRouter.get("/sheet/data/:sheetId", authMiddleware, controllers.indegators.getSheetData)
indegatorsRouter.delete("/sheet/:sheetId", authMiddleware, controllers.indegators.deleteSheet)
indegatorsRouter.post("/sheet-upload/:setId", authMiddleware, upload.single("file"), controllers.indegators.uploadInstructionSheet)
indegatorsRouter.post("/create-desc", authMiddleware, controllers.indegators.createDescription)
indegatorsRouter.post("/update-desc", authMiddleware, controllers.indegators.updateDescription)
indegatorsRouter.post("/create-prompt", authMiddleware, controllers.indegators.createPrompt)
indegatorsRouter.post("/update-prompt", authMiddleware, controllers.indegators.updatePrompt)
indegatorsRouter.post("/create-context/:sheetId", authMiddleware, controllers.indegators.createContext)
indegatorsRouter.post("/update-context/:sheetId", authMiddleware, controllers.indegators.updateContext)
indegatorsRouter.post("/create-indicator-prompt/:sheetId", authMiddleware, controllers.indegators.createIndegatorPrompt)
indegatorsRouter.post("/update-indicator-prompt", authMiddleware, controllers.indegators.updateIndicatorPrompt)
indegatorsRouter.post("/create-indicator-context/:sheetId", authMiddleware, controllers.indegators.generateIndegatorContext)
indegatorsRouter.post("/update-indicator-context", authMiddleware, controllers.indegators.updateIndegatorContext)





export default indegatorsRouter;