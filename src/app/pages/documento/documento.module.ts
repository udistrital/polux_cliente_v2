import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VerDocumentoComponent } from './ver-documento/ver-documento.component';
import { VersionesDocumentoComponent } from './versiones-documento/versiones-documento.component';
import { SharedModule } from 'src/app/shared/shared-module.module';


@NgModule({
  declarations: [
    VerDocumentoComponent,
    VersionesDocumentoComponent,
  ],
  imports: [
    CommonModule,
    SharedModule,
  ],
  exports: [
    VerDocumentoComponent,
    VersionesDocumentoComponent,
  ]
})
export class DocumentoModule { }
