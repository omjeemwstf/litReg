import { eq } from "drizzle-orm"
import postgreDb from "../../config/db"
import { users } from "../../models/schema"

export class user {
    static getUserById = async (userId: string) => {
        const user = await postgreDb.query.users.findFirst({
            where: eq(users.userId, userId),
            columns : {
                userId : true,
                email : true,
                userName : true,
                phone : true,
                tokens : true,
                signMethod : true,
                isVerified : true
            },
        })
        return user;
    }
}