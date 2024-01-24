import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { canActivate } from 'src/app/core/guards/guards-guard.guard';
import { PagesComponent } from '../pages.component';
import { SeleccionarPensumComponent } from './seleccionar-pensum/seleccionar-pensum.component';

const routes: Routes = [
  {
    path: '',
    component: PagesComponent,
    children: [
      {
        path: 'publicar_asignaturas',
        component: SeleccionarPensumComponent,
        canActivate: [canActivate],
      },
    ],
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class MateriasPosgradoRoutingModule { }
