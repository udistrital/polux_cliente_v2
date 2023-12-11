import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ListaTrabajosComponent } from './lista-trabajos/lista-trabajos.component';
import { canActivate } from 'src/app/core/guards/guards-guard.guard';

const routes: Routes = [
  {
    path: 'tgs/revision_documento',
    component: ListaTrabajosComponent,
    canActivate: [canActivate],
    data: { modo: 'DOCENTE' },
  },
  {
    path: 'revision_documento',
    component: ListaTrabajosComponent,
    canActivate: [canActivate],
    data: { modo: 'ESTUDIANTE' },
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class RevisionRoutingModule { }
