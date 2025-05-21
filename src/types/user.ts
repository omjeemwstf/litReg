export enum FolderObjectType {
    FOLDER = "FOLDER",
    FILE = "FILE"
}

export interface NestedDocumentsInterface {
    id: string,
    name: string,
    type: FolderObjectType,
    childern: NestedDocumentsInterface[]
}