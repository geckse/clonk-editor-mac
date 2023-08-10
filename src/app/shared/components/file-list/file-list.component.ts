import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { IFile } from '../../../../models/File';

@Component({
  selector: 'app-file-list',
  templateUrl: './file-list.component.html',
  styleUrls: ['./file-list.component.scss']
})
export class FileListComponent implements OnInit {

  @Input() files: IFile[] = [];

  @Output() selected: EventEmitter<IFile> = new EventEmitter<IFile>();
  @Output() open: EventEmitter<IFile> = new EventEmitter<IFile>();

  constructor() {}

  ngOnInit(): void {
  }

  onSelect(file: IFile): void {
    this.selected.emit(file);
  }

}
