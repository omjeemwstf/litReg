import { Request, Response } from "express";
import { errorResponse, successResponse } from "../../config/response";
import { ErrorTypes, handleError, throwError } from "../../config/error";
import services from "../../services";
import { envConfig } from "../../config/envConfigs";
import axios from "axios";
import { verifyTokenAndGetPayload } from "../../config/token";
import url from "node:url";
import { AUTH_TOKEN, SIgnINMethod } from "../../config/constants";
import postgreDb from "../../config/db";
import { users } from "../../models/schema";
import { eq } from "drizzle-orm";

export class auth {

    static setCookie: any = async (res: Response, token: string) => {
        return res.cookie(AUTH_TOKEN, token, {
            httpOnly: true,
            secure: true,
            sameSite: "none",
            maxAge: envConfig.jwt.expires,
            path: "/"
        })
    }

    static login: any = async (req: Request, res: Response) => {
        try {
            const { email, password } = req.body;
            if (!email) throwError(ErrorTypes.EMAIL_NOT_FOUND)
            const user = await services.auth.login(email, password);
            // if (!user) throwError(ErrorTypes.USER_NOT_VERIFIED)
            if (user.isVerified) this.setCookie(res, user.token)
            // console.log(res)
            return successResponse(res, 200, "User logged in successfully!", user)
        } catch (error) {
            return handleError(res, error)
        }
    }

    static register: any = async (req: Request, res: Response) => {
        try {
            const { email, password, userName } = req.body;
            const user = await services.auth.register(
                { email, password, userName },
                SIgnINMethod.PASSWORD
            );
            console.log("Unverfihvbjkndl>>>>>>>>>>>>> ", user)
            if (user) this.setCookie(res, user.token)
            return successResponse(res, 200, "User registered Successfully, Please verify youe email", user)
        } catch (error) {
            return handleError(res, error)
        }
    }

    static deleteUser: any = async (req: Request, res: Response) => {
        const { email } = req.body
        try {
            await postgreDb.delete(users).where(eq(email, users.email))
            return successResponse(res, 200, "User deleted successfully")


        } catch (error) {
            return errorResponse(res, 400, "Error in deleting user")
        }
    }

    static sendVerificationLink: any = async (req: Request, res: Response) => {
        try {
            const { email } = req.body
            if (!email) throwError(ErrorTypes.EMAIL_NOT_FOUND)
            const user = await services.auth.getUserByEmail(email)
            if (user.isVerified) {
                throwError(ErrorTypes.EMAIL_ALREADY_VERIFIED)
            }
            await services.auth.sendEmailVerifyLink(email, user.userName, user.userId)
            return successResponse(res, 200, "Verification email is sent to your email")
        } catch (error) {
            handleError(res, error)
        }
    }

    static verifyEmail: any = async (req: Request, res: Response) => {
        try {
            const token = req.query.token
            const verifyToken: any = verifyTokenAndGetPayload(String(token))
            if (!verifyToken.valid) {
                throw new Error("Link Gets expired please request resend the link again")
            }
            await services.auth.verifyUser(verifyToken.payload.userId)
            return res.redirect(`${envConfig.fontendUrl}/app/mail-verification/success`)
        } catch (error: any) {
            console.log("Error is ", error)
            return res.redirect(`${envConfig.fontendUrl}/app/mail-verification/failure?message=${error.message}`)
        }
    }

    static googleSignInSignUp: any = async (req: Request, res: Response) => {
        try {
            const token = req.query.code;
            let clientId = envConfig.google.clientId;
            let clientSecret = envConfig.google.secret;
            let REDIRECT_URI = envConfig.google.redirectUrl;
            const validateUser = await axios.post(
                `https://oauth2.googleapis.com/token`,
                {
                    code: token,
                    client_id: clientId,
                    client_secret: clientSecret,
                    redirect_uri: REDIRECT_URI,
                    grant_type: "authorization_code",
                }
            );
            const { id_token, access_token } = validateUser.data;
            const { email, name, picture } = await axios
                .get(
                    `https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=${access_token}`,
                    {
                        headers: {
                            Authorization: `Bearer ${id_token}`,
                        },
                    }
                )
                .then((res) => res.data)
                .catch((error) => {
                    console.error(`Failed to fetch user`);
                    throw new Error(error.message);
                });
            if (!email) throwError(ErrorTypes.EMAIL_NOT_FOUND);

            let user = await services.auth.loginThroughMethod(email);
            if (!user) {
                const createBody = {
                    email: email,
                    userName: name
                };
                user = await services.auth.register(createBody, SIgnINMethod.GOOGLE);
            }
            this.setCookie(res, user.token)
            return successResponse(res, 200, "User LoggedIn Successfully!", user)

        } catch (error) {
            return handleError(res, error)
        }
    };

    static microsoftSignInSignUp = async (req: any, res: any) => {
        try {
            const token = req.query.code;
            if (!token) throw "Token not found"

            const validateUser: any = await axios.post(
                "https://login.microsoftonline.com/common/oauth2/v2.0/token",
                new URLSearchParams({
                    client_id: envConfig.microsoft.clientId,
                    client_secret: envConfig.microsoft.secret,
                    redirect_uri: envConfig.microsoft.redirect,
                    grant_type: "authorization_code",
                    code: token,
                }),
                {
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded",
                    },
                }
            );

            const { access_token } = validateUser.data;
            const userInfo = await axios
                .get("https://graph.microsoft.com/v1.0/me", {
                    headers: {
                        Authorization: `Bearer ${access_token}`,
                    },
                })
                .then((res) => res.data)
                .catch((error) => {
                    throw String(error?.response?.data || "Error in fetching user info");
                });

            const email = userInfo.mail || userInfo.userPrincipalName;
            const name = userInfo.displayName;
            if (!email) throwError(ErrorTypes.EMAIL_NOT_FOUND)

            let user: any = await services.auth.loginThroughMethod(
                email
            );

            if (!user || user.length === 0) {
                const createBody = {
                    email: email,
                    userName: name,
                };
                user = await services.auth.register(
                    createBody,
                    SIgnINMethod.MICROSOFT
                );
            }
            return res.redirect(
                url.format({
                    pathname: `${envConfig.fontendUrl}/auth/callback/microsoft`,
                    query: { token: String(user.token) },
                })
            );
        } catch (error) {
            return res.redirect(
                url.format({
                    pathname: `${envConfig.fontendUrl}/auth/callback/microsoft`,
                    query: { error: String(error || "Error While Login to microsoft") },
                })
            );
        }
    };

}