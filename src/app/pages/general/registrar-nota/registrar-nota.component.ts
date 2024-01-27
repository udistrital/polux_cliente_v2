import { Component, OnInit } from '@angular/core';
import { VinculacionTrabajoGrado } from 'src/app/shared/models/vinculacionTrabajoGrado.model';
import { PoluxCrudService } from '../../services/poluxCrudService';
import { ParametrosService } from '../../services/parametrosService';
import { Parametro } from 'src/app/shared/models/parametro.model';
import { firstValueFrom } from 'rxjs';
import { TipoDocumento } from 'src/app/shared/models/tipoDocumento.model';
import { DocumentoCrudService } from '../../services/documentoCrudService';
import { UserService } from '../../services/userService';
import { CustomAction, CustomActionEvent, DeleteAction, DeleteEvent, EditAction, EditEvent, Settings } from 'angular2-smart-table';
import { SmartTableService } from '../../services/smartTableService';
import { RevisionTrabajoGrado } from 'src/app/shared/models/revisionTrabajoGrado.model';
import { DocumentoTrabajoGrado } from 'src/app/shared/models/documentoTrabajoGrado.model';
import { EstudianteTrabajoGrado } from 'src/app/shared/models/estudianteTrabajoGrado.model';
import { AcademicaService } from '../../services/academicaService';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { GestorDocumentalService } from '../../services/gestorDocumentalService';
import { AlertService } from '../../services/alertService';
import { DocumentoEscrito } from 'src/app/shared/models/documentoEscrito.model';
import { Comentario } from 'src/app/shared/models/comentario.model';
import { datosEstudiante, responseDatosEstudiante } from 'src/app/shared/models/academica/periodo.model';
import { EvaluacionTrabajoGrado } from 'src/app/shared/models/evaluacionTrabajoGrado.model';

interface TrRegistrarRevisionTg {
  Comentarios: Comentario[],
  RevisionTrabajoGrado: RevisionTrabajoGrado
}

@Component({
  selector: 'app-registrar-nota',
  templateUrl: './registrar-nota.component.html',
  styleUrls: ['./registrar-nota.component.scss']
})
export class RegistrarNotaComponent implements OnInit {
  cargandoTrabajos = true;
  trabajosGrado: VinculacionTrabajoGrado[] = [];
  documento = '';
  parametros: Parametro[] = [];
  tiposDocumento: TipoDocumento[] = [];
  settings: Settings;

  trabajoSeleccionado: any;
  estudiantes: datosEstudiante[] = [];
  docTrabajoGrado: DocumentoTrabajoGrado = new DocumentoTrabajoGrado();
  notaForm: FormGroup | undefined;

  registrarNota = false;
  devolver = false;
  mensaje = '';
  cargando = false;

  constructor(
    private userService: UserService,
    private poluxCrud: PoluxCrudService,
    private parametrosCrud: ParametrosService,
    private documentosCrud: DocumentoCrudService,
    private academica: AcademicaService,
    private smartTable: SmartTableService,
    private gestorDocumental: GestorDocumentalService,
    private alert: AlertService,
  ) {
    this.documento = this.userService.getDocumento();
    this.settings = this.getSettings;
  }

  ngOnInit(): void {
    this.consultarParametros();
  }

  private async consultarParametros() {
    const payloadParametros = 'limit=0&query=TipoParametroId__CodigoAbreviacion__in:MOD_TRG|EST_TRG|ROL_TRG|EST_ESTU_TRG';
    const payloadTiposDocumento = 'limit=0&query=DominioTipoDocumento__CodigoAbreviacion:DOC_PLX';

    const parametros = firstValueFrom(this.parametrosCrud.get('parametro', payloadParametros));
    const tiposDocumento = firstValueFrom(this.documentosCrud.get('tipo_documento', payloadTiposDocumento));

    await Promise.all([parametros, tiposDocumento])
      .then(([parametros, tiposDocumento]) => {
        this.parametros = parametros;
        this.tiposDocumento = tiposDocumento;
      })
      .catch(() => {
        this.mensaje = 'Ocurrió un error cargando los trabajos de grado. Por favor intente de nuevo.';
      });

    this.cargarTrabajos();
  }

