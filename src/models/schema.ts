import { pgTable, serial, varchar } from "drizzle-orm/pg-core";
import { InferSelectModel } from "drizzle-orm";


export const users = pgTable("users", {
    id: serial("id").primaryKey(),
    userId: varchar("userId").unique(),
    email: varchar("email").unique(),
    password: varchar("password"),
    userName: varchar("userName"),
    phone: varchar("phone"),
    tokens: varchar("tokens"),
    signMethod: varchar("signMethod")
})

export type UsersModal = InferSelectModel<typeof users>;