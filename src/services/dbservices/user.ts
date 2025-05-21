import { eq } from "drizzle-orm"
import postgreDb from "../../config/db"
import { folders, users } from "../../models/schema"
import { FolderObjectType, NestedDocumentsInterface } from "../../types/user"
import { generateRandomUUId } from "../../config/constants"

export class user {
    static getUserById = async (userId: string) => {
        const user = await postgreDb.query.users.findFirst({
            where: eq(users.userId, userId),
            columns: {
                id: true,
                userId: true,
                email: true,
                userName: true,
                phone: true,
                tokens: true,
                signMethod: true,
                isVerified: true
            },
        })
        return user;
    }

    // const initialFileSystem: FileSystemItem[] = [
    //     {
    //       id: "1",
    //       name: "Documents",
    //       type: FileItemType.FOLDER,
    //       children: [
    //         {
    //           id: "2",
    //           name: "Reports",
    //           type: FileItemType.FOLDER,
    //           children: [
    //             { id: "5", name: "Annual Report.pdf", type: FileItemType.FILE },
    //             { id: "6", name: "Quarterly Stats.xlsx", type: FileItemType.FILE },
    //           ],
    //         },
    //         {
    //           id: "3",
    //           name: "Guidelines",
    //           type: FileItemType.FOLDER,
    //           children: [
    //             { id: "7", name: "Style Guide.docx", type: FileItemType.FILE },
    //             { id: "8", name: "Brand Manual.pdf", type: FileItemType.FILE },
    //           ],
    //         },
    //         { id: "4", name: "Readme.txt", type: FileItemType.FILE },
    //       ],
    //     },
    //     {
    //       id: "9",
    //       name: "Projects",
    //       type: FileItemType.FOLDER,
    //       children: [
    //         { id: "10", name: "Project A", type: FileItemType.FILE },
    //         { id: "11", name: "Project B", type: FileItemType.FILE },
    //       ],
    //     },
    //   ];

    static recursiveAddFolderOrFile =
        (
            documents: NestedDocumentsInterface,
            parentId: string,
            type: FolderObjectType,
            folderName: string | null,
            files: { id: string, name: string, }[]
        ) => {

            function childernData(childData: NestedDocumentsInterface) {
                if (type === FolderObjectType.FOLDER) {
                    childData.childern.push({
                        id: generateRandomUUId(),
                        name: folderName,
                        type: FolderObjectType.FOLDER,
                        childern: []
                    })
                } else {
                    files.map((file) => {
                        childData.childern.push({
                            id: file.id,
                            name: file.name,
                            type: FolderObjectType.FILE,
                            childern: null
                        })
                    })
                }
            }

            if (documents.id === parentId) {
                if (documents.type === FolderObjectType.FILE) throw new Error("YOu can't add folder inside file")
                return childernData(documents)
            }
            else documents.childern?.map((child) => {
                return this.recursiveAddFolderOrFile(child, parentId, type, folderName, files)
            })
        }



    static getALlUserFolders = async (userId: number) => {
        const userFolders = await postgreDb.query.folders.findMany({
            where: eq(folders.userId, userId)
        })
        function buildTree(folderList, parentId = null) {
            return folderList
                .filter(folder => folder.parentId === parentId)
                .map(folder => ({
                    // ...folder,
                    id: folder.id,
                    name: folder.name,
                    type: folder.type,
                    parentId: folder.parentId,
                    children: buildTree(folderList, folder.id)
                }));
        }
        const nestedFolders = buildTree(userFolders);
        return nestedFolders;
    }

    static addFolderOrFileTable = async (
        folderName: string,
        parentId: string,
        type: FolderObjectType,
        userId: string,
        files: { id: string, name: string }[]
    ) => {
        const folder = await postgreDb.select({ documents: users.documents }).from(users).where(eq(users.userId, userId))
        if (folder.length === 0) throw new Error("User not found")
        let documents: any = folder[0].documents
        if (!documents) {
            documents = {
                id: generateRandomUUId(),
                name: folderName,
                type: FolderObjectType.FOLDER,
                childern: []
            }
        } else {
            console.log("Documents is >>>>", documents)
            const data = this.recursiveAddFolderOrFile(documents, parentId, type, folderName, files)
            console.log("Final data is ", data)
        }
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
                link: string
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
                type: folders.type
            })
        return addFiles;
    }

    static addFolderOrFile = async (
        folderName: string,
        parentId: string,
        type: FolderObjectType,
        userId: number,
        files: { id: string, name: string }[]
    ) => {

        console.log("User id is ", userId)
        console.log("POarent is ", parentId)

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
            })

        return addFOlder

        // const folder = await postgreDb.select({ documents: users.documents }).from(users).where(eq(users.userId, userId))
        // if (folder.length === 0) throw new Error("User not found")
        // let documents: any = folder[0].documents
        // if (!documents) {
        //     documents = {
        //         id: generateRandomUUId(),
        //         name: folderName,
        //         type: FolderObjectType.FOLDER,
        //         childern: []
        //     }
        // } else {
        //     console.log("Documents is >>>>", documents)
        //     const data = this.recursiveAddFolderOrFile(documents, parentId, type, folderName, files)
        //     console.log("Final data is ", data)
        // }
        // return await postgreDb.update(users).set({ documents }).where(eq(users.userId, userId)).returning({ documents: users.documents })

    }
}