import { and, eq } from "drizzle-orm"
import postgreDb from "../../config/db"
import { instructionSheet, sets } from "../../models/schema"
import { SetType } from "../../types/user"


export class indegators {

    static getAllUsersSheet = async (userId: number) => {
        return await postgreDb.query.instructionSheet.findMany({
            where: and(eq(instructionSheet.userId, userId), eq(instructionSheet.isDeleted, false)),
            columns: {
                sheetId: true,
                link: true,
                meta: true,
                createdAt: true
            },
            with: {
                set: {
                    columns: {
                        setId: true
                    }
                }
            }
        })
    }

    static deleteSheet = async (sheetId: string, userId: number) => {
        return await postgreDb
            .update(instructionSheet)
            .set({ isDeleted: true })
            .where(
                and(
                    eq(instructionSheet.sheetId, sheetId),
                    eq(instructionSheet.userId, userId)
                )
            ).returning({
                sheetId: instructionSheet.sheetId,
                meta: instructionSheet.meta
            })
    }

    static isSheetBelongsToUser = async (sheetId: string, userId: number) => {
        return await postgreDb.query.instructionSheet.findFirst({
            where: and(
                eq(instructionSheet.sheetId, sheetId),
                eq(instructionSheet.userId, userId),
                eq(instructionSheet.isDeleted, false)
            ),
            columns: {
                sheetId: true,
            },
            with: {
                set: {
                    columns: {
                        setId: true
                    }
                }
            }
        })
    }


    static isSetBelongsToUserAndLLMType = async (setId: string, userId: number) => {
        return await postgreDb.query.sets.findFirst({
            where: and(
                eq(sets.setId, setId),
                eq(sets.userId, userId),
                eq(sets.type, SetType.LLM),
                eq(sets.isDeleted, false)
            ),
            columns: {
                id: true,
                type: true
            }
        })
    }


    static getAllSetSheets = async (setId: number) => {
        return await postgreDb.query.instructionSheet.findMany({
            where: and(
                eq(instructionSheet.isDeleted, false),
                eq(instructionSheet.setId, setId)
            ),
            columns: {
                sheetId: true,
                link: true,
                meta: true,
                createdAt: true
            },
            with: {
                set: {
                    columns: {
                        setId: true
                    }
                }
            }
        })
    }

    static getALLDocumentsOfSheet = async (sheetId: string) => {
        return await postgreDb.query.instructionSheet.findFirst({
            where: and(
                eq(instructionSheet.isDeleted, false),
                eq(instructionSheet.sheetId, sheetId)
            ),
            columns: {
                sheetId: true,
                link: true,
                meta: true,
                createdAt: true
            },
            with: {
                set: {
                    columns: {
                        id: true
                    }
                }
            }
        })
    }
}