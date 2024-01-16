import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { GeneralRoutingModule } from './general-routing.module';
import { RegistrarNotaComponent } from './registrar-nota/registrar-nota.component';
import { ConsultaTrabajoGradoComponent } from './consulta-trabajo-grado/consulta-trabajo-grado.component';
import { SharedModule } from 'src/app/shared/shared-module.module';


@NgModule({
  declarations: [
    RegistrarNotaComponent,
    ConsultaTrabajoGradoComponent,
  ],
  imports: [
    CommonModule,
    GeneralRoutingModule,
    SharedModule,
  ]
})
export class GeneralModule { }
