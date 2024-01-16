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
import { TrabajoGrado } from 'src/app/shared/models/trabajoGrado.model';
import { EstudianteTrabajoGrado } from 'src/app/shared/models/estudianteTrabajoGrado.model';
import { AcademicaService } from '../../services/academicaService';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { GestorDocumentalService } from '../../services/gestorDocumentalService';

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
  docTrabajoGrado: DocumentoTrabajoGrado = new DocumentoTrabajoGrado();
  notaForm: FormGroup | undefined;

  registrarNota = false;
  devolver = false;

  constructor(
    private userService: UserService,
    private poluxCrud: PoluxCrudService,
    private parametrosCrud: ParametrosService,
    private documentosCrud: DocumentoCrudService,
    private academica: AcademicaService,
    private smartTable: SmartTableService,
    private gestorDocumental: GestorDocumentalService,
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

    const consultas = await Promise.all([parametros, tiposDocumento]);
    this.parametros = consultas[0];
    this.tiposDocumento = consultas[1];
    this.cargarTrabajos();
  }

  private cargarTrabajos() {
    const payloadVinculaciones = `limit=0&query=Activo:true,Usuario:${this.documento}`;
    this.poluxCrud.get('vinculacion_trabajo_grado', payloadVinculaciones)
      .subscribe((respuestaVinculaciones: VinculacionTrabajoGrado[]) => {
        respuestaVinculaciones.forEach((trabajoGrado: any) => {
          trabajoGrado.RolTrabajoGrado = this.parametrosCrud.findParametro(trabajoGrado.RolTrabajoGrado, this.parametros)
          trabajoGrado.EstadoTrabajoGrado = this.parametrosCrud.findParametro(trabajoGrado.TrabajoGrado.EstadoTrabajoGrado, this.parametros)
          trabajoGrado.Modalidad = this.parametrosCrud.findParametro(trabajoGrado.TrabajoGrado.Modalidad, this.parametros)
        });
        this.trabajosGrado = respuestaVinculaciones;
      });
    // .catch(error)=> {
    // }
  }

  private async cargarTrabajo(fila: any) {
    this.consultarDocTrabajoGrado(fila);

    // Promesas del tg
    const promesasTrabajo = [];
    promesasTrabajo.push(this.getEstudiantes(fila.TrabajoGrado));
    promesasTrabajo.push(this.getEvaluacionesRegistradas(fila));
    await promesasTrabajo;

  }

  private initForm() {
    this.notaForm = new FormGroup(
      {
        nota: this.notaControl,
        acta: this.actaControl,
        correcciones: this.correccionesControl,
      });
  }

  private consultarDocTrabajoGrado(vinculacionTrabajoGrado: VinculacionTrabajoGrado) {
    const tipoDocumento = this.tiposDocumento.find(tipo => tipo.CodigoAbreviacion === 'DTR_PLX');
    if (!tipoDocumento) {
      // alerta error
      return;
    }

    const payloadDocumento = `limit=1&query=DocumentoEscrito.TipoDocumentoEscrito:${tipoDocumento.Id},TrabajoGrado__Id:${vinculacionTrabajoGrado.TrabajoGrado.Id}`;
    this.poluxCrud.get('documento_trabajo_grado', payloadDocumento)
      .subscribe((respuestaDocumentoTrabajoGrado: DocumentoTrabajoGrado[]) => {
        if (respuestaDocumentoTrabajoGrado.length) {
          this.docTrabajoGrado = respuestaDocumentoTrabajoGrado[0];
        } else {
          // alerta sin documento
        }
      })
    // .catch((error) => {
    // });
    return;
  }

  private getEstudiantes(trabajoGrado: TrabajoGrado) {
    const estadoEstudiante = this.parametros.find(parametro => parametro.CodigoAbreviacion === 'EST_ACT_PLX');
    if (!estadoEstudiante) {
      // alerta error
      return;
    }

    const payloadEstudiantes = `limit=0&query=EstadoEstudianteTrabajoGrado:${estadoEstudiante.Id},TrabajoGrado.Id:${trabajoGrado.Id}`;
    this.poluxCrud.get('estudiante_trabajo_grado', payloadEstudiantes)
      .subscribe((responseEstudiantes: EstudianteTrabajoGrado[]) => {
        if (responseEstudiantes.length > 0) {
          this.trabajoSeleccionado.estudiantes = responseEstudiantes;
          const promesasEstudiante = [];
          responseEstudiantes.forEach((estudiante) => {
            promesasEstudiante.push(this.getEstudiante(estudiante));
          });

          // await promesasEstudiante
        } else {
          // defer.reject("Sin estudiantes");
        }
      })
    // .catch( (error)=> {
    // });
    return;
  }

  private getEstudiante(estudiante: any) {
    this.academica.get('datos_basicos_estudiante', estudiante.Estudiante)
      .subscribe((responseDatosBasicos) => {
        if (responseDatosBasicos.datosEstudianteCollection.datosBasicosEstudiante) {
          estudiante.datos = responseDatosBasicos.datosEstudianteCollection.datosBasicosEstudiante[0];
        } else {
        }
      })
    // .catch((error) => {
    // });
    return;
  }

  private getEvaluacionesRegistradas(vinculacion: VinculacionTrabajoGrado) {
    // Se consultan las evaluaciones
    const payloadEvaluacion = `limit=1&query=VinculacionTrabajoGrado:${vinculacion.Id}`;
    this.poluxCrud.get('evaluacion_trabajo_grado', payloadEvaluacion)
      .subscribe((responseEvaluacion) => {
        if (responseEvaluacion.length > 0) {
          this.trabajoSeleccionado.evaluacion = responseEvaluacion.data[0];
        }
      })
    // .catch((error) => {
    // });
    return;
  }

  public registrarRespuesta() {
    // Envía transacción para rechazar
    if (!this.notaForm?.valid) {
      return;
    }

    if (this.devolver) {
      const transaccionRechazo = {
        Comentarios: [
          {
            Comentario: this.notaForm?.value.correcciones,
          }
        ],
        RevisionTrabajoGrado: {
          DocumentoTrabajoGrado: this.docTrabajoGrado,
          VinculacionTrabajoGrado: this.trabajoSeleccionado.Id,
        },
      };

      this.poluxCrud.post('tr_registrar_revision_tg', transaccionRechazo)
        .subscribe((response) => {
          if (response.data[0] === 'Success') {
            // notificar
          } else {
            // alerta error();
          }
        })
      // .catch(function (error) {
      // });
    } else if (this.registrarNota) {
      if (this.trabajoSeleccionado.RolTrabajoGrado.CodigoAbreviacion === 'DIRECTOR_PLX') {
        this.subirActa();
      } else {
        this.postNota();
      }
    }
  }

  private postNota() {
    const trRegistrarNota = {
      TrabajoGrado: this.trabajoSeleccionado.TrabajoGrado,
      DocumentoEscrito: null,
      VinculacionTrabajoGrado: { Id: this.trabajoSeleccionado.Id },
      EvaluacionTrabajoGrado: {
        Id: 0,
        Nota: this.notaForm?.value.nota,
        VinculacionTrabajoGrado: { Id: this.trabajoSeleccionado.Id },
      },
    };

    this.poluxCrud.post('tr_vinculado_registrar_nota', trRegistrarNota)
      .subscribe((responseNota) => {
        if (responseNota.data[0] === 'Success') {
          // notificar
        } else {
          // alerta error();
        }
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
    this.gestorDocumental.fileToBase64(this.notaForm?.value.acta)
      .then((base64) => {
        const data = [{
          IdTipoDocumento: tipoDocumento.Id,
          nombre,
          metadatos: {
            NombreArchivo: nombre,
            Tipo: 'Archivo',
            Observaciones: 'Acta de sustentación',
          },
          descripcion: descripcion,
          file: base64,
        }];

        this.gestorDocumental.uploadFiles(data)
          .subscribe((response) => {
            this.postNota();
          });
        // .catch((error) => {
        // });
      });
  }

  public onVolver() {
    this.notaForm = undefined;
    this.trabajoSeleccionado = undefined;
    this.registrarNota = false;
    this.devolver = false;
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

    // Se verifica si se tiene que pedir acta segun el tipo de vinculación, solo se pide si es el director
    // pedirActaSustentacion = (event.data.RolTrabajoGrado.CodigoAbreviacion === 'DIRECTOR_PLX');

    if (event.data.EstadoTrabajoGrado.CodigoAbreviacion !== 'EC_PLX') {
      this.registrarNota = true;
      this.cargarTrabajo(event.data);
      this.initForm();
    } else {
      // Varifica si pesar de haber solicitado correcciones, puede registrar la nota
      const payloadCheckCorreccion = `limit=0&query=VinculacionTrabajoGrado__Id:${event.data.Id}`;
      this.poluxCrud.get('revision_trabajo_grado', payloadCheckCorreccion)
        .subscribe((responseRevisiones: RevisionTrabajoGrado[]) => {
          if (responseRevisiones.length > 0) {
            this.registrarNota = true;
            this.cargarTrabajo(event.data);
            this.initForm();
          } else {
            this.registrarNota = false;
            // Alerta no se puede registrar
          }
        })
      // .catch((error) => {
      // });
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
    // gestorDocumentalMidRequest.get('/document/' + ctrl.docTrabajoGrado.DocumentoEscrito.Enlace).then(function (response) {
    //     var file = new Blob([utils.base64ToArrayBuffer(response.data.file)], {type: 'application/pdf'});
    //     var fileURL = URL.createObjectURL(file);
    //     $window.open(fileURL, 'resizable=yes,status=no,location=no,toolbar=no,menubar=no,fullscreen=yes,scrollbars=yes,dependent=no,width=700,height=900');
    //    })
    //   .catch(function(error) {
    //     swal(
    //       $translate.instant("MENSAJE_ERROR"),
    //       $translate.instant("ERROR.CARGAR_DOCUMENTO"),
    //       'warning'
    //     );
    //   });
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
      hiddenWhen(row) {
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
        hiddenWhen(row) {
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
