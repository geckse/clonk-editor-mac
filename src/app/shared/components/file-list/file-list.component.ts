import { ChangeDetectorRef, Component, ElementRef, EventEmitter, HostListener, Input, NgZone, OnInit, Output, ViewChild, ViewChildren, QueryList, AfterViewInit } from '@angular/core';
import { IFile } from '../../../../models/File';
import { ClonkService } from '../../../core/services/clonk/clonk.service';
import { ElectronService } from '../../../core/services';

@Component({
  selector: 'app-file-list',
  templateUrl: './file-list.component.html',
  styleUrls: ['./file-list.component.scss']
})
export class FileListComponent implements OnInit, AfterViewInit {

  @Input() files: IFile[] = [];
  @Input() isRoot: boolean = true;
  @Input() globalSelectedFile: IFile | null = null;

  subFiles: IFile[] = [];
  loadingSubFiles: string[] = [];
  highlightedIndex: number = -1;
  selectedFile: IFile | null = null;
  flatNavigationItems: IFile[] = [];
  flatNavigationIndex: number = -1;

  @Output() selected: EventEmitter<IFile> = new EventEmitter<IFile>();
  @Output() open: EventEmitter<IFile> = new EventEmitter<IFile>();
  @Output() changed: EventEmitter<IFile> = new EventEmitter<IFile>();

  @ViewChild('fileNameEditInput', { static: false }) fileNameEditInput!: ElementRef;
  @ViewChild('fileListContainer', { static: false }) fileListContainer!: ElementRef;
  @ViewChildren('fileItem') fileItems!: QueryList<ElementRef>;

  fileNameEdit: IFile | undefined;
  fileNameEditValue: string = '';

  constructor(private clonkService: ClonkService, private electronService: ElectronService) {}

  ngOnInit(): void {
    if (this.isRoot) {
      this.buildFlatNavigationList();
      if (this.flatNavigationItems.length > 0) {
        this.flatNavigationIndex = 0;
        this.selectedFile = this.flatNavigationItems[0];
        this.updateHighlightFromFlatIndex();
      }
    }
  }

  ngAfterViewInit(): void {
    // Initial scroll to view if needed
    if (this.isRoot && this.selectedFile) {
      setTimeout(() => this.scrollToSelectedItem(), 100);
    }
  }

  onDoubleClick(ev: any, file: IFile): void {

    if(this.clonkService.canPack(file.path) && !file.isFolder){
      this.unpackFile(file);
    } else if(this.clonkService.canPack(file.path) && file.isFolder){
      this.packFile(file);
    } else {
      this.onOpen(ev,file);
    }

  }
  
  onOpen(ev: MouseEvent | IFile, file?: IFile) {
    const targetFile = file || (ev as IFile);
    this.open.emit(targetFile);
  }

  onSelect(ev: MouseEvent | IFile, file?: IFile) {
    const targetFile = file || (ev as IFile);
    if (this.isRoot) {
      this.selectedFile = targetFile;
      this.buildFlatNavigationList(); // Rebuild to ensure we have current state
      this.flatNavigationIndex = this.flatNavigationItems.indexOf(targetFile);
      this.updateHighlightIndexes();
    }
    this.selected.emit(targetFile);
  }

  onRightClick(ev: MouseEvent, file: IFile): void {

  }

  onFileNameEdit(ev: any, file: IFile): boolean {
    ev.preventDefault();
    ev.stopPropagation();

    this.fileNameEdit = file;
    this.fileNameEditValue = file.name;

    setTimeout(() => {
      console.log("onFileNameEdit",this.fileNameEditInput);
      this.fileNameEditInput.nativeElement.focus();
    }, 10);

    return false;
  }

  onFileNameChange(){
    if(this.fileNameEdit){
      this.fileNameEdit.name = this.fileNameEditValue;
      this.fileNameEdit = undefined;
    }
  }

  exitFileNameChange(){
    this.fileNameEdit = undefined;
  }

  /*
    Unpacks current File
  */
  async unpackFile(file: IFile){
    if(!this.clonkService.canPack(file.path)){
      console.warn("Cannot pack/unpack file:", file.path);
      return;
    }
    this.loadingSubFiles.push(file.path);
    await this.clonkService.unpackFile(file.path);
    console.log("UNPACKED FILE: "+file.path);
    file.isFolder = true;
    file.subfiles = await this.electronService.fileList(file.path);

    file = await this.electronService.loadFileMeta(file.path);

    await Promise.all(file.subfiles.map(subfile => this.electronService.loadFileMeta(subfile.path)));
   
    file.subfiles.forEach(subfile => {
      subfile.previewPath = file.previewPath;
    });
    
    console.log("SUBFILES: "+JSON.stringify(file.subfiles));


    this.loadingSubFiles = this.loadingSubFiles.filter(path => path !== file.path);
    if (this.isRoot) {
      this.buildFlatNavigationList(); // Rebuild navigation after unpacking
    }
  }
  /*
    Packs current File
  */
  async packFile(file: IFile){
    if(!this.clonkService.canPack(file.path)){
      console.warn("Cannot pack/unpack file:", file.path);
      return;
    }
    this.loadingSubFiles.push(file.path);
    await this.clonkService.packFile(file.path);
    file.subfiles = [];
    file.isFolder = false;
    this.loadingSubFiles = this.loadingSubFiles.filter(path => path !== file.path);
    if (this.isRoot) {
      this.buildFlatNavigationList(); // Rebuild navigation after packing
    }
  }

  /*
    Returns true if the file is loading
  */
  public isLoading(file: IFile): boolean {
    return this.loadingSubFiles.includes(file.path);
  }

