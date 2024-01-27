import { Component, OnInit } from '@angular/core';
import { AcademicaService } from '../../services/academicaService';
import { UserService } from '../../services/userService';
import { coordinador, pensum, periodo, responseCoordinadorCarrera, responsePeriodo } from 'src/app/shared/models/academica/periodo.model';
import { RelacionSesiones } from 'src/app/shared/models/sesionesCrud/relacionSesiones.model';
import { SesionesCrudService } from '../../services/sesionesCrudService';
import * as moment from 'moment';

@Component({
  selector: 'app-seleccionar-pensum',
  templateUrl: './seleccionar-pensum.component.html',
  styleUrls: ['./seleccionar-pensum.component.scss']
})
export class SeleccionarPensumComponent implements OnInit {
  documento = '';
  periodo!: periodo;
  carreras: coordinador[] = [];
  pensums: pensum[] = [];

  carreraSeleccionada = '';
  pensumSeleccionado = '';

  mensaje = '';
  cargando = false;

  constructor(
    private academica: AcademicaService,
    private sesionesCrud: SesionesCrudService,
    private userService: UserService,
  ) {
    this.documento = this.userService.getDocumento();
  }

  ngOnInit() {
    this.cargando = true;

    this.cargarPeriodo()
      .then(() => this.verificarFechas())
      .then(() => this.cargarCarrerasCoordinador())
      .catch((err) => this.mensaje = err)
      .finally(() => this.cargando = false);
  }

  public getPensums() {
    if (!this.carreraSeleccionada) {
      return;
    }

    this.cargando = true;
    this.pensums = [];
    this.pensumSeleccionado = '';
    this.academica.get('pensums', this.carreraSeleccionada)
      .subscribe({
        next: (response) => {
          this.cargando = false;
          if ((response.pensums.pensum)) {
            this.pensums = response.pensums.pensum;
          } else {
            this.mensaje = 'El proyecto curricular no tiene pensums activos';
          }
        }, error: () => {
          this.mensaje = 'Ocurrió un error al cargar los proyectos curriculares asociados al coordinador, por favor verifique su conexión e intente de nuevo.';
          this.cargando = false;
        }
      });
  }

  private cargarCarrerasCoordinador(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.academica.get('coordinador_carrera', `${this.documento}/POSGRADO`)
        .subscribe({
          next: (response: responseCoordinadorCarrera) => {
            if (response.coordinadorCollection?.coordinador) {
              this.carreras = response.coordinadorCollection?.coordinador;
              resolve();
            } else {
              reject('Señor Coordinador, no tiene asignados proyectos curriculares con nivel de POSGRADO');
            }
          }, error() {
            reject('Ocurrió un error al cargar los proyectos curriculares asociados al coordinador, por favor verifique su conexión e intente de nuevo.')
          },
        });
    })
  }

  private cargarPeriodo(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.academica.get('periodo_academico', 'X')
        .subscribe({
          next: (response: responsePeriodo) => {
            if (response.periodoAcademicoCollection?.periodoAcademico?.length) {
              this.periodo = response.periodoAcademicoCollection.periodoAcademico[0];
              resolve();
            } else {
              reject('Ocurrió un error al consultar el periodo académico correspondiente a esta operación. Comuníquese con el administrador.');
            }
          }, error() {
            reject('Ocurrió un error al consultar el periodo académico correspondiente a esta operación. Comuníquese con el administrador.');
          },
        });
    })
  }

  private verificarFechas(): Promise<void> {
    return new Promise((resolve, reject) => {
      const fechaActual = moment().format('YYYY-MM-DD HH:mm');
      const tipoSesionPadre = 1;

      const payloadSesiones = `limit=-1&query=SesionPadre.TipoSesion.Id:${tipoSesionPadre}` +
        `,SesionHijo.TipoSesion.CodigoAbreviacion:PMP,SesionPadre.periodo:${this.periodo.anio}${this.periodo.periodo}`;

      this.sesionesCrud.get('relacion_sesiones', payloadSesiones)
        .subscribe({
          next: (responseFechas: RelacionSesiones[]) => {
            if (responseFechas.length > 0) {
              const sesion = responseFechas[0];
              const fechaHijoInicio = new Date(sesion.SesionHijo.FechaInicio);
              fechaHijoInicio.setTime(fechaHijoInicio.getTime() + fechaHijoInicio.getTimezoneOffset() * 60 * 1000);

              let fechaInicio = moment(fechaHijoInicio).format('YYYY-MM-DD HH:mm');
              fechaInicio = moment(fechaHijoInicio).format('YYYY-MM-DD HH:mm');

              const fechaHijoFin = new Date(sesion.SesionHijo.FechaFin);
              fechaHijoFin.setTime(fechaHijoFin.getTime() + fechaHijoFin.getTimezoneOffset() * 60 * 1000);
              const fechaFin = moment(fechaHijoFin).format('YYYY-MM-DD HH:mm');

              if (fechaInicio <= fechaActual && fechaActual <= fechaFin) {
                reject('El proceso de publicación de materias para cursar la modalidad no se encuentra vigente.');
              } else {
                resolve();
              }
            } else {
              reject('Actualmente no hay fechas para los procesos de la modalidad asociadas al periodo académico.');
            }
          }, error: () => {
            reject('Ocurrió un error al cargar las fechas asociadas a los procesos de la modalidad, por favor verifique su conexión e intente de nuevo.');
          }
        });
    });
  }

}
