import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VerDocumentoComponent } from './ver-documento/ver-documento.component';
import { VersionesDocumentoComponent } from './versiones-documento/versiones-documento.component';
import { SharedModule } from 'src/app/shared/shared-module.module';
import { RevisarDocumentoComponent } from './revisar-documento/revisar-documento.component';
import { VerRevisionComponent } from './ver-revision/ver-revision.component';


@NgModule({
  declarations: [
    RevisarDocumentoComponent,
    VerDocumentoComponent,
    VerRevisionComponent,
    VersionesDocumentoComponent,
  ],
  imports: [
    CommonModule,
    SharedModule,
  ],
  exports: [
    RevisarDocumentoComponent,
    VerDocumentoComponent,
    VerRevisionComponent,
    VersionesDocumentoComponent,
  ]
})
export class DocumentoModule { }
