import { boolean, integer, jsonb, pgTable, serial, varchar } from "drizzle-orm/pg-core";
import { InferSelectModel, relations } from "drizzle-orm";


export const users = pgTable("users", {
    id: serial("id").primaryKey(),
    userId: varchar("userId").unique(),
    email: varchar("email").unique(),
    password: varchar("password"),
    userName: varchar("userName"),
    phone: varchar("phone"),
    tokens: varchar("tokens"),
    signMethod: varchar("signMethod"),
    isVerified: boolean("isVerified"),
    documents: jsonb("documents"),
})

export const folders = pgTable("folders", {
    id: varchar().primaryKey(),
    name: varchar().notNull(),
    parentId: varchar().references(() => folders.id),
    type: varchar().notNull(),
    link : varchar(),
    userId: integer().references(() => users.id),
});

export const usersRelations = relations(users, ({ many }) => ({
    folders: many(folders),
}));

export const foldersRelations = relations(folders, ({ one, many }) => ({
    user: one(users, {
        fields: [folders.userId],
        references: [users.id],
    }),
}));

export type FolderModal = InferSelectModel<typeof folders>;
export type UsersModal = InferSelectModel<typeof users>;