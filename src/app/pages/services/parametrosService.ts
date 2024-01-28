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
    return this.request.get(environment.PARAMETROS_SERVICE, `${endpoint}?${uri}`)
  }

  public getAllParametroByTipo(tipo: string) {
    return this.get('parametro', `limit=0&query=TipoParametroId__CodigoAbreviacion__in:${tipo}`);
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

  public findParametro(value: number | Parametro, parametros: Parametro[]) {
    return parametros.find(parametro => value === parametro.Id) || new Parametro();
  }

}
