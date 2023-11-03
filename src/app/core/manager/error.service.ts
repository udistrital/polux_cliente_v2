import { HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ErrorManager {
  public handleError(error: HttpErrorResponse): Observable<Error> {
    if (error.error instanceof ErrorEvent) {
      // A client-side or network error occurred. Handle it accordingly.
      console.error('An error occurred:', error.error.message);
    } else {
      // The backend returned an unsuccessful response code.
      console.error(`Backend returned code ${error.status ? error.status : 'no code'}, ` + `result was: ${error.message}`);
    }
    // return an observable with a user-facing error message
    return throwError(() => {
      return new Error(error.message);
    });
  }
}
