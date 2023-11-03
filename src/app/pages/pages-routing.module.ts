import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardComponent } from './dashboard/dashboard.component';
import { PagesComponent } from './pages.component';
import { canActivate } from '../core/guards/guards-guard.guard';

const routes: Routes = [{
  path: '',
  component: PagesComponent,
  children: [
    {
      path: 'dashboard',
      component: DashboardComponent,
    },
    {
      path: 'administracion',
      component: DashboardComponent,
      canActivate: [canActivate],
    },
    {
      path: 'docente',
      component: DashboardComponent,
      canActivate: [canActivate],
    },
    {
      path: 'estudiante',
      component: DashboardComponent,
      canActivate: [canActivate],
    },
    {
      path: 'evaluar_proyecto',
      component: DashboardComponent,
      canActivate: [canActivate],
    },
    {
      path: 'materias_posgrado',
      component: DashboardComponent,
      canActivate: [canActivate],
    },
    {
      path: 'perfil_docente',
      component: DashboardComponent,
      canActivate: [canActivate],
    },
    {
      path: 'solicitudes',
      component: DashboardComponent,
      canActivate: [canActivate],
    },
    {
      path: '', redirectTo: 'dashboard', pathMatch: 'full',
    },
  ]
}];
@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PagesRoutingModule { }
