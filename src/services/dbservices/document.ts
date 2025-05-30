import { and, eq, inArray } from "drizzle-orm";
import postgreDb from "../../config/db";
import { FolderModal, folders, sets, setsToFolders } from "../../models/schema";
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
                    isProcessed: folder.isProcessed,
                    ...(folder.type === FolderObjectType.FILE && { link: folder.link }),
                    ...(folder.type === FolderObjectType.FILE && { meta: folder.meta }),
                    createdAt: folder.createdAt,
                    children: buildTree(folderList, folder.id)
                }));
        }
        const nestedFolders = buildTree(userFolders, null);
        return nestedFolders;
    }

    static updateFoldersId = async (data: { node_id: string, _id: string }[]) => {
        const updatedFolders = await Promise.all(
            data.map(async (d) => {
                try {
                    console.log("Data is >>>>>>> ", d);
                    const updated = await postgreDb
                        .update(folders)
                        .set({ id: d._id, isProcessed: true })
                        .where(and(eq(folders.id, d.node_id), eq(folders.type, FolderObjectType.FILE)))
                        .returning({
                            id: folders.id
                        });
                    console.log("Updated is >>>>> ", updated);
                    return updated[0];
                } catch (error) {
                    console.log("Error While updating >>>>>> ", error, "Object is >>>> ", d)
                }
            })
        );

        return updatedFolders;
    };


    static deleteOrRecoverFileOrFolder = async (fileId: string, userId: number, shouldDelete: boolean) => {
        return await postgreDb.transaction(async (tx) => {
            const isFolderOrFileBelongToUser = await tx.query.folders.findFirst({
                where: and(eq(folders.id, fileId), eq(folders.userId, userId))
            })
            if (!isFolderOrFileBelongToUser) {
                throw new Error("Either set not exists or nor belongs to you ")
            }
            console.log(">>>>>>>>>>>>>>>>>>>>>>>> ", isFolderOrFileBelongToUser)
            if (isFolderOrFileBelongToUser.type === FolderObjectType.FILE) {
                return await tx.update(folders).set({ isDeleted: shouldDelete }).where(eq(folders.id, fileId))
            }
            else {
                console.log("hit here >>>>>>>>>> ")
                const ids = await this.getALLFilesOfFolder(fileId, userId)
                console.log("Ids >>>> ", ids)
                return await tx
                    .update(folders)
                    .set({ isDeleted: shouldDelete })
                    .where(inArray(folders.id, ids))
                    .returning()
            }
        })
    }

    static getALLFilesOfFolder = async (fileId: string, userId: number) => {
        let ids = []
        const allFolders = await this.getALLFoldersDataID(fileId, userId)
        function getAllIds(allFolders: any) {
            allFolders?.forEach((f: any) => {
                if (f.type === FolderObjectType.FILE) ids.push(f.id)
                getAllIds(f.children)
            })
        }
        getAllIds(allFolders)
        return ids
    }

    static getALLFoldersDataID = async (fileId: string, userId: number) => {
        const userFolders = await postgreDb.query.folders.findMany({
            where: eq(folders.userId, userId)
        })
        function buildTree(folderList: any, parentId: any) {
            return folderList
                .filter((folder: any) => folder.parentId === parentId)
                .map((folder: any) => ({
                    id: folder.id,
                    type: folder.type,
                    parentId: folder.parentId,
                    children: buildTree(folderList, folder.id)
                }));
        }
        const nestedFolders = buildTree(userFolders, fileId);
        return nestedFolders
    }



    static isFolderExists = async (folderId: string) => {
        return await postgreDb.query.folders.findFirst({
            where: eq(folders.id, folderId)
        })
    }

    static addFiles = async (
        files: FolderModal[]
    ) => {
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
                createdAt: folders.createdAt,
                isProcessed: folders.isProcessed
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

    static isFileOrFolderRelatesToUser = async (userId: number, fileId: string) => {
        const response = await postgreDb.query.folders.findFirst({
            where: and(eq(folders.id, fileId), eq(folders.userId, userId))
        })
        if (!response) {
            throw new Error("This Folder is not belongs to this user")
        }
    }

    static reprocessTheFiles = async () => {
        return await postgreDb.query.folders.findMany({
            where: and(
                eq(folders.type, FolderObjectType.FILE),
                eq(folders.isProcessed, false),
                // eq(folders.userId, 18),
                eq(folders.isDeleted, false)
            ),
            // limit: 10,
            columns: {
                id: true,
                link: true,
                meta: true
            }
        })
    }
}