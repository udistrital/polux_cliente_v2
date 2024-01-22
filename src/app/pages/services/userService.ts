import { BehaviorSubject } from 'rxjs';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private userSubject = new BehaviorSubject({});
  public user$ = this.userSubject.asObservable();
  public user: any = {};
  public permisos: any[] = [];

  private permisosSubject = new BehaviorSubject({});
  public permisos$ = this.permisosSubject.asObservable();

  updateUser(dataUser: any): void {
    this.userSubject.next(dataUser);
    this.user = dataUser;
  }

  updatePermisos(permisos: any[]): void {
    this.permisosSubject.next(permisos);
    this.permisos = permisos;
  }

  getCodigo(): string {
    return this.user.userService?.Codigo ? this.user.userService?.Codigo : this.user.userService?.documento;
  }

  getDocumento(): string {
    return this.user.userService?.documento;
  }

  findAction(accion: string) {
    return this.findActionFlat(this.permisos, accion);
  }

  findActionFlat(permisos: any[], accion: string): any {
    return permisos.find(opt => (opt.Nombre === accion) ||
      (opt.Opciones && opt.Opciones.length && this.findActionFlat(opt.Opciones, accion)));
  }

}
