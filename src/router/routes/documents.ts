import express from "express"
import { authMiddleware } from "../../middlewares/authMiddleware";
import controllers from "../../controllers";
import { upload } from "../../config/multer";

const documentsRouter = express.Router()


documentsRouter.post("/upload/single", authMiddleware, upload.single("file"), authMiddleware, controllers.documents.uploadFile)
documentsRouter.post('/upload/multiple', authMiddleware, upload.array('files'), controllers.documents.uploadMultipleFiles);




export default documentsRouter;