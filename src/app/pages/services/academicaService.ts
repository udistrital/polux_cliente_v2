import { Injectable } from '@angular/core';
import { RequestManager } from 'src/app/core/manager/request.service';
import { periodo, responsePeriodo } from 'src/app/shared/models/academica/periodo.model';
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

  public getPeriodoAnterior(): Promise<periodo> {
    return new Promise((resolve, reject) => {
      this.get('periodo_academico', 'P')
        .subscribe({
          next: (responsePeriodo: responsePeriodo) => {
            if (responsePeriodo.periodoAcademicoCollection?.periodoAcademico) {
              resolve(responsePeriodo.periodoAcademicoCollection.periodoAcademico[0]);
            } else {
              reject('Ocurrió un error consultando la información del calendario académico');
            }
          }, error: () => {
            reject('Ocurrió un error consultando la información del calendario académico')
          }
        });
    })
  }

}