  private cargarTrabajos() {
    const payloadVinculaciones = `limit=0&query=Activo:true,Usuario:${this.documento}`;
    this.poluxCrud.get('vinculacion_trabajo_grado', payloadVinculaciones)
      .subscribe({
        next: (respuestaVinculaciones: VinculacionTrabajoGrado[]) => {
          respuestaVinculaciones.forEach((trabajoGrado: any) => {
            trabajoGrado.RolTrabajoGrado = this.parametrosCrud.findParametro(trabajoGrado.RolTrabajoGrado, this.parametros)
            trabajoGrado.EstadoTrabajoGrado = this.parametrosCrud.findParametro(trabajoGrado.TrabajoGrado.EstadoTrabajoGrado, this.parametros)
            trabajoGrado.Modalidad = this.parametrosCrud.findParametro(trabajoGrado.TrabajoGrado.Modalidad, this.parametros)
          });
          this.trabajosGrado = respuestaVinculaciones;
        }, error: () => {
          this.mensaje = 'Ocurrió un error cargando los trabajos de grado. Por favor intente de nuevo.';
        },
      });
  }

  private async cargarTrabajo(fila: any) {
    this.cargando = true;
    Promise.all([
      this.consultarDocTrabajoGrado(fila),
      this.getEstudiantes(fila,),
      this.getEvaluacionesRegistradas(fila),
    ])
      .catch((err) => this.mensaje = err)
      .finally(() => this.cargando = false);
  }

  private initForm() {
    this.notaForm = new FormGroup(
      {
        nota: this.notaControl,
        acta: this.actaControl,
        correcciones: this.correccionesControl,
      });
  }

  private consultarDocTrabajoGrado(vinculacionTrabajoGrado: VinculacionTrabajoGrado): Promise<void> {
    const tipoDocumento = this.tiposDocumento.find(tipo => tipo.CodigoAbreviacion === 'DTR_PLX');
    return new Promise((resolve, reject) => {
      if (!tipoDocumento) {
        reject('No se pudo consultar el detalle del trabajo de grado. Por favor intente de nuevo.')
        return;
      }

      const payloadDocumento = `limit=1&query=DocumentoEscrito.TipoDocumentoEscrito:${tipoDocumento.Id}` +
        `,TrabajoGrado__Id:${vinculacionTrabajoGrado.TrabajoGrado.Id}`;
      this.poluxCrud.get('documento_trabajo_grado', payloadDocumento)
        .subscribe({
          next: (respuestaDocumentoTrabajoGrado: DocumentoTrabajoGrado[]) => {
            if (respuestaDocumentoTrabajoGrado.length) {
              this.docTrabajoGrado = respuestaDocumentoTrabajoGrado[0];
              resolve();
            } else {
              reject('No se encontró el documento asociado al trabajo de grado.');
            }
          }, error: () => {
            reject('Ocurrió un error consultando el documento del trabajo de grado.');
          },
        });
    });
  }

  private getEstudiantes(trabajoGrado: VinculacionTrabajoGrado): Promise<void> {
    return new Promise((resolve, reject) => {
      const estadoEstudiante = this.parametros.find(parametro => parametro.CodigoAbreviacion === 'EST_ACT_PLX');
      if (!estadoEstudiante) {
        reject('No se pudieron consultar los estudiantes asociados al trabajo de grado, por favor intente de nuevo');
        return;
      }

      const payloadEstudiantes = `limit=0&query=EstadoEstudianteTrabajoGrado:${estadoEstudiante.Id},` +
        `TrabajoGrado.Id:${trabajoGrado.TrabajoGrado.Id}`;
      this.poluxCrud.get('estudiante_trabajo_grado', payloadEstudiantes)
        .subscribe({
          next: (responseEstudiantes: EstudianteTrabajoGrado[]) => {
            if (responseEstudiantes.length > 0) {
              this.trabajoSeleccionado.estudiantes = responseEstudiantes;
              const promesasEstudiantes: Promise<void>[] = [];
              responseEstudiantes.forEach((estudiante) => {
                promesasEstudiantes.push(this.getEstudiante(estudiante));
              });

              Promise.all(promesasEstudiantes)
                .then(() => resolve())
                .catch((err) => reject(err));
            } else {
              reject('No se encontraron estudiantes asociados al trabajo de grado.');
            }
          }, error: () => {
            reject('Ocurrió un error consultando los estudiantes del trabajo de grado. Intente de nuevo.');
          },
        });
    });
  }

