export enum FolderObjectType {
    FOLDER = "FOLDER",
    FILE = "FILE"
}

export enum SetType {
    QUERY = "query",
    LLM = "llm"
}

export interface NestedDocumentsInterface {
    id: string,
    name: string,
    type: FolderObjectType,
    childern: NestedDocumentsInterface[]
}