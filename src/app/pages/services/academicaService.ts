import { Injectable } from '@angular/core';
import { RequestManager } from 'src/app/core/manager/request.service';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AcademicaService {

  constructor(
    private request: RequestManager,
  ) { }

  public get(endpoint: string, uri: string) {
    return this.request.get(environment.ACADEMICA_SERVICE, `${endpoint}/${uri}`)
  }

  public post(endpoint: string, element: any) {
    return this.request.post(environment.ACADEMICA_SERVICE, `${endpoint}`, element);
  }

  public getPeriodoAnterior(): Promise<any> {
    return new Promise((resolve) => {
      this.get('periodo_academico', 'P')
        .subscribe((responsePeriodo) => {
          if (responsePeriodo.periodoAcademicoCollection.periodoAcademico) {
            resolve(responsePeriodo.periodoAcademicoCollection.periodoAcademico[0]);
          } else {
            resolve({});
          }
        });
    })
  }

}
