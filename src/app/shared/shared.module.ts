import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TranslateModule } from '@ngx-translate/core';

import { PageNotFoundComponent } from './components/page-not-found/page-not-found.component';
import { FileListComponent } from './components/file-list/file-list.component';

import { WebviewDirective } from './directives/';
import { FormsModule } from '@angular/forms';

@NgModule({
  declarations: [
    FileListComponent,
    PageNotFoundComponent, 
    WebviewDirective
  ],
  imports: [CommonModule, TranslateModule, FormsModule],
  exports: [TranslateModule, WebviewDirective, FormsModule, FileListComponent]
})
export class SharedModule {}
