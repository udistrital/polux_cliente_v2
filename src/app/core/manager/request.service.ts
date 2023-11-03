import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, catchError, map, mergeMap } from 'rxjs';
import { ErrorManager } from './error.service';

@Injectable({
  providedIn: 'root'
})
export class RequestManager {
  private headerSubject = new BehaviorSubject({});
  public header$ = this.headerSubject.asObservable();

  constructor(
    private http: HttpClient,
    private errManager: ErrorManager,
  ) {
    this.updateHeaderToken();
  }

  updateHeaderToken(): void {
    const accessToken = localStorage.getItem('access_token');
    if (accessToken) {
      this.headerSubject.next({
        headers: new HttpHeaders({
          Accept: 'application/json',
          Authorization: `Bearer ${accessToken}`,
        })
      });
    }
  }

  /**
   * Perform a GET http request
   *
   * @param path service's path from environment end-point
   * @param endpoint service's end-point
   * @param params (an Key, Value object with que query params for the request)
   * @returns Observable<any>
   */
  get(path: string, endpoint: string): Observable<any> {
    return this.header$.pipe(
      mergeMap((header: any) => {
        header['observe'] = 'body';
        return this.http.get<any>(`${path}${endpoint}`, header).pipe(
          map(
            (res: any) => {
              if (res && Object.prototype.hasOwnProperty.call(res, 'Body')) {
                return res.Body;
              } else {
                return res;
              }
            },
          ),
          catchError(this.errManager.handleError.bind(this)),
        );
      })
    );
  }

  /**
   * Perform a POST http request
   *
   * @param path service's path from environment end-point
   * @param endpoint service's end-point
   * @param element data to send as JSON
   * @returns Observable<any>
   */
  post(path: string, endpoint: string, element: any): Observable<any> {
    return this.header$.pipe(
      mergeMap((header: any) => {
        header['observe'] = 'body';
        return this.http.post<any>(`${path}${endpoint}`, element, header).pipe(
          catchError(this.errManager.handleError)
        );
      })
    );
  }

  /**
   * Perform a PUT http request
   *
   * @param path service's path from environment end-point
   * @param endpoint service's end-point
   * @param element data to send as JSON, With the id to UPDATE
   * @returns Observable<any>
   */
  put(path: string, endpoint: string, element: any, id: number): Observable<any> {
    return this.header$.pipe(
      mergeMap((header: any) => {
        header['observe'] = 'body';
        return this.http.put<any>(`${path}${endpoint}/${id}`, element, header).pipe(
          catchError(this.errManager.handleError),
        );
      })
    );
  }

  /**
   * Perform a DELETE http request
   *
   * @param path service's path from environment end-point
   * @param endpoint service's end-point
   * @param id element's id for remove
   * @returns Observable<any>
   */
  delete(path: string, endpoint: string, id: number): Observable<any> {
    return this.header$.pipe(
      mergeMap((header: any) => {
        header['observe'] = 'body';
        return this.http.delete<any>(`${path}${endpoint}/${id}`, header).pipe(
          catchError(this.errManager.handleError),
        );
      })
    );
  }
}
