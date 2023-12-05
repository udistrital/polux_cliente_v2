import { Injectable } from '@angular/core';
import { RequestManager } from 'src/app/core/manager/request.service';
import { environment } from 'src/environments/environment';
import { Parametro } from 'src/app/shared/models/parametro.model';

@Injectable({
  providedIn: 'root',
})
export class ParametrosService {

  constructor(
    private request: RequestManager,
  ) { }

  public get(endpoint: string, uri: string) {
    this.request.get(environment.PARAMETROS_SERVICE, `${endpoint}?${uri}`)
  }

  public getEstadosTrabajoGrado() {
    const endpoint = 'parametro';
    const uri = 'query=TipoParametroId__CodigoAbreviacion:EST_TRG&limit=0';
    return this.request.get(environment.PARAMETROS_SERVICE, `${endpoint}?${uri}`);
  }

  public getRolesTrabajoGrado() {
    const endpoint = 'parametro';
    const uri = 'query=TipoParametroId__CodigoAbreviacion:ROL_TRG&limit=0';
    return this.request.get(environment.PARAMETROS_SERVICE, `${endpoint}?${uri}`);
  }

  public getModalidadesTrabajoGrado() {
    const endpoint = 'parametro';
    const uri = 'query=TipoParametroId__CodigoAbreviacion:MOD_TRG&limit=0';
    return this.request.get(environment.PARAMETROS_SERVICE, `${endpoint}?${uri}`);
  }

  public getEstadosRevisionTrabajoGrado() {
    const endpoint = 'parametro';
    const uri = 'query=TipoParametroId__CodigoAbreviacion:ESTREV_TRG&limit=0';
    return this.request.get(environment.PARAMETROS_SERVICE, `${endpoint}?${uri}`);
  }

  public fillPropiedad(obj: any, key: string, parametros: Parametro[]) {
    const keys = key.split('.');
    let value = obj;

    for (const k of keys) {
      if (obj && typeof obj === 'object' && k in value) {
        if (typeof value[k] === 'number') {
          value[k] = parametros.find(parametro => value[k] === parametro.Id) || new Parametro();
        } else {
          value = value[k];
        }
      } else {
        break;
      }
    }

    return obj;
  }

}
