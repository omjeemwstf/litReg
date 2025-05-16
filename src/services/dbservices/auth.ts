import { eq } from "drizzle-orm"
import postgreDb from "../../config/db"
import { UsersModal, users } from "../../models/schema"
import { ErrorTypes, throwError } from "../../config/error"
import { bcryptPassword, validatePassword } from "../../config/passwordHash"
import { generateAuthTokens } from "../../config/token"

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
                    password: signMethod ? null : await bcryptPassword(details.password),
                })
                .onConflictDoNothing({ target: users.email })
                .returning({
                    id: users.id,
                    userId: users.userId,
                    phone: users.phone,
                    userName: users.userName,
                    email: users.email,
                    tokens: users.tokens,
                    signMethod: users.signMethod
                });
        } catch (error) {
            throw new Error(error);
        }
    };

    static userDetails = async (users: UsersModal) => {
        const Token = generateAuthTokens({ userId: users.userId });
        return {
            userId: users.userId,
            email: users.email,
            phone: users.phone,
            userName: users.userName,
            tokens: users.tokens,
            signMethod: users.signMethod,
            token: Token,          
        };
    };


    static register = async (details: any, fromMethod: string): Promise<any> => {

        return await postgreDb.transaction(async (tx) => {

            const registerUser = await this.insertUser(details, tx, fromMethod);

            if (registerUser.length <= 0) throwError(ErrorTypes.USER_ALREADY_EXISTS);

            return await this.userDetails(registerUser[0]);
        });

    };

    static loginThroughMethod = async (email: any, fromMethod?: string): Promise<any> => {
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