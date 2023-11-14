import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';

import { PagesRoutingModule } from './pages-routing.module';
import { DashboardComponent } from './dashboard/dashboard.component';
import { RequestManager } from '../core/manager/request.service';
import { InterceptorService } from '../core/interceptor/interceptor.service';
import { PagesComponent } from './pages.component';
import { SharedModule } from '../shared/shared-module.module';

const pagesComponents = [
  DashboardComponent,
  PagesComponent,
];
@NgModule({
  declarations: [
    ...pagesComponents,
  ],
  imports: [
    CommonModule,
    HttpClientModule,
    PagesRoutingModule,
    SharedModule,
  ],
  providers: [
    RequestManager,
    // MatDatepickerModule,
    { provide: HTTP_INTERCEPTORS, useClass: InterceptorService, multi: true },
    // { provide: MAT_DATE_LOCALE, useValue: 'es-CO' },
    // { provide: DateAdapter, useClass: MomentDateAdapter, deps: [MAT_DATE_LOCALE, MAT_MOMENT_DATE_ADAPTER_OPTIONS] },
    // { provide: MAT_DATE_FORMATS, useValue: MAT_MOMENT_DATE_FORMATS}
  ]
})
export class PagesModule { }
