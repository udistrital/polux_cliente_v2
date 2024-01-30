import { Injectable } from '@angular/core';
import { RequestManager } from 'src/app/core/manager/request.service';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class SesionesCrudService {

  constructor(
    private request: RequestManager,
  ) { }

  public get(endpoint: string, uri: string) {
    return this.request.get(environment.SESIONES_SERVICE, `${endpoint}?${uri}`)
  }

  public put(endpoint: string, id: number, element: any) {
    return this.request.put(environment.SESIONES_SERVICE, endpoint, id, element)
  }

  public post(endpoint: string, element: any) {
    return this.request.post(environment.SESIONES_SERVICE, `${endpoint}`, element);
  }

}