  public isSelected(file: IFile): boolean {
    if (this.isRoot) {
      return this.selectedFile === file;
    } else {
      return this.globalSelectedFile === file;
    }
  }

  public isHighlighted(index: number): boolean {
    if (this.isRoot) {
      return this.highlightedIndex === index;
    } else {
      // For nested components, check if the file at this index is the globally selected file
      return this.files[index] === this.globalSelectedFile;
    }
  }

  @HostListener('keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    if (!this.isRoot || this.files.length === 0) return;

    switch (event.key) {
      case 'ArrowUp':
        event.preventDefault();
        this.navigateUp();
        break;
      case 'ArrowDown':
        event.preventDefault();
        this.navigateDown();
        break;
      case 'Enter':
      case 'ArrowRight':
        event.preventDefault();
        this.activateCurrentItem();
        break;
      case 'ArrowLeft':
        event.preventDefault();
        this.packCurrentItem();
        break;
    }
  }

  private navigateUp(): void {
    if (this.flatNavigationIndex <= 0) {
      this.flatNavigationIndex = this.flatNavigationItems.length - 1;
    } else {
      this.flatNavigationIndex--;
    }
    this.updateHighlightFromFlatIndex();
    this.rebuildFlatNavigationIfNeeded();
    this.scrollToSelectedItem();
  }

  private navigateDown(): void {
    if (this.flatNavigationIndex >= this.flatNavigationItems.length - 1) {
      this.flatNavigationIndex = 0;
    } else {
      this.flatNavigationIndex++;
    }
    this.updateHighlightFromFlatIndex();
    this.rebuildFlatNavigationIfNeeded();
    this.scrollToSelectedItem();
  }

  private rebuildFlatNavigationIfNeeded(): void {
    // Rebuild the flat list in case subfiles have been expanded/collapsed
    this.buildFlatNavigationList();
    // Ensure the selected file is still in the list and update index
    if (this.selectedFile) {
      const newIndex = this.flatNavigationItems.indexOf(this.selectedFile);
      if (newIndex !== -1) {
        this.flatNavigationIndex = newIndex;
      } else {
        // If selected file is no longer in the list, reset to beginning
        this.flatNavigationIndex = 0;
        if (this.flatNavigationItems.length > 0) {
          this.selectedFile = this.flatNavigationItems[0];
        }
      }
    }
  }

  private activateCurrentItem(): void {
    if (this.selectedFile) {
      this.onDoubleClick(null as any, this.selectedFile);
    }
  }

  private packCurrentItem(): void {
    if (this.selectedFile && this.clonkService.canPack(this.selectedFile.path) && this.selectedFile.isFolder) {
      this.packFile(this.selectedFile);
    }
  }

  private buildFlatNavigationList(): void {
    this.flatNavigationItems = [];
    this.buildFlatListRecursive(this.files);
  }

  private buildFlatListRecursive(files: IFile[]): void {
    for (const file of files) {
      this.flatNavigationItems.push(file);
      if (file.subfiles && file.subfiles.length > 0 && file.isFolder) {
        this.buildFlatListRecursive(file.subfiles);
      }
    }
  }

  private updateHighlightFromFlatIndex(): void {
    if (this.flatNavigationIndex >= 0 && this.flatNavigationIndex < this.flatNavigationItems.length) {
      this.selectedFile = this.flatNavigationItems[this.flatNavigationIndex];
      this.updateHighlightIndexes();
      this.selected.emit(this.selectedFile);
    }
  }

  private updateHighlightIndexes(): void {
    if (!this.selectedFile) return;
    
    // Find the index in the current level files
    this.highlightedIndex = this.files.indexOf(this.selectedFile);
    
    // If not found in current level, it must be in a sublevel
    if (this.highlightedIndex === -1) {
      this.highlightedIndex = -1;
      // We'll handle nested highlighting through the template
    }
  }

  private scrollToSelectedItem(): void {
    if (!this.isRoot || !this.selectedFile) return;
    
    setTimeout(() => {
      const selectedElement = this.findSelectedElementInDOM();
      const scrollContainer = document.querySelector('.left-bar.scroll-y') as HTMLElement;
      
      if (selectedElement && scrollContainer) {
        this.scrollElementIntoViewIfNeeded(selectedElement as HTMLElement, scrollContainer);
      }
    }, 50);
  }

  private scrollElementIntoViewIfNeeded(element: HTMLElement, container: HTMLElement): void {
    const elementRect = element.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    
    // Check Y-axis visibility
    const isAboveViewport = elementRect.top < containerRect.top;
    const isBelowViewport = elementRect.bottom > containerRect.bottom;
    
    // Only scroll Y if element is out of view vertically, never scroll X
    if (isAboveViewport || isBelowViewport) {
      // Element is out of view vertically, scroll it into view
      const scrollBehavior: ScrollIntoViewOptions = {
        behavior: 'smooth',
        block: isAboveViewport ? 'start' : 'end', // Scroll to top or bottom of viewport
        inline: 'nearest' // Don't change X position at all
      };
      
      element.scrollIntoView(scrollBehavior);
    }
    // If element is visible vertically, do nothing (no scrolling at all)
  }

  private findSelectedElementInDOM(): Element | null {
    const allElements = document.querySelectorAll('.inner.is-highlighted, .inner.is-selected');
    
    for (const element of Array.from(allElements)) {
      if (element.classList.contains('is-highlighted') || element.classList.contains('is-selected')) {
        return element;
      }
    }
    
    return null;
  }

}
