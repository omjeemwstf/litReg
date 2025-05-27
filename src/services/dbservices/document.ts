import { and, eq } from "drizzle-orm";
import postgreDb from "../../config/db";
import { folders, sets, setsToFolders } from "../../models/schema";
import { FolderObjectType } from "../../types/user";
import { generateRandomUUId } from "../../config/constants";
import services from "..";
import { ErrorTypes, throwError } from "../../config/error";

export class documents {

    static getALLUserFoldersAndFiles = async (userId: number) => {
        const userFolders = await postgreDb.query.folders.findMany({
            where: eq(folders.userId, userId)
        })
        function buildTree(folderList: any, parentId: any) {
            return folderList
                .filter((folder: any) => folder.parentId === parentId && !folder.isDeleted)
                .map((folder: any) => ({
                    id: folder.id,
                    name: folder.name,
                    type: folder.type,
                    parentId: folder.parentId,
                    ...(folder.type === FolderObjectType.FILE && { link: folder.link }),
                    ...(folder.type === FolderObjectType.FILE && { meta: folder.meta }),
                    createdAt: folder.createdAt,
                    children: buildTree(folderList, folder.id)
                }));
        }
        const nestedFolders = buildTree(userFolders, null);
        return nestedFolders;
    }

    static deleteFileOrFolder = async (fileId: string, userId: number) => {
        return await postgreDb.transaction(async (tx) => {
            const isSetBelongToUser = await tx.query.folders.findFirst({
                where: and(eq(folders.id, fileId), eq(folders.userId, userId))
            })
            if (!isSetBelongToUser) {
                throw new Error("Either set not exists or nor belongs to you ")
            }
            return await tx.update(folders).set({ isDeleted: true }).where(eq(folders.id, fileId))
        })
    }



    static isFolderExists = async (folderId: string) => {
        return await postgreDb.query.folders.findFirst({
            where: eq(folders.id, folderId)
        })
    }

    static addFiles = async (
        files:
            {
                id: string,
                name: string,
                parentId: string,
                userId: string,
                type: FolderObjectType.FILE,
                link: string,
                meta: any
            }[]
    ) => {
        console.log("Add files data is ", files)
        const addFiles = await postgreDb
            .insert(folders)
            .values(files)
            .returning({
                id: folders.id,
                name: folders.name,
                parentId: folders.parentId,
                type: folders.type,
                link: folders.link,
                meta: folders.meta,
                createdAt: folders.createdAt
            })
        return addFiles;
    }

    static getFileDataById = async (fileId: string, userId: string) => {
        const user = await services.user.getUserById(userId)
        if (!user) {
            throwError(ErrorTypes.USER_NOT_FOUND)
        }
        const response = await postgreDb.query.folders.findFirst({
            where: and(eq(folders.id, fileId), eq(folders.userId, user.id)),
            columns: {
                id: true,
                type: true,
                link: true,
                meta: true
            }
        })
        return response;
    }


    static addFolder = async (
        folderName: string,
        parentId: string,
        type: FolderObjectType,
        userId: number,
    ) => {

        const addFOlder = await postgreDb
            .insert(folders)
            .values({
                id: generateRandomUUId(),
                name: folderName,
                parentId,
                type,
                userId
            })
            .returning({
                id: folders.id,
                name: folders.name,
                parentId: folders.parentId,
                type: folders.type,
                createdAt: folders.createdAt
            })

        return addFOlder
    }
}