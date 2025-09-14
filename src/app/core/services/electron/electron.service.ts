import { Injectable } from '@angular/core';

// If you import a module but never use any of the imported values other than as TypeScript types,
// the resulting javascript file will look as if you never imported the module at all.
import { ipcRenderer, webFrame } from 'electron';
import * as childProcess from 'child_process';
import * as fs from 'fs';

import { IFile } from '../../../../models/File';

const CLONKPATH = './clonkFolder/';
const CLONK_ENGINE_PATH = CLONKPATH + 'Clonk.app/Contents/MacOS/clonk';
const CLONK_4GROUP_PATH = CLONKPATH + 'c4group';

const ALLOWED_CLONK_EXTENSIONS = [
  'c4d', 'c4f', 'c4g', 'c4m', 'c4i', 'c4l', 'c4p', 'c4s', 'c4t', 'c4u', 'c4v', 'c4z'
];

const ALLOWED_IMAGE_EXTENSIONS = [
  'jpg', 'jpeg', 'png', 'gif', 'bmp'
];

const ALLOWED_AUDIO_EXTENSIONS = [
  'mp3', 'wav', 'wma', 'ogg', 'flac', 'aac'
];

@Injectable({
  providedIn: 'root'
})
export class ElectronService {
  ipcRenderer!: typeof ipcRenderer;
  webFrame!: typeof webFrame;
  childProcess!: typeof childProcess;
  fs!: typeof fs;

  stachedFileIcons: { [key: string]: string } = {};

  constructor() {
    // Conditional imports
    if (this.isElectron) {
      this.ipcRenderer = (window as any).require('electron').ipcRenderer;
      this.webFrame = (window as any).require('electron').webFrame;

      this.fs = (window as any).require('fs');

      this.childProcess = (window as any).require('child_process');
      this.childProcess.exec('node -v', (error, stdout, stderr) => {
        if (error) {
          console.error(`error: ${error.message}`);
          return;
        }
        if (stderr) {
          console.error(`stderr: ${stderr}`);
          return;
        }
        console.log(`stdout:\n${stdout}`);
      });

      // Notes :
      // * A NodeJS's dependency imported with 'window.require' MUST BE present in `dependencies` of both `app/package.json`
      // and `package.json (root folder)` in order to make it work here in Electron's Renderer process (src folder)
      // because it will loaded at runtime by Electron.
      // * A NodeJS's dependency imported with TS module import (ex: import { Dropbox } from 'dropbox') CAN only be present
      // in `dependencies` of `package.json (root folder)` because it is loaded during build phase and does not need to be
      // in the final bundle. Reminder : only if not used in Electron's Main process (app folder)

      // If you want to use a NodeJS 3rd party deps in Renderer process,
      // ipcRenderer.invoke can serve many common use cases.
      // https://www.electronjs.org/docs/latest/api/ipc-renderer#ipcrendererinvokechannel-args
    }
  }

  get isElectron(): boolean {
    return !!(window && window.process && window.process.type);
  }

  get allowedExtensions(): string[] {
    return [...ALLOWED_CLONK_EXTENSIONS, ...ALLOWED_IMAGE_EXTENSIONS, ...ALLOWED_AUDIO_EXTENSIONS];
  }

  get folderList(): string[] {

    const folderList: string[] = [];

    const files = this.fs.readdirSync(CLONKPATH);

    let allowedExtensions: string[] = this.allowedExtensions;

    // filter files by allowed extensions
    /*files.filter(file => {
      return allowedExtensions.some(ext => file.endsWith(ext));
    });*/


    files.forEach(file => {
      if (this.fs.lstatSync(file).isDirectory()) {
        folderList.push(file);
      }
    });

    return folderList;

  }

  async fileList(root: string = ""): Promise<IFile[]> {

    // clean root from clonkFolder
    root = root.replace(CLONKPATH, "");
    if(root != ""){
      root = root + "/";
    }

    const files = this.fs.readdirSync(CLONKPATH + root.replace(/\/$/, ''));

    let allowedExtensions: string[] = this.allowedExtensions;

    // filter files by allowed extensions
    let foundExtensions: string[] = [];
    let fileIconPromises: any[] = [];
    files.forEach(file => {
      fileIconPromises.push(this.getFileIcon(file));
    });
    await Promise.all(fileIconPromises);

    // add icon to each file
    let filesEnriched: IFile[] = [];
    const filePromises = files.map(file => this.loadFileMeta(CLONKPATH + root + file));
    filesEnriched = await Promise.all(filePromises);

    // order dem 
    filesEnriched = this.orderFilesByExtension(filesEnriched);

    return filesEnriched;
  }

