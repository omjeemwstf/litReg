import { and, eq } from "drizzle-orm";
import postgreDb from "../../config/db";
import { folders, sets, setsToFolders } from "../../models/schema";
import { FolderObjectType } from "../../types/user";
import { generateRandomUUId } from "../../config/constants";

export class documents {

    static getALLUserFoldersAndFiles = async (userId: number) => {
        const userFolders = await postgreDb.query.folders.findMany({
            where: eq(folders.userId, userId)
        })
        function buildTree(folderList: any, parentId: any) {
            return folderList
                .filter((folder: any) => folder.parentId === parentId)
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