import express from "express"
import { authMiddleware } from "../../middlewares/authMiddleware";
import controllers from "../../controllers";
import { upload } from "../../config/multer";

const documentsRouter = express.Router()


documentsRouter.use(authMiddleware)

documentsRouter.get("/folders", controllers.documents.getAllFoldersAndFiles)
documentsRouter.post("/folders", controllers.documents.uploadFolder)
documentsRouter.post("/file/single", upload.single("file"), authMiddleware, controllers.documents.uploadFile)
documentsRouter.post('/file/multiple', upload.array('files'), controllers.documents.uploadMultipleFiles);


export default documentsRouter;