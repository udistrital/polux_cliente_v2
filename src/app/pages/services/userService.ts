import { BehaviorSubject } from 'rxjs';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private userSubject = new BehaviorSubject({});
  public user$ = this.userSubject.asObservable();

  private permisosSubject = new BehaviorSubject({});
  public permisos$ = this.permisosSubject.asObservable();

  updateUser(dataUser: any): void {
    this.userSubject.next(dataUser);
  }

  updatePermisos(permisos: any[]): void {
    this.permisosSubject.next(permisos);
  }

}
