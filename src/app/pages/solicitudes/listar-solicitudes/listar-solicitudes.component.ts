import { Component, OnInit } from '@angular/core';
import { AddAction, DeleteAction, EditAction, Settings } from 'angular2-smart-table';
import { environment } from 'src/environments/environment';
import { RequestManager } from 'src/app/core/manager/request.service';
import { UserService } from '../../services/userService';

@Component({
  selector: 'app-listar-solicitudes',
  templateUrl: './listar-solicitudes.component.html',
  styleUrls: ['./listar-solicitudes.component.scss']
})
export class ListarSolicitudesComponent implements OnInit {
  data: any[] = [];

  constructor(
    private request: RequestManager,
    private userService: UserService
  ) { }

  ngOnInit(): void {
    this.getSolicitudes();
  }

  private getSolicitudes(): void {
    if (this.userService.user?.user?.email) {
      this.request.get(
        environment.POLUX_MID_SERVICE,
        `solicitudes?user=${this.userService.user.user.email}`
      ).subscribe({
        next: (solicitudes: any[]) => {
          this.data = solicitudes;
          solicitudes.forEach(s => {
            s.FechaSolicitud = s.SolicitudTrabajoGrado.Fecha;
            s.SolicitudId = s.SolicitudTrabajoGrado.Id;
          });
        }, error: () => {
          console.log('fail?');
        }
      });
    }
    return
  }
  edit: EditAction = {
    editButtonContent: `<i class="fa-solid fa-check-to-slot smart-table-icon" title="Revisar Solicitud"></i>`,
    hiddenWhen(row) {
      return !row.getData().Revisar;
    },

  }
  view: DeleteAction = {
    deleteButtonContent: `<i class="fa-solid fa-eye smart-table-icon" title="Ver Solicitud"></i>`,
  }
  add: AddAction = {
    addButtonContent: '<p class="smart-table-icon-add">Crear</p>'
  }
  settings: Settings = {
    actions: {
      columnTitle: 'Acciones', // this.translate.instant('GLOBAL.Acciones'),
      position: 'right',
      add: true, // !!this.confService.getAccion('registrarAjusteManual'),
      edit: true,
      delete: true,// this.modo === 'consulta',
    },
    mode: 'external',
    edit: this.edit,
    add: this.add,
    delete: this.view,
    columns: {
      SolicitudId: {
        title: 'Número de radicado'
      },
      FechaSolicitud: {
        title: 'Fecha Solicitud',
        ...this.getSettingsDate()
      },
      SolicitudTrabajoGrado: {
        title: 'Tipo Solicitud',
        ...this.getSettingsObject('ModalidadTipoSolicitud.TipoSolicitud.Nombre')
      },
      EstadoSolicitud: {
        title: 'Estado Solicitud',
        ...this.getSettingsObject('Nombre')
      },
    }
  };

  public getSettingsObject(key: string) {
    return {
      valuePrepareFunction: (value: any) => {
        return this.getValueByNestedKey(value, key);
      },
    };
  }

  public getSettingsDate() {
    return {
      valuePrepareFunction: (value: any) => {
        return this.prepareFunctionDate(value);
      },
    };
  }

  private prepareFunctionDate(value?: string): string {
    if (!value) {
      return '';
    }

    return value.substring(0, 10);
  }

  private getValueByNestedKey(obj: any, key: string): any {
    const keys = key.split('.');
    let value = obj;

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return '';
      }
    }

    return value;
  }
}
