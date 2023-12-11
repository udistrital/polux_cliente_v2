import { Injectable } from '@angular/core';
import { RequestManager } from 'src/app/core/manager/request.service';
import { environment } from 'src/environments/environment';
import { Parametro } from 'src/app/shared/models/parametro.model';

@Injectable({
  providedIn: 'root',
})
export class DocumentoCrudService {

  constructor(
    private request: RequestManager,
  ) { }

  public get(endpoint: string, uri: string) {
    return this.request.get(environment.DOCUMENTO_CRUD_SERVICE, `${endpoint}?${uri}`)
  }

}
