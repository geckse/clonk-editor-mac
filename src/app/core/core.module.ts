import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { KeyValueDocumentationService } from './services/key-value-documentation/key-value-documentation.service';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    HttpClientModule
  ],
  providers: [
    KeyValueDocumentationService
  ]
})
export class CoreModule { }
