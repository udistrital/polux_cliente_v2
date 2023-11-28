import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SolicitudesRoutingModule } from './solicitudes-routing.module';
import { ListarSolicitudesComponent } from './listar-solicitudes/listar-solicitudes.component';
import { SharedModule } from 'src/app/shared/shared-module.module';
import { FormSolicitudComponent } from './form-solicitud/form-solicitud.component';
import { CrudSolicitudesComponent } from './crud-solicitudes/crud-solicitudes.component';


@NgModule({
  declarations: [
    ListarSolicitudesComponent,
    FormSolicitudComponent,
    CrudSolicitudesComponent,
  ],
  imports: [
    CommonModule,
    SolicitudesRoutingModule,
    SharedModule,
  ]
})
export class SolicitudesModule { }
