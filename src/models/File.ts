export interface IFile {
    name: string;
    path: string;
    previewPath?: string;
    icon: string;
    ext: string;
    subfiles: IFile[];
    parentFile?: IFile;
    isFolder: boolean;
}