import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TranslateModule } from '@ngx-translate/core';

import { PageNotFoundComponent } from './components/page-not-found/page-not-found.component';
import { FileListComponent } from './components/file-list/file-list.component';
import { LoadingSpinnerComponent } from './components/loading-spinner/loading-spinner.component';
import { TextEditorComponent } from './components/text-editor/text-editor.component';
import { KeyValueEditorComponent } from './components/key-value-editor/key-value-editor.component';
import { KeyValueSimpleEditorComponent } from './components/key-value-simple-editor/key-value-simple-editor.component';
import { KeyValueGroupsComponent } from './components/key-value-groups/key-value-groups.component';
import { FieldSuggestionDropdownComponent } from './components/field-suggestion-dropdown/field-suggestion-dropdown.component';
import { FieldTooltipComponent } from './components/field-tooltip/field-tooltip.component';
import { FocusSafeInputComponent } from './components/focus-safe-input/focus-safe-input.component';
import { SmartFieldInputComponent } from './components/smart-field-input/smart-field-input.component';
import { SimpleDropdownComponent } from './components/simple-dropdown/simple-dropdown.component';
import { FrameToolbarComponent } from './components/frame-toolbar/frame-toolbar.component';

import { WebviewDirective } from './directives/';
import { FormsModule } from '@angular/forms';
import { DragulaDirective, DragulaModule } from 'ng2-dragula';

@NgModule({
  declarations: [
    FileListComponent,
    PageNotFoundComponent, 
    WebviewDirective,
    LoadingSpinnerComponent,
    TextEditorComponent,
    KeyValueEditorComponent,
    KeyValueSimpleEditorComponent,
    KeyValueGroupsComponent,
    FieldSuggestionDropdownComponent,
    FieldTooltipComponent,
    FocusSafeInputComponent,
    SmartFieldInputComponent,
    SimpleDropdownComponent,
    FrameToolbarComponent,
  ],
  imports: [CommonModule, TranslateModule, FormsModule, DragulaModule  ],
  exports: [
    TranslateModule, 
    WebviewDirective, 
    FormsModule, 
    DragulaModule,
    FileListComponent, 
    LoadingSpinnerComponent, 
    TextEditorComponent,
    KeyValueEditorComponent,
    KeyValueSimpleEditorComponent,
    KeyValueGroupsComponent,
    FieldSuggestionDropdownComponent,
    FieldTooltipComponent,
    FocusSafeInputComponent,
    SmartFieldInputComponent,
    SimpleDropdownComponent,
    FrameToolbarComponent
  ]
})
export class SharedModule {}
