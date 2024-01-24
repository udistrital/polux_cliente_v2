import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MateriasPosgradoRoutingModule } from './materias-posgrado-routing.module';
import { SharedModule } from 'src/app/shared/shared-module.module';
import { SeleccionarPensumComponent } from './seleccionar-pensum/seleccionar-pensum.component';
import { AsignaturasPensumComponent } from './asignaturas-pensum/asignaturas-pensum.component';


@NgModule({
  declarations: [
    SeleccionarPensumComponent,
    AsignaturasPensumComponent,
  ],
  imports: [
    CommonModule,
    MateriasPosgradoRoutingModule,
    SharedModule,
  ]
})
export class MateriasPosgradoModule { }
