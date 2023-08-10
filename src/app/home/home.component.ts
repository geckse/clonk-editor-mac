import { Component, OnInit, EventEmitter } from '@angular/core';
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

  engineInput: string = "Clonk.app /console /nonetwork";

  files: IFile[] = [];

  fileSelected!: IFile;

  constructor(private router: Router,
              private electronService: ElectronService,
              private clonkService: ClonkService) { }

  ngOnInit(): void {
    this.updatePage();
  }


  async updatePage(){
    this.files = await this.electronService.fileList();
    console.log("files", this.files);
  }


  public onFileSelected(file: IFile) {

    if(file.ext != "c4s") return false;

    this.fileSelected = file;

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

  public submitEngineCall(){
    this.clonkService.sendC4GroupCommand(this.engineInput);
  }

}
