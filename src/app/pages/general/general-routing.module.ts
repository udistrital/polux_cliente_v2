import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PagesComponent } from '../pages.component';
import { canActivate } from 'src/app/core/guards/guards-guard.guard';
import { RegistrarNotaComponent } from './registrar-nota/registrar-nota.component';
import { ConsultaTrabajoGradoComponent } from './consulta-trabajo-grado/consulta-trabajo-grado.component';

const routes: Routes = [
  {
    path: '',
    component: PagesComponent,
    children: [
      {
        path: 'consultar_trabajo_grado',
        component: ConsultaTrabajoGradoComponent,
        canActivate: [canActivate],
      },
      {
        path: 'registrar_nota',
        component: RegistrarNotaComponent,
        canActivate: [canActivate],
      },
    ],
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class GeneralRoutingModule { }
