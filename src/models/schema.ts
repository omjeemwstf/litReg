import { boolean, integer, jsonb, pgTable, primaryKey, serial, timestamp, varchar } from "drizzle-orm/pg-core";
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
    isDeleted: boolean().default(false)
})

export const folders = pgTable("folders", {
    id: varchar().primaryKey(),
    name: varchar().notNull(),
    parentId: varchar().references(() => folders.id),
    type: varchar().notNull(),
    link: varchar(),
    isProcessed: boolean().default(true),
    meta: jsonb(),
    createdAt: timestamp().defaultNow(),
    userId: integer().references(() => users.id),
    isDeleted: boolean().default(false)
});

export const sets: any = pgTable("sets", {
    id: serial().primaryKey(),
    setId: varchar().unique().notNull(),
    name: varchar().notNull(),
    type : varchar().default("query"),
    purpose: varchar().notNull(),
    userId: integer().notNull().references(() => users.id),
    createdAt: timestamp().defaultNow(),
    isDeleted: boolean().default(false)
});

export const query: any = pgTable("query", {
    id: serial().primaryKey(),
    setId: integer().notNull().references(() => sets.id),
    queryId: varchar().unique(),
    isDeleted: boolean().default(false),
    createdAt: timestamp().defaultNow()
})

export const setsToFolders: any = pgTable("setsToFolders",
    {
        setId: integer().notNull().references(() => sets.id),
        fileId: varchar().notNull().references(() => folders.id),
        isDeleted: boolean().default(false),
        createdAt: timestamp().defaultNow()
    },
    (table) => [primaryKey({ columns: [table.setId, table.fileId] })]
);

export const instructionSheet: any = pgTable("instructionSheet", {
    id: serial().primaryKey(),
    sheetId: varchar().unique(),
    link: varchar(),
    meta: jsonb(),
    userId: integer().notNull().references(() => users.id),
    setId: integer().notNull().references(() => sets.id),
    isDeleted: boolean().default(false),
    createdAt: timestamp().defaultNow()
})

export const instructionSheetRelations = relations(instructionSheet, ({ one }) => ({
    user: one(users, {
        fields: [instructionSheet.userId],
        references: [users.id]
    }),
    set: one(sets, {
        fields: [instructionSheet.setId],
        references: [sets.id]
    })
}))

export const setsRelations = relations(sets, ({ one, many }) => ({
    user: one(users, {
        fields: [sets.userId],
        references: [users.id],
    }),
    files: many(setsToFolders),
    queries: many(query),
    sheet: many(instructionSheet)
}));

export const queryRelations = relations(query, ({ one }) => ({
    set: one(sets, {
        fields: [query.setId],
        references: [sets.id]
    })
}))


export const usersRelations = relations(users, ({ many }) => ({
    folders: many(folders),
    sets: many(sets),
    sheet: many(instructionSheet)
}));

export const foldersRelations = relations(folders, ({ one, many }) => ({
    user: one(users, {
        fields: [folders.userId],
        references: [users.id],
    }),
    sets: many(setsToFolders),
}));

export const setsToFoldersRelations = relations(setsToFolders, ({ one }) => ({
    set: one(sets, {
        fields: [setsToFolders.setId],
        references: [sets.id],
    }),
    folder: one(folders, {
        fields: [setsToFolders.fileId],
        references: [folders.id],
    }),
}));

export type FolderModal = InferSelectModel<typeof folders>;
export type UsersModal = InferSelectModel<typeof users>;