  private getEstudiante(estudiante: any): Promise<void> {
    return new Promise((resolve, reject) => {
      this.academica.get('datos_basicos_estudiante', estudiante.Estudiante)
        .subscribe({
          next: (responseDatosBasicos: responseDatosEstudiante) => {
            if (responseDatosBasicos.datosEstudianteCollection.datosBasicosEstudiante) {
              this.estudiantes.push(responseDatosBasicos.datosEstudianteCollection.datosBasicosEstudiante[0]);
              resolve();
            } else {
              reject('Ocurrió un error consultando la información de los estudiantes del trabajo de grado. Intente de nuevo.');
            }
          }, error: () => {
            reject('Ocurrió un error consultando la información de los estudiantes del trabajo de grado. Intente de nuevo.');
          }
        });
    });
  }

  private getEvaluacionesRegistradas(vinculacion: VinculacionTrabajoGrado): Promise<void> {
    const payloadEvaluacion = `limit=1&query=VinculacionTrabajoGrado:${vinculacion.Id}`;
    return new Promise((resolve, reject) => {
      this.poluxCrud.get('evaluacion_trabajo_grado', payloadEvaluacion)
        .subscribe({
          next: (responseEvaluacion: EvaluacionTrabajoGrado[]) => {
            if (responseEvaluacion.length > 0) {
              this.trabajoSeleccionado.evaluacion = responseEvaluacion[0];
            }
            resolve();
          }, error: () => {
            reject('Ocurrió un error consultando el trabajo de grado. Por favor intente de nuevo.');
          }
        });
    });
  }

  public registrarRespuesta() {
    if (!this.notaForm?.valid) {
      return;
    }

    if (this.devolver) {
      const transaccionRechazo: TrRegistrarRevisionTg = {
        Comentarios: <Comentario[]>[{
          Comentario: this.notaForm?.value.correcciones,
        }],
        RevisionTrabajoGrado: <RevisionTrabajoGrado>{
          DocumentoTrabajoGrado: this.docTrabajoGrado,
          VinculacionTrabajoGrado: <VinculacionTrabajoGrado>{ Id: this.trabajoSeleccionado.Id },
        },
      };

      this.poluxCrud.post('tr_registrar_revision_tg', transaccionRechazo)
        .subscribe({
          next: (responseCorreccion) => {
            if (responseCorreccion[0] === 'Success') {
              const text = 'Las calificaciones ingresadas han sido registradas con éxito.';
              const title = 'Registro de calificaciones';
              this.alert.success(text, title);
            } else {
              // alerta error(responseCorreccion[1]);
              this.alert.error('Ocurrió un error registrando la corrección, por favor intente de nuevo.')
            }
          }, error: () => {
            this.alert.error('Ocurrió un error registrando la corrección, por favor intente de nuevo.')
          },
        });
    } else if (this.registrarNota) {
      if (this.trabajoSeleccionado.RolTrabajoGrado.CodigoAbreviacion === 'DIRECTOR_PLX') {
        this.subirActa();
      } else {
        this.postNota(null);
      }
    }
  }

