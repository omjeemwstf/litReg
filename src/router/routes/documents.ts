import express from "express"
import { authMiddleware } from "../../middlewares/authMiddleware";
import controllers from "../../controllers";
import { upload } from "../../config/multer";

const documentsRouter = express.Router()


documentsRouter.delete("/:id", authMiddleware, controllers.documents.deleteFolderOrFile)
documentsRouter.get("/file/:id", authMiddleware, controllers.documents.getFileById)
documentsRouter.get("/folders", authMiddleware, controllers.documents.getAllFoldersAndFiles)
documentsRouter.post("/folders", authMiddleware, controllers.documents.uploadFolder)
documentsRouter.post("/file/single", authMiddleware, upload.single("file"), authMiddleware, controllers.documents.uploadFile)
documentsRouter.post('/file/multiple', authMiddleware, upload.array('files'), controllers.documents.uploadMultipleFiles);


export default documentsRouter;