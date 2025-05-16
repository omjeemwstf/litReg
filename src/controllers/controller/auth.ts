import { Request, Response } from "express";
import { successResponse } from "../../config/response";
import { ErrorTypes, handleError, throwError } from "../../config/error";
import services from "../../services";
import { envConfig } from "../../config/envConfigs";
import axios from "axios";

export class auth {
    static login: any = async (req: Request, res: Response) => {
        try {
            const { email, password } = req.body;
            if (!email) throwError(ErrorTypes.EMAIL_NOT_FOUND)
            const user = await services.auth.login(email, password);
            return successResponse(res, 200, "User logged in successfully!", user)
        } catch (error) {
            return handleError(res, error)
        }
    }

    static register: any = async (req: Request, res: Response) => {
        try {
            const { email, password, userName } = req.body;
            const registeredUser = await services.auth.register(
                { email, password, userName },
                "password"
            );
            return successResponse(res, 200, "User registered Successfully!", registeredUser)
        } catch (error) {
            return handleError(res, error)
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

            let user = await services.auth.loginThroughMethod(email, "google");
            if (!user) {
                const createBody = {
                    email: email,
                    userName : name
                };
                user = await services.auth.register(createBody, "google");
            }
            return successResponse(res, 200, "User LoggedIn Successfully!", user)

        } catch (error) {
            return handleError(res, error)
        }
    };

}