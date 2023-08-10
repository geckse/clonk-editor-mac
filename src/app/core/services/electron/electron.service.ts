import { Injectable } from '@angular/core';

// If you import a module but never use any of the imported values other than as TypeScript types,
// the resulting javascript file will look as if you never imported the module at all.
import { ipcRenderer, webFrame } from 'electron';
import * as childProcess from 'child_process';
import * as fs from 'fs';

import { IFile } from '../../../../models/File';

const CLONKPATH = './clonkFolder/';
const CLONK_ENGINE_PATH = CLONKPATH+'Clonk.app/Contents/MacOS/clonk';

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

  get folderList(): string[] {

    const folderList: string[] = [];

    const files = this.fs.readdirSync(CLONKPATH);

    let allowedExtensions: string[] = [];
    // image files
    allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp'];
    // audio files
    allowedExtensions = allowedExtensions.concat(['.mp3', '.wav', '.wma', '.ogg', '.flac', '.aac']);
    // clonk files
    allowedExtensions = allowedExtensions.concat(['.c4d', '.c4f', '.c4g', '.c4i', '.c4l', '.c4p', '.c4s', '.c4t', '.c4u', '.c4v', '.c4z']);


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

  async fileList(): Promise<IFile[]> {
        
      const files = this.fs.readdirSync(CLONKPATH);
  
      let allowedExtensions: string[] = [];
      
      // image files
      allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp'];
      
      // audio files
      allowedExtensions = allowedExtensions.concat(['.mp3', '.wav', '.wma', '.ogg', '.flac', '.aac']);
      
      // clonk files
      allowedExtensions = allowedExtensions.concat(['.c4d', '.c4f', '.c4g', '.c4i', '.c4l', '.c4p', '.c4s', '.c4t', '.c4u', '.c4v', '.c4z']);

      // filter files by allowed extensions
      let foundExtensions: string[] = [];
      let fileIconPromises: any[] = [];
      files.forEach(file => {
        fileIconPromises.push(this.getFileIcon(file));
      });
      await Promise.all(fileIconPromises);

      // add icon to each file
      let filesEnriched: IFile[] = [];
      files.forEach( async (file) => {
        const ext = this.getExtension(file);
        const icon = this.stachedFileIcons[ext] ? this.stachedFileIcons[ext] : await this.getFileIcon(file);
        filesEnriched.push({
          name: file,
          icon: icon,
          ext: ext
        });
      });

      console.log(filesEnriched);

      return filesEnriched;
    }
    
    getExtension(file: string): string {
      return file.split('.').pop() as string;
    }

    async getFileIcon(file: string): Promise<string> {
      const ext = this.getExtension(file);
      
      if(this.stachedFileIcons[ext]) {
        return this.stachedFileIcons[ext];
      }
      const icon = await this.ipcRenderer.invoke('getFileIcon', file);
      this.stachedFileIcons[ext] = icon.toDataURL() as string;
      return icon.toDataURL() as string;
    }
  
  sendC4groupCommand(cmd: string){
    
    this.childProcess.exec(CLONK_ENGINE_PATH+' '+cmd.replace('Clonk.app',""), (error, stdout, stderr) => {
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

  }

}
