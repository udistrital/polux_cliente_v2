import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardComponent } from './dashboard/dashboard.component';
import { PagesComponent } from './pages.component';
import { canActivateChild } from '../core/guards/guards-guard.guard';

const routes: Routes = [{
  path: '',
  component: PagesComponent,
  children: [
    {
      path: '', redirectTo: 'dashboard', pathMatch: 'full',
    },
    {
      path: 'dashboard',
      component: DashboardComponent,
    },
    {
      path: 'administracion',
      loadChildren: () => import('./administracion/administracion.module').then(m => m.AdministracionModule),
      canActivateChild: [canActivateChild],
    },
    {
      path: 'docente',
      loadChildren: () => import('./docente/docente.module').then(m => m.DocenteModule),
      canActivateChild: [canActivateChild],
    },
    {
      path: 'estudiante',
      loadChildren: () => import('./estudiante/estudiante.module').then(m => m.EstudianteModule),
      canActivateChild: [canActivateChild],
    },
    {
      path: 'evaluar_proyecto',
      loadChildren: () => import('./evaluar/evaluar.module').then(m => m.EvaluarModule),
      canActivateChild: [canActivateChild],
    },
    {
      path: 'materias_posgrado',
      loadChildren: () => import('./materias-posgrado/materias-posgrado.module').then(m => m.MateriasPosgradoModule),
      canActivateChild: [canActivateChild],
    },
    {
      path: 'perfil_docente',
      loadChildren: () => import('./perfil-docente/perfil-docente.module').then(m => m.PerfilDocenteModule),
      canActivateChild: [canActivateChild],
    },
    {
      path: 'solicitudes',
      loadChildren: () => import('./solicitudes/solicitudes.module').then(m => m.SolicitudesModule),
      canActivateChild: [canActivateChild],
    },
  ]
}];
@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PagesRoutingModule { }