  private postNota(documento: DocumentoEscrito | null) {
    const trRegistrarNota = {
      TrabajoGrado: this.trabajoSeleccionado.TrabajoGrado,
      DocumentoEscrito: documento,
      VinculacionTrabajoGrado: { Id: this.trabajoSeleccionado.Id },
      EvaluacionTrabajoGrado: {
        Id: 0,
        Nota: this.notaForm?.value.nota,
        VinculacionTrabajoGrado: { Id: this.trabajoSeleccionado.Id },
      },
    };

    this.poluxCrud.post('tr_vinculado_registrar_nota', trRegistrarNota)
      .subscribe({
        next: (responseNota) => {
          if (responseNota[0] === 'Success') {
            const text = 'Las calificaciones ingresadas han sido registradas con éxito.';
            const title = 'Registro de calificaciones';
            this.alert.success(text, title);
          } else {
            // alerta error(responseNota[1]);
            this.alert.error('Ocurrió un error al registrar las calificaciones, por favor intente de nuevo.')
          }
        }, error: () => {
          this.alert.error('Ocurrió un error al registrar las calificaciones, por favor intente de nuevo.')
        },
      });
  }

  private subirActa() {
    const tipoDocumento = this.tiposDocumento.find(tipoDoc => tipoDoc.CodigoAbreviacion === 'ACT_PLX');
    if (!tipoDocumento) {
      // alerta
      return;
    }

    const nombre = `Acta de sustentación de trabajo id:  ${this.trabajoSeleccionado.TrabajoGrado.Id}`;
    const descripcion = `Acta de sustentación de el trabajo con id:${this.trabajoSeleccionado.TrabajoGrado.Id}, ` +
      `titulado:${this.trabajoSeleccionado.TrabajoGrado.Titulo}.`;
    const acta = [{
      IdTipoDocumento: tipoDocumento.Id,
      nombre,
      Observaciones: 'Acta de sustentación',
      descripcion: descripcion,
      file: this.notaForm?.value.acta,
    }];
    this.gestorDocumental.uploadFiles(acta)
      .subscribe({
        next: (response) => {
          if (response && Array.isArray(response) && response.length > 0 && response[0].res) {
            const documento = <DocumentoEscrito>{
              Id: 0,
              Titulo: nombre,
              Resumen: descripcion,
              Enlace: response[0].res.Enlace,
              TipoDocumentoEscrito: tipoDocumento.Id,
            };
            this.postNota(documento);
          }
        }, error: () => {
          this.alert.error('Ocurrió un error subiendo el acta de sustentación. Intente de nuevo.');
        }
      });
  }

  public onVolver() {
    this.notaForm = undefined;
    this.trabajoSeleccionado = undefined;
    this.estudiantes = [];
    this.registrarNota = false;
    this.devolver = false;
    this.mensaje = '';
  }

  onVer(event: DeleteEvent) {
    this.registrarNota = false;
    this.devolver = false;
    this.cargarTrabajo(event.data);
    this.trabajoSeleccionado = event.data;
  }

  onRegistrar(event: EditEvent) {
    this.devolver = false;
    this.trabajoSeleccionado = event.data;

    if (event.data.EstadoTrabajoGrado.CodigoAbreviacion !== 'EC_PLX') {
      this.registrarNota = true;
      this.cargarTrabajo(event.data);
      this.initForm();
    } else {
      // Varifica si pesar de haber solicitado correcciones, puede registrar la nota
      const payloadCheckCorreccion = `limit=0&query=VinculacionTrabajoGrado__Id:${event.data.Id}`;
      this.poluxCrud.get('revision_trabajo_grado', payloadCheckCorreccion)
        .subscribe({
          next: (responseRevisiones: RevisionTrabajoGrado[]) => {
            if (responseRevisiones.length > 0) {
              this.registrarNota = true;
              this.cargarTrabajo(event.data);
              this.initForm();
            } else {
              this.alert.error('El estado del trabajo de grado no permite registrar la nota.');
              this.registrarNota = false;
            }
          }, error: () => {
            this.mensaje = 'No se pudo cargar la información del trabajo de grado. Intente de nuevo.';
          }
        });
    }

  }

