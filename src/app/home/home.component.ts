import { Component, OnInit, EventEmitter, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { ElectronService } from '../core/services';
import { IFile } from '../../models/File';
import { ClonkService } from '../core/services/clonk/clonk.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {

  engineInput: string = "Clonk.app /nonetwork";

  files: IFile[] = [];

  fileSelected!: IFile;

  filePreviewSrc: string = "";
  fileContent: string = "";
  originalFileContent: string = "";
  hasUnsavedChanges: boolean = false;
  editor: "basic" | "key-value-simple" | "key-value-sections" | "none" = "none";

  constructor(private router: Router,
              private electronService: ElectronService,
              private clonkService: ClonkService) { }

  ngOnInit(): void {
    this.updatePage();
  }

  @HostListener('keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    // Handle Ctrl+S (Windows/Linux) or Cmd+S (Mac)
    if ((event.ctrlKey || event.metaKey) && event.key === 's') {
      event.preventDefault(); // Prevent browser's default save behavior
      if (this.hasUnsavedChanges && this.fileSelected) {
        this.saveFile();
      }
    }
  }


  async updatePage(){
    this.files = await this.electronService.fileList();
    console.log("files", this.files);
  }


  onContentChange(newContent: string): void {
    console.log('Content change received:', typeof newContent, newContent);
    this.fileContent = newContent;
    this.hasUnsavedChanges = this.fileContent !== this.originalFileContent;
  }

  public selectFile(file: IFile) {
    
    this.fileSelected = file;

    // text files will be opened in the editor
    if( file.ext == "txt" ){
      this.electronService.getFileContent(file.path).then( (content) => {
        this.fileContent = content;
        this.originalFileContent = content;
        this.hasUnsavedChanges = false;
        this.filePreviewSrc = "";
        this.editor = "basic";
        
        // if every contains a "=" it's potentially a key value
        if (this.fileContent && this.fileContent.split('\n').filter(line => line.trim().length > 0).every(line => line.includes('='))) {
          this.editor = "key-value-simple";
        }

        // is it a file with groups for key values? contains [someSection] also looks for = in the lines end closing ]
        if(this.fileContent && this.fileContent.split('\n').filter(line => line.trim().length > 0).some(line => line.includes('[') && line.includes(']')) && this.fileContent.split('\n').filter(line => line.trim().length > 0).some(line => line.includes('='))) {
          this.editor = "key-value-simple";
        }

        if(file.previewPath && file.previewPath != ""){
          console.log("FILE PREVIEW PATH: "+file.previewPath);
          let previewExt = file.previewPath.split(".").pop();
          this.electronService.getFileContentBase64(file.previewPath).then( (content) => {
            this.filePreviewSrc = "data:image/" + previewExt + ";base64," + content;
          });
        }

        if(file.parentFile?.previewPath && file.previewPath != ""){
          let previewExt = file.parentFile.previewPath.split(".").pop();
          this.electronService.getFileContentBase64(file.parentFile.previewPath).then( (content) => {
            this.filePreviewSrc = "data:image/" + previewExt + ";base64," + content;
          });
        }


      });
    } else if (file.ext == "c") { // c files will be opened in the editor
      this.electronService.getFileContent(file.path).then((content) => {
        this.fileContent = content;
        this.originalFileContent = content;
        this.hasUnsavedChanges = false;
        this.filePreviewSrc = "";
        this.editor = "basic";

        if (file.parentFile?.previewPath) {
          let previewExt = file.parentFile.previewPath.split(".").pop();
          this.electronService.getFileContentBase64(file.parentFile.previewPath).then((content) => {
            this.filePreviewSrc = "data:image/" + previewExt + ";base64," + content;
          });
        }


      });
    } else {
      this.editor = "none";
    }
    
    // images will be opened in the preview
    if( file.ext == "png" || file.ext == "jpg" || file.ext == "jpeg" || file.ext == "gif" || file.ext == "bmp" || file.ext == "ico" ){
      this.electronService.getFileContentBase64(file.path).then( (content) => {
        this.fileContent = "";
        // base64 encoded image based on file content and file extension
        this.filePreviewSrc = "data:image/" + file.ext + ";base64," + content;
        this.editor = "none";
      });
    }


    let engineObjs = this.clonkService.splitEngineString(this.engineInput);
    
    let found = false;
    engineObjs.parameter.forEach( (parameter, index) => {
      if( parameter.indexOf(".c4s") != -1 ){
        engineObjs.parameter[index] = file.name;
        found = true;
      }
    });

    if( !found ){
      engineObjs.parameter.push(file.name);
    }

    this.engineInput = this.clonkService.formatEngineString(engineObjs);
  }

  public openFile(file: IFile){

    this.fileContent = "";

    // scenarios will run
    if( file.ext == "c4s" && !file.isFolder ){
      this.clonkService.sendClonkAppCommand(this.engineInput);
    }

    // otherwise let system open the file
    else{
      this.electronService.openFileExternally(file.path);
    }

  }

  public submitEngineCall(){
    this.clonkService.sendClonkAppCommand(this.engineInput);
  }

  onEditorTypeChange(editorType: string): void {
    this.editor = editorType as "basic" | "key-value-simple" | "key-value-sections" | "none";
  }

  async saveFile(): Promise<void> {
    console.log('Home component: saveFile() method called');
    if (!this.fileSelected) {
      console.log('No file selected, returning');
      return;
    }

    console.log('Saving file:', this.fileSelected.path);
    console.log('File content type:', typeof this.fileContent);
    console.log('File content:', this.fileContent);

    try {
      await this.electronService.writeFileContent(this.fileSelected.path, this.fileContent);
      this.originalFileContent = this.fileContent;
      this.hasUnsavedChanges = false;
      console.log('File saved successfully');
    } catch (error) {
      console.error('Error saving file:', error);
    }
  }

  cancelChanges(): void {
    console.log('Canceling changes, restoring to:', this.originalFileContent);
    this.fileContent = this.originalFileContent;
    this.hasUnsavedChanges = false;
  }

}
