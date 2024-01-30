import { Injectable } from '@angular/core';
import { RequestManager } from 'src/app/core/manager/request.service';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class PoluxMidService {

  constructor(
    private request: RequestManager,
  ) { }

  public get(endpoint: string, uri: string) {
    return this.request.get(environment.POLUX_MID_SERVICE, `${endpoint}?${uri}`)
  }

  public put(endpoint: string, id: number, element: any) {
    return this.request.put(environment.POLUX_MID_SERVICE, endpoint, id, element)
  }

  public post(endpoint: string, element: any) {
    return this.request.post(environment.POLUX_MID_SERVICE, `${endpoint}`, element);
  }

}
