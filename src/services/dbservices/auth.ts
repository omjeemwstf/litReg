import { eq } from "drizzle-orm"
import postgreDb from "../../config/db"
import { UsersModal, users } from "../../models/schema"
import { ErrorTypes, throwError } from "../../config/error"
import { bcryptPassword, validatePassword } from "../../config/passwordHash"
import { generateAuthTokens } from "../../config/token"
import services from ".."
import { envConfig } from "../../config/envConfigs"
import { SIgnINMethod, emailTemplateForUserVerification } from "../../config/constants"

export class auth {

    static generateId = () => {
        return Math.random().toString(36).substr(2, 8).toUpperCase();
    }

    static getUserByEmail = async (email: string) => {
        const user = await postgreDb.query.users.findFirst({
            where: eq(users.email, email),
        })
        if (!user) {
            throwError(ErrorTypes.EMAIL_NOT_FOUND)
        }
        return user;
    }

    static login = async (email: string, password: string) => {
        const user = await this.getUserByEmail(email)
        if (!user.password) {
            throwError(ErrorTypes.PASSWORD_NOT_FOUND)
        }
        await validatePassword(password, user.password)
        return this.userDetails(user)
    }

    static insertUser = async (details: any, tx: any, signMethod: string) => {
        try {
            return await tx
                .insert(users)
                .values({
                    userId: this.generateId(),
                    email: details.email,
                    signMethod,
                    userName: details.userName,
                    password: signMethod === SIgnINMethod.PASSWORD ? await bcryptPassword(details.password) : null,
                    isVerified: signMethod === SIgnINMethod.PASSWORD ? false : true
                })
                .onConflictDoNothing({ target: users.email })
                .returning({
                    id: users.id,
                    userId: users.userId,
                    phone: users.phone,
                    userName: users.userName,
                    email: users.email,
                    tokens: users.tokens,
                    signMethod: users.signMethod,
                    isVerified: users.isVerified
                });
        } catch (error) {
            throw new Error(error);
        }
    };

    static userDetails = (users: UsersModal) => {
        const Token = users.isVerified ? generateAuthTokens({ userId: users.userId }) : "";
        return {
            userId: users.userId,
            email: users.email,
            phone: users.phone,
            isVerified : users.isVerified,
            userName: users.userName,
            tokens: users.tokens,
            signMethod: users.signMethod,
            token: Token,
        };
    };

    static verifyUser = async (userId: string) => {
        return await postgreDb.update(users).set({ isVerified: true }).where(eq(users.userId, userId))
    }

    static sendEmailVerifyLink = async (email: string, userName: string, userId: string) => {
        const token = generateAuthTokens({ userId: userId })
        const link = `${envConfig.backendUrl}/auth/verify-email?token=${token}`
        const subject = "Verify Your Email to Activate Your Account"
        const template = emailTemplateForUserVerification(email, userName, link)
        await services.mail.sendEmailWithSEC([email], template, subject)
    }


    static register = async (details: any, fromMethod: string): Promise<any> => {

        return await postgreDb.transaction(async (tx) => {

            const registerUser = await this.insertUser(details, tx, fromMethod);
            if (registerUser.length <= 0) throwError(ErrorTypes.USER_ALREADY_EXISTS);
            if (fromMethod === SIgnINMethod.PASSWORD) {
                await this.sendEmailVerifyLink(details.email, details.userName, registerUser[0].userId)
            }
            return this.userDetails(registerUser[0]);
        });

    };

    static loginThroughMethod = async (email: any): Promise<any> => {
        try {
            const findUser = await postgreDb.query.users.findFirst({
                where: eq(users.email, email),
            })

            if (findUser)
                return this.userDetails(findUser);

            else
                return null;

        } catch (error) {
            throw new Error(error.message);
        }
    };
}