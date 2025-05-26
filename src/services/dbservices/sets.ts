import { and, eq } from "drizzle-orm";
import services from ".."
import { generateRandomUUId } from "../../config/constants"
import postgreDb from "../../config/db"
import { ErrorTypes, throwError } from "../../config/error"
import { query, sets, setsToFolders, users } from "../../models/schema";
import { FolderObjectType } from "../../types/user";


export class set {

    static fomrmatFiles = (files: any[]) => {
        return files.map((file: any) => {
            return {
                ...file,
                files: file?.files?.map((f: any) => f.fileId)
            }
        })
    }

    static getSetFilesDataBySetId = async (setId: string, userId: number) => {
        const userSets = await postgreDb.query.sets.findFirst({
            where: and(eq(sets.userId, userId), eq(sets.setId, setId)),
            columns: {
                id: true,
                name: true,
                purpose: true,
                createdAt: true
            },
            with: {
                files: {
                    columns: {
                        fileId: true
                    },
                    with: {
                        folder: {
                            columns: {
                                name: true,
                                link: true,
                                meta: true
                            }
                        }
                    }
                },
            }
        })
        if (!userSets) {
            throw new Error("This set either not exists or not belongs to you")
        }
        return userSets;
    }

    static getSetFilesIdBySetId = async (setId: string, userId: number) => {
        const userSets = await postgreDb.query.sets.findFirst({
            where: and(eq(sets.userId, userId), eq(sets.setId, setId)),
            columns: {
                id: true,
                name: true,
                purpose: true,
                createdAt: true
            },
            with: {
                files: {
                    columns: {
                        fileId: true
                    },
                }
            }
        })
        if (!userSets) {
            throw new Error("This set either not exists or not belongs to you")
        }
        const files = this.fomrmatFiles([userSets])[0].files
        return { files, id: userSets.id };
    }

    static getSetDataByIntegerSetData = async (setId: string) => {
        return await postgreDb.query.sets.findFirst({
            where: eq(sets.setId, setId),
            columns: {
                id: true
            }
        })
    }

    static saveQueryId = async (setId: number, queryId: string) => {
        try {
            const data = await postgreDb.insert(query).values({
                setId: setId,
                queryId: queryId
            }).returning()
            console.log("Query saved", data)
        } catch (error) {
            if (error.code === "23505") {
                throw new Error("Set with this query is already exists")
            }
            throw new Error("Error while adding query")
        }

    }

    static getAllSetsQueryById = async (setId: string, userId: string) => {
        const user = await services.user.getUserById(userId)
        if (!user) {
            throwError(ErrorTypes.USER_NOT_FOUND)
        }
        const queryData = await postgreDb.query.sets.findFirst({
            where: and(eq(sets.setId, setId), eq(sets.userId, user.id)),
            with: {
                query: {

                }
            }
        })

    }



    static getAllUserSets = async (userId: string) => {
        const user = await services.user.getUserById(userId)
        if (!user) throwError(ErrorTypes.USER_NOT_FOUND)
        const response = await postgreDb.query.sets.findMany({
            where: eq(sets.userId, user.id),
            columns: {
                setId: true,
                name: true,
                purpose: true,
                createdAt: true
            },
            with: {
                files: {
                    columns: {
                        fileId: true
                    },
                    with: {
                        folder: {
                            columns: {
                                // id: true,
                                name: true, // this is your 'title'
                                // type: true,
                                link: true,
                                meta: true
                            }
                        }
                    }
                },
            }
        })
        return response
    }

    static addFilesIntoSets = async (userId: number, setId: string, filesId: string[]) => {

        try {
            const isSetBelongToUser = await postgreDb.query.sets.findFirst({
                where: and(eq(sets.userId, userId), eq(sets.setId, setId)),
                columns: {
                    id: true,
                    name: true,
                    purpose: true,
                    createdAt: true
                }
            })
            console.log("Is set belongs to user ", isSetBelongToUser)
            if (!isSetBelongToUser) {
                throwError(ErrorTypes.SET_NOT_BELONGS_TO_THIS_USER)
            }
            const ownedFolders = await postgreDb.query.folders.findMany({
                where: (folder, { and, eq, inArray }) =>
                    and(
                        eq(folder.userId, userId),
                        eq(folder.type, FolderObjectType.FILE),
                        inArray(folder.id, filesId)
                    ),
                columns: {
                    id: true,
                },
            });
            console.log("Owned folders are", ownedFolders)
            if (filesId.length !== ownedFolders.length) {
                throw new Error("Some folders are not valid for this user or not of type 'file'");
            }
            const data = filesId.map(fileId => ({
                setId: isSetBelongToUser.id,
                fileId
            }))
            console.log("Data files ", data)
            const files = await postgreDb
                .insert(setsToFolders)
                .values(data)
                .returning({
                    fileId: setsToFolders.fileId
                });

            console.log("Response is ", files)
            const formattedData = {
                setId,
                name: isSetBelongToUser.name,
                purpose: isSetBelongToUser.purpose,
                createdAt: isSetBelongToUser.createdAt,
                files: files.map((f) => f.fileId)
            }
            return formattedData
        } catch (error) {
            if (error.code === "23505") {
                throw new Error("Some Files you included are already included in this set")
            }
            throw error
        }
    }

    static createSet = async (userId: string, name: string, purpose: string, filesId: string[]) => {

        return await postgreDb.transaction(async (tx) => {
            const user = await services.user.getUserById(userId)
            if (!user) {
                throwError(ErrorTypes.USER_NOT_FOUND)
            }
            const newSetId = generateRandomUUId().toString()
            const set = await tx
                .insert(sets)
                .values({
                    setId: newSetId,
                    userId: user.id,
                    name,
                    purpose
                }).returning({
                    id: sets.id,
                    setId: sets.id
                })
            console.log("Created set is ", set)
            return await this.addFilesIntoSets(user.id, newSetId, filesId)
        })
    }
}