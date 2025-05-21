import { eq } from "drizzle-orm"
import postgreDb from "../../config/db"
import { users } from "../../models/schema"
import { ErrorTypes, throwError } from "../../config/error"

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
}


// static addFolderOrFileTable = async (
//     folderName: string,
//     parentId: string,
//     type: FolderObjectType,
//     userId: string,
//     files: { id: string, name: string }[]
// ) => {
//     const folder = await postgreDb.select({ documents: users.documents }).from(users).where(eq(users.userId, userId))
//     if (folder.length === 0) throw new Error("User not found")
//     let documents: any = folder[0].documents
//     if (!documents) {
//         documents = {
//             id: generateRandomUUId(),
//             name: folderName,
//             type: FolderObjectType.FOLDER,
//             childern: []
//         }
//     } else {
//         console.log("Documents is >>>>", documents)
//         const data = this.recursiveAddFolderOrFile(documents, parentId, type, folderName, files)
//         console.log("Final data is ", data)
//     }
// }




// static recursiveAddFolderOrFile =
//     (
//         documents: NestedDocumentsInterface,
//         parentId: string,
//         type: FolderObjectType,
//         folderName: string | null,
//         files: { id: string, name: string, }[]
//     ) => {

//         function childernData(childData: NestedDocumentsInterface) {
//             if (type === FolderObjectType.FOLDER) {
//                 childData.childern.push({
//                     id: generateRandomUUId(),
//                     name: folderName,
//                     type: FolderObjectType.FOLDER,
//                     childern: []
//                 })
//             } else {
//                 files.map((file) => {
//                     childData.childern.push({
//                         id: file.id,
//                         name: file.name,
//                         type: FolderObjectType.FILE,
//                         childern: null
//                     })
//                 })
//             }
//         }

//         if (documents.id === parentId) {
//             if (documents.type === FolderObjectType.FILE) throw new Error("YOu can't add folder inside file")
//             return childernData(documents)
//         }
//         else documents.childern?.map((child) => {
//             return this.recursiveAddFolderOrFile(child, parentId, type, folderName, files)
//         })
//     }