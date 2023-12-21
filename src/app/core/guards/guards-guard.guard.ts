import { inject } from '@angular/core';
import { CanActivateChildFn, CanActivateFn } from '@angular/router';
import { UserService } from 'src/app/pages/services/userService';

export const canActivate: CanActivateFn = (route, state): any => {
  const userService: UserService = inject(UserService);
  if (Array.isArray(userService.permisos)) {
    if (Array.isArray(userService.permisos)) {
      if (findRoute(userService.permisos, state.url)) {
        return true;
      } else if (Object.entries(route.params).length === 0) {
        console.info('No tiene permiso')
        return false;
      } else {
        let url = decodeURIComponent(state.url);
        const entries = Object.entries(route.params);

        entries.forEach(([key, value]) => {
          url = url.replace('/' + value, '/:' + key);
        });

        const allowed = !!findRoute(userService.permisos, url)
        if (allowed) {
          return true;
        } else {
          console.info('No tiene permiso')
          return false;
        }
      }
    } else {
      return false;
    }

  };
}

export const canActivateChild: CanActivateChildFn = (route, state): any => {
  const userService: UserService = inject(UserService);

  if (Array.isArray(userService.permisos)) {
    if (checkRoute(userService.permisos, '/pages/' + state.url)) {
      return true;
    } else if (Object.entries(route.params).length === 0) {
      console.info('No tiene permiso', state.url)
      return false;
    } else {
      let url = decodeURIComponent(state.url);
      const entries = Object.entries(route.params);

      entries.forEach(([key, value]) => {
        url = url.replace('/' + value, '/:' + key);
      });

      const allowed = !!checkRoute(userService.permisos, url)
      if (allowed) {
        return true;
      } else {
        console.info('No tiene permiso')
        return false;
      }
    }
  } else {
    return false;
  }

}

function findRoute(permisos: any[], option: string): any {
  return permisos.find(opt => ('/pages/' + opt.Url === option) ||
    (opt.Opciones && opt.Opciones.length && findRoute(opt.Opciones, option)));
}

function checkRoute(permisos: any[], option: string): any {
  return permisos.some(opt => (opt.Url.includes(option)) ||
    (opt.Opciones && opt.Opciones.length && checkRoute(opt.Opciones, option)));
}
