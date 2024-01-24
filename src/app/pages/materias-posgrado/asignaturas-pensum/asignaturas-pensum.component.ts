import { Component, Input, OnInit } from '@angular/core';
import { Settings } from 'angular2-smart-table';
import { asignatura, periodo, responseAsignatura } from 'src/app/shared/models/academica/periodo.model';
import { AcademicaService } from '../../services/academicaService';
import { PoluxCrudService } from '../../services/poluxCrudService';
import { SesionesCrudService } from '../../services/sesionesCrudService';
import { EspaciosAcademicosElegibles } from 'src/app/shared/models/espaciosAcademicosElegibles.model';
import * as moment from 'moment';

class asignaturaTabla extends asignatura {
  check = false;
}

@Component({
  selector: 'app-asignaturas-pensum',
  templateUrl: './asignaturas-pensum.component.html',
  styleUrls: ['./asignaturas-pensum.component.scss']
})
export class AsignaturasPensumComponent implements OnInit {
  @Input() carrera = '';
  @Input() pensum = '';
  @Input() periodo: periodo = new periodo;

  asignaturas: asignaturaTabla[] = [];
  totalCreditos = 0;

  settings: Settings = {
    actions: {
      columnTitle: 'Acciones',
      position: 'right',
      add: false,
      edit: false,
      delete: false,
    },
    mode: 'external',
    selectMode: 'multi',
    noDataMessage: 'No tiene trabajos para consultar',
    columns: {
      codigo: {
        title: 'Código',
      },
      nombre: {
        title: 'Nombre',
      },
      creditos: {
        title: 'Créditos',
      },
      semestre: {
        title: 'Semestre',
      },
    },
  }

  constructor(
    private academica: AcademicaService,
    private poluxCrud: PoluxCrudService,
    private sesionesCrud: SesionesCrudService,
  ) { }

  ngOnInit(): void {
    this.cargarAsignaturas();
  }

  cargarAsignaturas() {
    if (!this.carrera || !this.pensum) {
      return;
    }

    this.verificarFechas();
    this.academica.get('asignaturas_carrera_pensum', `${this.carrera}/${this.pensum}`)
      .subscribe({
        next: (response: responseAsignatura) => {
          if (response.asignaturaCollection?.asignatura) {
            this.buscarAsignaturasElegibles(response.asignaturaCollection.asignatura);
          }
          // ctrl.habilitar = false;
          // ctrl.habilitar2 = true;

          // traer fechas para habilitar botones
          // promiseArr.push(ctrl.verificarFechas($scope.periodo, $scope.anio));
        }, error: () => {
          // ctrl.mensajeError = $translate.instant('ERROR.CARGAR_ASIGNATURAS_SOLICITUD');
        }
      });
  }

  private buscarAsignaturasElegibles(asignaturas: asignatura[]) {
    const payloadCarreras = `query=CodigoCarrera:${this.carrera},CodigoPensum:${this.pensum}`; +
      `,Anio:${this.periodo.anio},Periodo:${this.periodo.periodo}`;
    this.poluxCrud.get('carrera_elegible', payloadCarreras)
      .subscribe({
        next: (response) => {
          if (response.length > 0) {
            const codigos = asignaturas.map(as => as.codigo);
            var parametros = `query=CarreraElegible__Id:${response[0].Id},CodigoAsignatura__in:${codigos}`;
            this.poluxCrud.get('espacios_academicos_elegibles', parametros)
              .subscribe({
                next: (response: EspaciosAcademicosElegibles[]) => {
                  asignaturas.forEach((asignatura: asignatura) => {
                    const asignaturaTabla = <asignaturaTabla>{
                      ...asignatura,
                    };

                    const asignaturaEncontrada = response.find(a => asignatura.codigo === `${a.CodigoAsignatura}`);
                    if (asignaturaEncontrada) {
                      asignaturaTabla.check = asignaturaEncontrada.Activo;
                      this.totalCreditos += parseInt(asignatura.creditos, 10);
                    }

                    this.asignaturas.push(asignaturaTabla);
                  });
                }, error: () => {
                  // ctrl.mensajeError = $translate.instant('ERROR.CARGAR_ASIGNATURAS_SOLICITUD');
                }
              });
          } else { // si la carrera no está en la tabla: carrera_elegible
            asignaturas.forEach((asignatura: asignatura) => {
              const asignaturaTabla = <asignaturaTabla>{
                ...asignatura,
                check: false,
              };
              this.asignaturas.push(asignaturaTabla);
            });
          }
        }, error: () => {
          // ctrl.mensajeError = $translate.instant('ERROR.CARGAR_ASIGNATURAS_SOLICITUD');
        }
      });
  }

  private verificarFechas() {
    const fechaActual = moment().format('YYYY-MM-DD HH:mm');
    const modalidad = 'POSGRADO';
    let tipoSesionPadre = 0;
    if (modalidad === 'POSGRADO') {
      tipoSesionPadre = 1;
    } else if (modalidad === 'PREGRADO') {
      tipoSesionPadre = 9;
    }
    const payloadSesiones = `limit=1&query=SesionPadre.TipoSesion.Id:${tipoSesionPadre}` +
      `,SesionHijo.TipoSesion.CodigoAbreviacion:PMP,SesionPadre.periodo:${this.periodo.anio}${this.periodo.periodo}`;

    this.sesionesCrud.get('relacion_sesiones', payloadSesiones)
      .subscribe({
        next: (responseFechas) => {
          if (responseFechas.length > 0) {
            const sesion = responseFechas[0];
            const fechaHijoInicio = new Date(sesion.SesionHijo.FechaInicio);
            fechaHijoInicio.setTime(fechaHijoInicio.getTime() + fechaHijoInicio.getTimezoneOffset() * 60 * 1000);

            let fechaInicio = moment(fechaHijoInicio).format('YYYY-MM-DD HH:mm');
            const fechaHijoFin = new Date(sesion.SesionHijo.FechaFin);
            fechaHijoFin.setTime(fechaHijoFin.getTime() + fechaHijoFin.getTimezoneOffset() * 60 * 1000);

            fechaInicio = moment(fechaHijoInicio).format('YYYY-MM-DD HH:mm');
            const fechaFin = moment(fechaHijoFin).format('YYYY-MM-DD HH:mm');

            if (fechaInicio <= fechaActual && fechaActual <= fechaFin) {
              // ctrl.mostrarBotones = false;
              // deferFechas.resolve();
            } else {
              // ctrl.mostrarBotones = true;
              // deferFechas.resolve();
            }
          } else {
            // ctrl.mensajeError = $translate.instant('ERROR.SIN_FECHAS_MODALIDAD');
            // deferFechas.reject(false);
          }
        }, error: () => {
          // ctrl.mensajeError = $translate.instant('ERROR.CARGAR_FECHAS_MODALIDAD');
          // deferFechas.reject(error);
        }
      });
  }

  onRowSelect(event: any) {
  }

}
