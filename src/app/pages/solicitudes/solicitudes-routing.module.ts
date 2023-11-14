import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { canActivate } from 'src/app/core/guards/guards-guard.guard';
import { ListarSolicitudesComponent } from './listar-solicitudes/listar-solicitudes.component';
import { PagesComponent } from '../pages.component';

const routes: Routes = [
  {
    path: '',
    component: PagesComponent,
    children: [
      {
        path: 'listar_solicitudes',
        component: ListarSolicitudesComponent,
        canActivate: [canActivate],
      }
    ],
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class SolicitudesRoutingModule { }
