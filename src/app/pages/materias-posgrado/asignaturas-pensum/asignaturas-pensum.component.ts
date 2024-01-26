import { AfterViewInit, Component, Input, OnChanges, OnInit, SimpleChanges, ViewChild } from '@angular/core';
import { asignatura, periodo, responseAsignatura } from 'src/app/shared/models/academica/periodo.model';
import { AcademicaService } from '../../services/academicaService';
import { PoluxCrudService } from '../../services/poluxCrudService';
import { EspaciosAcademicosElegibles } from 'src/app/shared/models/espaciosAcademicosElegibles.model';
import { PoluxMidService } from '../../services/poluxMidService';
import { creditosMinimosResponse } from 'src/app/shared/models/poluxMid/creditosMinimos.model';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { CarreraElegible } from 'src/app/shared/models/carreraElegible.model';
import { AlertService } from '../../services/alertService';

type asignaturaTabla = asignatura & {
  check: boolean;
}

@Component({
  selector: 'app-asignaturas-pensum',
  templateUrl: './asignaturas-pensum.component.html',
  styleUrls: ['./asignaturas-pensum.component.scss']
})
export class AsignaturasPensumComponent implements OnChanges, OnInit, AfterViewInit {
  @Input() carrera = '';
  @Input() pensum = '';
  @Input() modalidad!: 'PREGRADO' | 'POSGRADO';
  @Input() periodo!: periodo;

  totalCreditos = 0;
  creditosMinimos = -1;

  mensaje = '';
  cargando = false;

  displayedColumns = ['check', 'codigo', 'creditos', 'nombre', 'semestre'];
  dataSource = new MatTableDataSource<asignaturaTabla>([]);
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(
    private academica: AcademicaService,
    private poluxCrud: PoluxCrudService,
    private poluxMid: PoluxMidService,
    private altert: AlertService,
  ) { }

  ngOnChanges(changes: SimpleChanges): void {
    if (Object.values(changes).some(change => !change.firstChange)) {
      this.dataSource.data = [];
      this.cargando = true;
      this.cargarAsignaturas()
        .catch((err) => this.mensaje = err)
        .finally(() => this.cargando = false);
    }
  }

  ngOnInit(): void {
    this.cargarParametros();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
  }

  private async cargarParametros() {
    if (!this.carrera || !this.pensum) {
      return;
    }

    this.cargando = true;
    await Promise.all([this.cargarAsignaturas(), this.getCreditosMinimos()])
      .catch((err) => this.mensaje = err)
      .finally(() => this.cargando = false);
  }

  private cargarAsignaturas(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.academica.get('asignaturas_carrera_pensum', `${this.carrera}/${this.pensum}`)
        .subscribe({
          next: (response: responseAsignatura) => {
            if (response.asignaturaCollection?.asignatura?.length) {
              this.buscarAsignaturasElegibles(response.asignaturaCollection.asignatura)
                .then(() => resolve())
                .catch((err) => reject(err));
            } else {
              reject('No se encontraron asignaturas para el pénsum seleccionado.');
            }
          }, error: () => {
            reject('No se pudieron cargar las asignaturas para el pénsum seleccionado.');
          }
        });
    });
  }

  private buscarAsignaturasElegibles(asignaturas: asignatura[]): Promise<void> {
    return new Promise((resolve, reject) => {
      const payloadCarreras = `query=CodigoCarrera:${this.carrera},CodigoPensum:${this.pensum}` +
        `,Anio:${this.periodo.anio},Periodo:${this.periodo.periodo},Nivel:${this.modalidad}`;
      this.poluxCrud.get('carrera_elegible', payloadCarreras)
        .subscribe({
          next: (response) => {
            if (response.length > 0) {
              const codigos = asignaturas.map(as => as.codigo);
              var parametros = `query=Activo:true,CarreraElegible:${response[0].Id},CodigoAsignatura__in:${codigos.join('|')}`;
              this.poluxCrud.get('espacios_academicos_elegibles', parametros)
                .subscribe({
                  next: (response: EspaciosAcademicosElegibles[]) => {
                    this.dataSource.data = asignaturas.map(asignatura => {
                      const asignaturaElegible = response.find(a => asignatura.codigo === `${a.CodigoAsignatura}`);
                      return <asignaturaTabla>{
                        ...asignatura,
                        check: asignaturaElegible?.Activo,
                      };
                    });

                    this.getTotalCreditos();
                    resolve();
                  }, error: () => {
                    reject('No se pudieron cargar los espacios académicos registrados.')
                  }
                });
            } else {
              this.dataSource.data = asignaturas.map(a => {
                return <asignaturaTabla>{
                  ...a,
                  check: false,
                };
              });
              resolve();
            }
          }, error: () => {
            reject('No se pudieron cargar las carreras registradas.')
          }
        });
    })
  }

  private getCreditosMinimos(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.poluxMid.get('creditos/ObtenerMinimo', '')
        .subscribe({
          next: (response: creditosMinimosResponse) => {
            if (this.modalidad === 'POSGRADO') {
              this.creditosMinimos = parseInt(response.minimo_creditos_posgrado);
            } else if (this.modalidad === 'PREGRADO') {
              this.creditosMinimos = parseInt(response.minimo_creditos_profundizacion);
            }
            resolve();
          }, error: () => {
            reject('Ocurrió un error al cargar el minimo de creditos, por favor verifique su conexión, e intente de nuevo.');
          }
        });
    });
  }

  public getTotalCreditos() {
    this.totalCreditos = this.dataSource.data.filter(asignatura => asignatura.check)
      .reduce((acc, curr) => acc + parseInt(curr.creditos, 10), 0);
  }

  public toggleAllCheckboxes(event: MatCheckboxChange) {
    this.dataSource.data.forEach(a => a.check = event.checked);
    this.getTotalCreditos();
  }

  public registrarMaterias() {
    if (this.totalCreditos >= this.creditosMinimos) {
      const carreraElegible = <CarreraElegible>{
        CodigoCarrera: parseInt(this.carrera, 10),
        Periodo: parseInt(this.periodo.periodo, 10),
        Anio: parseInt(this.periodo.anio, 10),
        CodigoPensum: parseInt(this.pensum, 10),
        Nivel: this.modalidad,
      };

      const espacios: EspaciosAcademicosElegibles[] = [];
      this.dataSource.data.filter(asignatura => asignatura.check)
        .forEach(asignaturaSeleccionada => {
          espacios.push(<EspaciosAcademicosElegibles>{
            CodigoAsignatura: parseInt(asignaturaSeleccionada.codigo, 10),
            Activo: true,
            CarreraElegible: carreraElegible,
          });
        });

      const transaccion = <TrPublicarAsignaturas>{
        CarreraElegible: carreraElegible,
        EspaciosAcademicosElegibles: espacios,
      };

      this.poluxCrud.post('tr_publicar_asignaturas', transaccion)
        .subscribe({
          next: () => {
          }, error: () => {
          }
        });
    }
  }

}

interface TrPublicarAsignaturas {
  CarreraElegible: CarreraElegible;
  EspaciosAcademicosElegibles: EspaciosAcademicosElegibles[];
}
