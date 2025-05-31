import { and, eq, inArray } from "drizzle-orm";
import services from ".."
import { generateRandomUUId } from "../../config/constants"
import postgreDb from "../../config/db"
import { ErrorTypes, throwError } from "../../config/error"
import { folders, query, sets, setsToFolders, users } from "../../models/schema";
import { FolderObjectType, SetType } from "../../types/user";


export class set {

    static fomrmatFiles = (files: any[]) => {
        return files.map((file: any) => {
            return {
                ...file,
                files: file?.files?.map((f: any) => f.fileId)
            }
        })
    }

    static isSetBelongsToUser = async (setId: string, userId: number) => {
        console.log("Set id >>> ", setId, "user id >> ", userId)
        return await postgreDb.query.sets.findFirst({
            where: and(eq(sets.setId, setId), eq(sets.userId, userId), eq(sets.isDeleted, false)),
            columns: {
                id: true
            }
        })
    }

    static deleteSet = async (setId: string, userId: number) => {
        const isSetExists = await postgreDb.query.sets.findFirst({
            where: and(eq(sets.setId, setId), eq(sets.userId, userId), eq(sets.isDeleted, false))
        })
        if (!isSetExists) throw new Error("Set Not Exists")
        return await postgreDb
            .update(sets)
            .set({ isDeleted: true })
            .where(and(eq(sets.setId, setId), eq(sets.userId, userId)))
            .returning()
    }

    static getSetFilesDataBySetId = async (setId: string, userId: number) => {
        const userSets: any = await postgreDb.query.sets.findFirst({
            where: and(eq(sets.userId, userId), eq(sets.setId, setId)),
            columns: {
                setId: true,
                name: true,
                purpose: true,
                createdAt: true
            },
            with: {
                files: {
                    where: eq(setsToFolders.isDeleted, false),
                    columns: {
                        fileId: true
                    },
                    with: {
                        folder: {
                            where: eq(folders.isDeleted, false),
                            columns: {
                                name: true,
                                link: true,
                                meta: true
                            }
                        },
                    }
                },

            }
        })
        if (!userSets) {
            throw new Error("This set either not exists or not belongs to you")
        }
        const data = {
            ...userSets,
            files: userSets.files.filter((file: any) => file.folder)
        }
        console.log("User sets data is >>> ", userSets, data)
        return data;
    }

    static getSetFilesIdBySetId = async (setId: string, userId: number) => {
        let userSets: any = await postgreDb.query.sets.findFirst({
            where: and(eq(sets.userId, userId), eq(sets.setId, setId)),
            columns: {
                id: true,
                name: true,
                purpose: true,
                createdAt: true,
            },
            with: {
                files: {
                    where: eq(setsToFolders.isDeleted, false),
                    columns: {
                        fileId: true
                    },
                    with: {
                        folder: {
                            where: eq(folders.isDeleted, false),
                            columns: {
                                link: true,
                                meta: true
                            }
                        }
                    }
                }
            }
        })
        if (!userSets) {
            throw new Error("This set either not exists or not belongs to you")
        }

        console.log("User sets data is before >>> ", userSets)

        userSets = this.formatQuerySetData(userSets)

        console.log("User sets data is ", userSets)

        let links = {}
        if (userSets?.files) {
            userSets.files.map((f: any) => {
                if (f?.fileId) {
                    let fileId = f.fileId
                    let data = {
                        link: f?.folder?.link,
                        meta: f?.folder?.meta
                    }
                    links[fileId] = data
                }
            })
        }
        const files = this.fomrmatFiles([userSets])[0].files
        return { files, id: userSets.id, links, };
    }

    static setDataWithSetIdAndUserId = async (setId: string, userId: number) => {
        return await postgreDb.query.sets.findFirst({
            where: and(eq(sets.setId, setId), eq(sets.userId, userId))
        })
    }

