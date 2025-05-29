import bcrypt from "bcrypt"
import { ErrorTypes, throwError } from "./error"

const bcryptPassword = async (password: string) => {
    try {
        return await bcrypt.hash(password, 10)
    } catch (error) {
        throw new Error(error)
    }
}

const validatePassword = async (password: string, hash: string) => {
    try {
        return await bcrypt.compare(password, hash);
    } catch (err) {
        throwError(ErrorTypes.INVALID_PASSWORD)
    }
}

export { bcryptPassword, validatePassword }