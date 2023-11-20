import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SolicitudesRoutingModule } from './solicitudes-routing.module';
import { ListarSolicitudesComponent } from './listar-solicitudes/listar-solicitudes.component';
import { SharedModule } from 'src/app/shared/shared-module.module';
import { FormSolicitudComponent } from './form-solicitud/form-solicitud.component';


@NgModule({
  declarations: [
    ListarSolicitudesComponent,
    FormSolicitudComponent
  ],
  imports: [
    CommonModule,
    SolicitudesRoutingModule,
    SharedModule,
  ]
})
export class SolicitudesModule { }