    static deleteFileFromSet = async (setId: number, fileId: string) => {
        return await postgreDb
            .update(setsToFolders)
            .set({ isDeleted: true })
            .where(and(eq(setsToFolders.setId, setId), eq(setsToFolders.fileId, fileId)))
            .returning()
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
                queryId: queryId,
            }).returning()
            console.log("Query saved", data)
        } catch (error) {
            if (error.code === "23505") {
                throw new Error("Set with this query is already exists")
            }
            throw new Error("Error while adding query")
        }

    }

    static formatQuerySetData = (userSets: any) => {
        console.log("User sets are ", userSets)
        return {
            ...userSets,
            files: userSets?.files?.filter((file: any) => file?.folder)
        }
    }

    static getAllSetsQueryById = async (setId: string, userId: string) => {
        const user = await services.user.getUserById(userId)
        if (!user) {
            throwError(ErrorTypes.USER_NOT_FOUND)
        }
        let queryData = await postgreDb.query.sets.findFirst({
            where: and(eq(sets.setId, setId), eq(sets.userId, user.id)),
            with: {
                queries: {
                    columns: {
                        queryId: true
                    }
                },
                files: {
                    where: eq(setsToFolders.isDeleted, false),
                    columns: {
                        fileId: true
                    },
                    with: {
                        folder: {
                            where: eq(folders.isDeleted, false),
                            columns: {
                                link: true,
                                meta: true
                            }
                        }
                    }
                }
            }

        })
        queryData = this.formatQuerySetData(queryData)
        console.log("Query data >>>>>>>>>>>>>>> ", queryData)
        let links = {}
        if (queryData?.files) {
            queryData.files.map((f: any) => {
                if (f?.fileId) {
                    let fileId = f.fileId
                    let data = {
                        link: f?.folder?.link,
                        meta: f?.folder?.meta
                    }
                    links[fileId] = data
                }
            })
        }
        console.log("Links are >>> ", links)
        let formatted = []
        if (queryData?.queries) formatted = queryData.queries.map((q) => {
            return q.queryId
        })
        return { formatted, links }
    }



    static getAllUserSets = async (userId: number, type: SetType) => {
        let response = await postgreDb.query.sets.findMany({
            where: and(eq(sets.userId, userId), eq(sets.isDeleted, false), eq(sets.type, type)),
            columns: {
                setId: true,
                name: true,
                purpose: true,
                createdAt: true,
                type: true
            },
            with: {
                files: {
                    where: eq(setsToFolders.isDeleted, false),
                    columns: {
                        fileId: true
                    },
                    with: {
                        folder: {
                            where: eq(folders.isDeleted, false),
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
        console.log("Response >>>>>>>>>>>>>>>>>>>>>>>>> ", response)
        const data = response.map((res) => {
            return this.formatQuerySetData(res)
        })
        return data
    }

    static addFilesIntoSets = async (userId: number, setId: string, filesId: string[]) => {

        try {
            const isSetBelongToUser = await postgreDb.query.sets.findFirst({
                where: and(eq(sets.userId, userId), eq(sets.setId, setId)),
                columns: {
                    id: true,
                    name: true,
                    purpose: true,
                    createdAt: true,
                    type: true
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
                        eq(folder.isDeleted, false),
                        inArray(folder.id, filesId)
                    ),
                columns: {
                    id: true,
                },
            });

            console.log("Owned folders are", ownedFolders)
            if (filesId.length !== ownedFolders.length) {
                throw new Error("The files you mentioned either deleted or nor belongs to you.");
            }
            return await postgreDb.transaction(async (tx) => {
                const setDataOfUser = await postgreDb.query.setsToFolders.findMany({
                    where: and(inArray(setsToFolders.fileId, filesId), eq(setsToFolders.setId, isSetBelongToUser.id)),
                    columns: {
                        fileId: true,
                        setId: true,
                        isDeleted: true
                    }
                })

                const deletedFilesSet = new Set(setDataOfUser
                    .filter(file => file.isDeleted)
                    .map(f => f.fileId))

                const nonDeletedFilesSet = new Set(setDataOfUser
                    .filter(file => !file.isDeleted)
                    .map(f => f.fileId))

                let filesIdToAddInSet = []
                let deleteRecoverSet = []
                let repetedSets = []

                if (setDataOfUser.length === 0) {
                    filesIdToAddInSet = [...filesId]
                } else {
                    filesId.map((f) => {
                        if (deletedFilesSet.has(f)) deleteRecoverSet.push(f)
                        else if (nonDeletedFilesSet.has(f)) repetedSets.push(f)
                        else filesIdToAddInSet.push(f)
                    })
                }

                if (repetedSets.length > 0) {
                    throw new Error(`File with id ${repetedSets.join(" ")} are already present in the set`)
                }


                if (filesIdToAddInSet.length > 0) {
                    const dataTOFeed = filesIdToAddInSet.map(file => {
                        return {
                            setId: isSetBelongToUser.id,
                            fileId: file,
                        }
                    })
                    const files = await tx
                        .insert(setsToFolders)
                        .values(dataTOFeed)
                        .returning({
                            fileId: setsToFolders.fileId,
                        });

                    console.log("Files are>>>>>>>>>>>", files)

                }

                if (deleteRecoverSet.length > 0) {
                    const response = await postgreDb
                        .update(setsToFolders)
                        .set({ isDeleted: false })
                        .where(and(eq(setsToFolders.setId, isSetBelongToUser.id), inArray(setsToFolders.fileId, deleteRecoverSet)))
                        .returning();
                    console.log("Dekleted response >>>>>> ", response)
                }

                const formattedData = {
                    setId,
                    name: isSetBelongToUser.name,
                    purpose: isSetBelongToUser.purpose,
                    createdAt: isSetBelongToUser.createdAt,
                    type : isSetBelongToUser.type,
                    files: [...filesIdToAddInSet, ...deleteRecoverSet]
                }
                return formattedData

            })

        } catch (error) {
            if (error.code === "23505") {
                throw new Error("Some Files you included are already included in this set")
            }
            throw error
        }
    }

    static createSet = async (userId: string, name: string, purpose: string, filesId: string[], type: SetType) => {

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
                    purpose,
                    type
                }).returning({
                    id: sets.id,
                    setId: sets.id,
                    type: sets.type
                })
            console.log("Created set is ", set)
            return await this.addFilesIntoSets(user.id, newSetId, filesId)
        })
    }
}