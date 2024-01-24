import { Component, OnInit } from '@angular/core';
import { AcademicaService } from '../../services/academicaService';
import { UserService } from '../../services/userService';
import { coordinador, pensum, periodo, responseCoordinadorCarrera, responsePeriodo } from 'src/app/shared/models/academica/periodo.model';

@Component({
  selector: 'app-seleccionar-pensum',
  templateUrl: './seleccionar-pensum.component.html',
  styleUrls: ['./seleccionar-pensum.component.scss']
})
export class SeleccionarPensumComponent implements OnInit {
  documento = '';
  periodo: periodo = new periodo();
  carreras: coordinador[] = [];
  pensums: pensum[] = [];

  carreraSeleccionada = '';
  pensumSeleccionado = '';

  mensaje = '';
  cargando = false;

  constructor(
    private academica: AcademicaService,
    private userService: UserService,
  ) {
    this.documento = this.userService.getDocumento();
  }

  ngOnInit() {
    this.cargando = true;
    this.cargar();
  }

  async cargar() {
    await Promise.all([this.cargarCarrerasCoordinador(), this.cargarPeriodo()])
      .catch((err) => this.mensaje = err)
      .finally(() => { this.cargando = false });
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
            if (response.periodoAcademicoCollection?.periodoAcademico.length) {
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

}
