import express from "express"
import controllers from "../../controllers";

const authRouter = express.Router()

authRouter.delete("/", controllers.auth.deleteUser)
authRouter.post("/login", controllers.auth.login)
authRouter.post("/register", controllers.auth.register)
authRouter.get("/google", controllers.auth.googleSignInSignUp)
authRouter.get("/microsoft", controllers.auth.microsoftSignInSignUp)
authRouter.get("/verify-email", controllers.auth.verifyEmail)
authRouter.post("/verify-email", controllers.auth.sendVerificationLink)

export default authRouter;