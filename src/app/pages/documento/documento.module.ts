import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VerDocumentoComponent } from './ver-documento/ver-documento.component';
import { VersionesDocumentoComponent } from './versiones-documento/versiones-documento.component';
import { SharedModule } from 'src/app/shared/shared-module.module';
import { RevisarDocumentoComponent } from './revisar-documento/revisar-documento.component';


@NgModule({
  declarations: [
    VerDocumentoComponent,
    VersionesDocumentoComponent,
    RevisarDocumentoComponent,
  ],
  imports: [
    CommonModule,
    SharedModule,
  ],
  exports: [
    VerDocumentoComponent,
    VersionesDocumentoComponent,
    RevisarDocumentoComponent,
  ]
})
export class DocumentoModule { }