  public onDevolver(event: CustomActionEvent) {
    this.registrarNota = false;
    this.devolver = true;
    this.cargarTrabajo(event.data);
    this.trabajoSeleccionado = event.data;
    this.initForm();
  }

  public getDocumento() {
    firstValueFrom(this.gestorDocumental.getByEnlace(this.docTrabajoGrado.DocumentoEscrito.Enlace))
      .then((f: any) => this.gestorDocumental.getUrlFile(f.file, f['file:content']['mime-type']))
      .then((url) => window.open(url))
      .catch(() => {
        this.alert.error('Ocurrió un error al cargar el documento del trabajo de grado, intente de nuevo.');
      })
  }

  get getSettings(): Settings {
    return {
      actions: {
        columnTitle: 'Acciones',
        position: 'right',
        add: false,
        edit: true,
        delete: true,
        custom: this.devolverButton
      },
      mode: 'external',
      edit: this.notaButton,
      delete: this.verButton,
      noDataMessage: 'No tiene trabajos para consultar',
      columns: {
        TrabajoGrado: {
          title: 'Título',
          ...this.smartTable.getSettingsObject('Titulo'),
        },
        RolTrabajoGrado: {
          title: 'Tipo de Vinculación',
          ...this.smartTable.getSettingsObject('Nombre'),
        },
        EstadoTrabajoGrado: {
          title: 'Estado Trabajo Grado',
          ...this.smartTable.getSettingsObject('Nombre'),
        },
        Modalidad: {
          title: 'Modalidad',
          ...this.smartTable.getSettingsObject('Nombre'),
        },
      },
    }
  }

  get notaButton(): EditAction {
    return {
      editButtonContent: `<i class="fa-solid fa-check-to-slot smart-table-icon" title="Registrar Nota"></i>`,
      disabledWhen(row) {
        const value = row.getData();
        const rol = value.RolTrabajoGrado.CodigoAbreviacion;
        const estado = value.EstadoTrabajoGrado.CodigoAbreviacion;
        return !(rol.includes('CODIRECTOR_PLX') ||
          (rol === 'EVALUADOR_PLX' && (estado === 'RDE_PLX' || estado === 'EC_PLX')) ||
          (rol.includes('DIRECTOR_PLX') && (estado === 'STN_PLX' || estado === 'LPS_PLX')));
      },
    };
  }

  get verButton(): DeleteAction {
    return {
      deleteButtonContent: `<i class="fa-solid fa-eye smart-table-icon" title="Ver Trabajo"></i>`,
    };
  }

  get devolverButton(): CustomAction[] {
    return [
      {
        name: 'Devolver',
        title: 'Devolver',
        customButtonContent: `<i class="fa-solid fa-ban smart-table-icon" title="Devolver"></i>`,
        disabledWhen(row) {
          const value = row.getData();
          const rol = value.RolTrabajoGrado.CodigoAbreviacion;
          const estado = value.EstadoTrabajoGrado.CodigoAbreviacion;
          return !(rol === 'EVALUADOR_PLX' && estado === 'RDE_PLX');
        },
      },
    ];
  }

  get notaControl(): FormControl {
    const validators = this.registrarNota && !this.devolver ? [Validators.pattern(/^\d+(?:\.\d{1,2})?$/)] : [];
    return new FormControl(
      {
        value: 0.00,
        disabled: !validators.length,
      },
      { validators },
    );
  }

  get actaControl(): FormControl {
    const validators = this.registrarNota && !this.devolver &&
      this.trabajoSeleccionado.RolTrabajoGrado.CodigoAbreviacion === 'DIRECTOR_PLX' ? [Validators.required] : [];
    return new FormControl(
      {
        value: '',
        disabled: !validators.length,
      },
      { validators },
    );
  }

  get correccionesControl(): FormControl {
    const validators = !this.registrarNota && this.devolver ? [Validators.required] : [];
    return new FormControl(
      {
        value: '',
        disabled: !validators.length,
      },
      { validators },
    );
  }

}
