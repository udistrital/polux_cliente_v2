import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { RevisionRoutingModule } from './revision-routing.module';
import { ListaTrabajosComponent } from './lista-trabajos/lista-trabajos.component';
import { SharedModule } from 'src/app/shared/shared-module.module';
import { DocumentoModule } from '../documento/documento.module';


@NgModule({
  declarations: [
    ListaTrabajosComponent,
  ],
  imports: [
    CommonModule,
    RevisionRoutingModule,
    DocumentoModule,
    SharedModule,
  ]
})
export class RevisionModule { }
