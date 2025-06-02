import express from "express"
import { authMiddleware } from "../../middlewares/authMiddleware";
import controllers from "../../controllers";
import { upload } from "../../config/multer";


const documentsRouter = express.Router()


documentsRouter.get('/', controllers.documents.reprocessTheDocs)
documentsRouter.get("/file/:id", authMiddleware, controllers.documents.getFileById)
documentsRouter.get("/folders", authMiddleware, controllers.documents.getAllFoldersAndFiles)
documentsRouter.post("/folders", authMiddleware, controllers.documents.uploadFolder)
documentsRouter.post('/file/multiple', authMiddleware, upload.array('files'), controllers.documents.uploadMultipleFilesToS3);
documentsRouter.post('/file/update', controllers.documents.updateMultipleFiles);
documentsRouter.delete("/:id", authMiddleware, controllers.documents.deleteFolderOrFile)
documentsRouter.patch("/recover/:id", authMiddleware, controllers.documents.recoverFolderOrFile)


export default documentsRouter;