  loadFileMeta(file: string): Promise<IFile> {
    return new Promise(async (resolve, reject) => {

      const ext = this.getExtension(file);

      // only if it exists
      if (!this.fs.existsSync(file)) {
        console.warn("File does not exist:" + file);
        return;
      }

      const isFolder = this.fs.lstatSync(file).isDirectory();
      const name = file.split('/').pop() as string;
      const icon = this.stachedFileIcons[ext] ? this.stachedFileIcons[ext] : await this.getFileIcon(file);

      let fileMeta: IFile = {
        name: name,
        path: file,
        icon: icon,
        ext: ext,
        isFolder: isFolder
      } as IFile;

      if (isFolder) {
        const subfiles = this.fs.readdirSync(file.replace(/\/$/, ''));

        console.log("FOLDER: "+file.replace(/\/$/, ''));

        console.log("SUBFILES: "+subfiles);

        const subfilesPromises = subfiles.map(subfile => this.loadFileMeta(file + '/' + subfile));
        const subfilesResult = await Promise.all(subfilesPromises);
        
        let subfilesWithOnlyOneDepth: IFile[] = [];



        // find a preview path (title.png, title.jpg or graphics.png, graphics.jpg)
        let previewPath: any = null;
 
        
        if(!previewPath){
          // find graphics.png or graphics.jpg

          subfilesResult.forEach(subfile => {
            if(subfile.name.toLowerCase().endsWith('graphics.png') || subfile.name.toLowerCase().endsWith('graphics.jpg')){
              previewPath = JSON.parse(JSON.stringify(subfile.path));
            }
            if(subfile.name.toLowerCase().endsWith('title.png') || subfile.name.toLowerCase().endsWith('title.jpg')){
              previewPath = JSON.parse(JSON.stringify(subfile.path));
            }
          });
  
        }

        fileMeta.previewPath = (previewPath ? previewPath : "");

        console.log("PREVIEW PATH RESULT: "+JSON.stringify(previewPath));

        subfilesResult.forEach(subfile => {
          let decoupledSubfile = JSON.parse(JSON.stringify(subfile));
          if (decoupledSubfile.subfiles) {
            decoupledSubfile.subfiles = [];
          }
          subfilesWithOnlyOneDepth.push(decoupledSubfile);
        });

        fileMeta.subfiles = subfilesWithOnlyOneDepth;

        // order by extension
        fileMeta.subfiles = this.orderFilesByExtension(fileMeta.subfiles);

        subfilesWithOnlyOneDepth.forEach(subfile => {
          subfile.parentFile = {
            name: fileMeta.name,
            path: fileMeta.path,
            previewPath: (previewPath ? previewPath : ""),
            icon: fileMeta.icon,
            ext: fileMeta.ext,
            isFolder: fileMeta.isFolder
          } as IFile;
        });

        return resolve(fileMeta);
      }

      return resolve(fileMeta);
    });
  }

  getExtension(file: string): string {
    return file.split('.').pop() as string;
  }

  async getFileIcon(file: string): Promise<string> {
    const ext = this.getExtension(file);

    if (this.stachedFileIcons[ext]) {
      return this.stachedFileIcons[ext];
    }
    const icon = await this.ipcRenderer.invoke('getFileIcon', file);
    this.stachedFileIcons[ext] = icon.toDataURL() as string;
    return icon.toDataURL() as string;
  }

  getFileFullPath(file: string): string {
    return CLONKPATH + file;
  }

  orderFilesByExtension(files: IFile[]): IFile[] {
    const defaultOrder = ['c4p', 'c4f', 'c4s', 'c4g', 'c4s', 'txt', 'rtf', 'png', 'jpg', 'bmp', 'c', 'c4d'];

    let ordered = files.sort((a, b) => {
      const aIndex = defaultOrder.indexOf(a.ext);
      const bIndex = defaultOrder.indexOf(b.ext);
      return aIndex - bIndex;
    });

    return ordered.filter(file => defaultOrder.includes(file.ext)).concat(files.filter(file => !defaultOrder.includes(file.ext)));
  }

  sendC4groupCommand(cmd: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.childProcess.exec(CLONK_4GROUP_PATH + ' ' + this.cleanEnginePath(cmd), (error, stdout, stderr) => {
        if (error) {
          return reject(error);
        }
        if (stderr) {
          return reject(stderr);
        }
        console.log(stdout);
        return resolve(stdout);
      });
    });
  }

  sendClonkAppCommand(cmd: string) {
    return new Promise((resolve, reject) => {
      this.childProcess.exec(CLONK_ENGINE_PATH + ' ' + this.cleanEnginePath(cmd), (error, stdout, stderr) => {
        if (error) {
          return reject(error);
        }
        if (stderr) {
          return reject(stderr);
        }
        return resolve(stdout);
      });
    });
  }

  cleanEnginePath(path: string): string {
    return path.replace('Clonk.app', "").replace('c4group', "").replace('clonk.app', "");
  }

  /*
    * Get the content of a file
    * @param file - The path to the file
    * @returns The content of the file
  */
  getFileContent(file: string): Promise<string> {
    return new Promise((resolve, reject) => {
      this.fs.readFile(file, {encoding: 'latin1'}, (error, data) => {
        if (error) {
          return reject(error);
        }
        return resolve(data);
      });
    });
  }

  /*
    * Write content to a file
    * @param file - The path to the file
    * @param content - The content to write to the file
    * @returns Promise that resolves when file is written
  */
  writeFileContent(file: string, content: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.fs.writeFile(file, content, {encoding: 'latin1'}, (error) => {
        if (error) {
          return reject(error);
        }
        return resolve();
      });
    });
  }

  /* 
    * Get the content of a file and return it as a base64 encoded string
    * @param file - The path to the file
    * @returns The content of the file as a base64 encoded string
  */
  getFileContentBase64(file: string): Promise<string> {
    return new Promise((resolve, reject) => {
      this.fs.readFile(file, 'base64', (error, data) => {
        if (error) {
          return reject(error);
        }
        return resolve(data);
      });
    });
  }

  /*
    * Open a file externally
    * @param file - The path to the file
  */
  openFileExternally(file: string) {
    // hardcoded to my preference
    if(file.endsWith('.c')){
      this.childProcess.exec('cursor ' + file);
    } else {
      this.childProcess.exec('open ' + file);
    }
    
  }

}
