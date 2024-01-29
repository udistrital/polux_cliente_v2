import { Component, OnInit } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ParametrosService } from '../../services/parametrosService';
import { DocumentoCrudService } from '../../services/documentoCrudService';
import { Parametro } from 'src/app/shared/models/parametro.model';
import { TipoDocumento } from 'src/app/shared/models/tipoDocumento.model';
import { UserService } from '../../services/userService';
import { PoluxCrudService } from '../../services/poluxCrudService';
import { EstudianteTrabajoGrado, EstudianteTrabajoGradoDetalle } from 'src/app/shared/models/estudianteTrabajoGrado.model';
import { TrabajoGradoDetalle } from 'src/app/shared/models/trabajoGrado.model';
import { AcademicaService } from '../../services/academicaService';
import { DocumentoTrabajoGrado } from 'src/app/shared/models/documentoTrabajoGrado.model';
import { VinculacionTrabajoGradoDetalle } from 'src/app/shared/models/vinculacionTrabajoGrado.model';
import { DetallePasantia } from 'src/app/shared/models/detallePasantia.model';
import { EspacioAcademicoInscritoDetalle } from 'src/app/shared/models/espacioAcademicoInscrito.model';
import { AsignaturaTrabajoGradoDetalle } from 'src/app/shared/models/asignaturaTrabajoGrado.model';
import { Settings } from 'angular2-smart-table';
import { SmartTableService } from '../../services/smartTableService';
import { responseCarrera, responseDatosEstudiante, responseDocente } from 'src/app/shared/models/academica/periodo.model';
import { EvaluacionTrabajoGrado } from 'src/app/shared/models/evaluacionTrabajoGrado.model';
import { AreasTrabajoGrado } from 'src/app/shared/models/areasTrabajoGrado.model';

class DetalleEstudiante extends EstudianteTrabajoGrado {
  datosBasicos: any;
  proyecto: any;
}

@Component({
  selector: 'app-consulta-trabajo-grado',
  templateUrl: './consulta-trabajo-grado.component.html',
  styleUrls: ['./consulta-trabajo-grado.component.scss']
})
export class ConsultaTrabajoGradoComponent implements OnInit {
  parametros: Parametro[] = [];
  tiposDocumento: TipoDocumento[] = [];

  codigo = '';
  trabajoGrado: TrabajoGradoDetalle = new TrabajoGradoDetalle;
  estudiantes: DetalleEstudiante[] = [];
  asignaturas: AsignaturaTrabajoGradoDetalle[] = [];
  vinculados: VinculacionTrabajoGradoDetalle[] = [];
  certificadoARL: DocumentoTrabajoGrado | undefined;
  actaSocializacion: DocumentoTrabajoGrado | undefined;
  actas: DocumentoTrabajoGrado[] = [];
  areasConocimiento: Parametro[] = [];
  espacios: EspacioAcademicoInscritoDetalle[] = [];
  detallePasantia: DetallePasantia = new DetallePasantia;
  settingsAsignaturas: Settings;
  settingsEspacios: Settings;
  settingsVinculaciones: Settings;

  esAnteproyectoModificable = false;
  esPrimeraVersion = false
  esProyectoModificable = false;
  pasantiaEnEsperaArl = false;

  mensaje = '';
  cargando = false;
  showForm = false;

  constructor(
    private userService: UserService,
    private poluxCrud: PoluxCrudService,
    private parametrosCrud: ParametrosService,
    private documentosCrud: DocumentoCrudService,
    private academica: AcademicaService,
    private smartTable: SmartTableService,
  ) {
    this.settingsAsignaturas = this.getSettings;
    this.settingsEspacios = this.getSettingsEspacios;
    this.settingsVinculaciones = this.getSettingsVinculaciones;
  }

  ngOnInit(): void {
    this.getParametros();
  }

  private async getParametros() {
    const tipoParametros = 'MOD_TRG|EST_TRG|ROL_TRG|EST_ESTU_TRG|EST_ASIG_TRG|AC';
    const payloadTiposDocumento = 'limit=0&query=DominioTipoDocumento__CodigoAbreviacion:DOC_PLX';

    const parametros = firstValueFrom(this.parametrosCrud.getAllParametroByTipo(tipoParametros));
    const tiposDocumento = firstValueFrom(this.documentosCrud.get('tipo_documento', payloadTiposDocumento));

    const consultas = await Promise.all([parametros, tiposDocumento]);
    this.parametros = consultas[0];
    this.tiposDocumento = consultas[1];

    if (!!this.userService.findAction('verTodosTrabajos')) {
      this.showForm = true;
    } else if (!!this.userService.findAction('verTrabajoPropio')) {
      this.codigo = this.userService.getCodigo();
      this.cargarTrabajo();
    }
  }

  public verificarEstudiante() {
    if (this.codigo.length !== 11) {
      return;
    }

    this.academica.get('datos_basicos_estudiante', this.codigo)
      .subscribe({
        next: (responseDatosBasicos: responseDatosEstudiante) => {
          if (responseDatosBasicos.datosEstudianteCollection?.datosBasicosEstudiante) {
            this.cargarTrabajo();
          } else {
            this.mensaje = 'No se encontraron datos asociados al código ingresado.';
          }
        }, error: () => {
          this.mensaje = 'No se pudieron consultar los datos básicos del estudiante.';
        }
      });
  }

  private cargarTrabajo() {
    // Consultar trabajo de grado del estudiante
    this.mensaje = '';
    this.cargando = true;
    const estadoEstudiante = this.parametros.find(p => p.CodigoAbreviacion === 'EST_ACT_PLX');
    if (!estadoEstudiante) {
      this.mensaje = 'No se pudo consultar el trabajo de grado del estudiante';
      this.cargando = false;
      return;
    }

    const payloadTrabajoGrado = `query=EstadoEstudianteTrabajoGrado:${estadoEstudiante.Id},Estudiante:${this.codigo}&limit=1`;
    this.poluxCrud.get('estudiante_trabajo_grado', payloadTrabajoGrado)
      .subscribe({
        next: async (responseTrabajoGrado: EstudianteTrabajoGradoDetalle[]) => {
          if (responseTrabajoGrado.length > 0) {
            this.trabajoGrado = responseTrabajoGrado[0].TrabajoGrado;
            const estado = this.parametrosCrud.findParametro(responseTrabajoGrado[0].TrabajoGrado.EstadoTrabajoGrado, this.parametros);
            const modalidad = this.parametrosCrud.findParametro(responseTrabajoGrado[0].TrabajoGrado.Modalidad, this.parametros);

            if (!!this.userService.findAction('verTrabajoPropio')) { // ctrl.userRole.includes('ESTUDIANTE')
              this.esAnteproyectoModificable = ['AMO_PLX', 'ASMO_PLX'].includes(estado.CodigoAbreviacion);

              // Si el anteproyecto es viable se puede subir la primera versión del proyecto
              this.esPrimeraVersion = ['AVI_PLX', 'ASVI_PLX'].includes(estado.CodigoAbreviacion);

              // Si el proyecto es modificable
              this.esProyectoModificable = ['MOD_PLX'].includes(estado.CodigoAbreviacion);

              // Si es pasantia y esta en espera de ARL
              this.pasantiaEnEsperaArl = ['PAEA_PLX'].includes(estado.CodigoAbreviacion);
            }

            this.trabajoGrado.EstadoTrabajoGrado = estado;
            this.trabajoGrado.Modalidad = modalidad;

            const promises = [
              this.cargarActaSocializacion(),
              this.cargarCertificadoARL(this.trabajoGrado.Id),
              this.getEstudiantesTg(this.trabajoGrado.Id),
              this.cargarAsignaturasTrabajoGrado(this.trabajoGrado.Id),
            ];

            if (!['EAPOS_PLX', 'EAPRO_PLX'].includes(modalidad.CodigoAbreviacion)) {
              promises.push(this.getVinculaciones());
              promises.push(this.cargarAreasConocimiento());
            }

            // Si la modalidad es 2 trae los espacios academicos
            if (['EAPOS_PLX', 'EAPRO_PLX'].includes(modalidad.CodigoAbreviacion)) {
              promises.push(this.getEspaciosAcademicosInscritos());
            }

            // Si la modalidad es Pasantía se consultan las actas de seguimiento y el detalle de la pasantia
            if (['PASEX_PLX', 'PASIN_PLX'].includes(modalidad.CodigoAbreviacion)) {
              promises.push(this.getActas());
              promises.push(this.getDetallePasantia());
            }

            await Promise.all(promises)
              .catch((error) => {
                this.mensaje = error;
                this.cargando = false;
              });

            if (this.asignaturas.some((asignatura) => asignatura.Aprobacion === undefined)) {
              // COMPRUEBA SI EL USUARIO APROBÓ O NO
              this.academica.get('periodo_academico', 'P')
                .subscribe({
                  next: (Periodo) => {
                    const P = Periodo.periodoAcademicoCollection.periodoAcademico[0];
                    // CONSULTA LOS DATOS DEL ESTUDIANTE
                    this.academica.get('datos_estudiante', [this.codigo, P.anio, P.periodo].join('/'))
                      .subscribe({
                        next: (respuestaDatos) => {
                          const nivelEstudios = respuestaDatos.estudianteCollection.datosEstudiante[0].nivel
                          const notaMinima = nivelEstudios === 'PREGRADO' ? 3 : nivelEstudios === 'POSGRADO' ? 3.5 : 0;
                          this.cargando = false;
                          this.asignaturas.forEach(asignatura => {
                            asignatura.Aprobacion = asignatura.Calificacion > notaMinima ? 'Aprobado' : 'Reprobado';
                          });
                        }, error: () => {
                          this.mensaje = 'No se pudo cargar el trabajo de grado';
                          this.cargando = false;
                        }
                      });
                  }, error: () => {
                    this.mensaje = 'No se pudo cargar el trabajo de grado';
                    this.cargando = false;
                  }
                });
            } else {
              this.cargando = false;
            }
          } else {
            this.mensaje = 'El estudiante no tiene un trabajo de grado en curso.';
            this.cargando = false;
          }
        }, error: () => {
          this.mensaje = 'No se pudo consultar el trabajo de grado del estudiante.';
        }
      });
  }

  private getEstudiantesTg(trabajoGradoId: number): Promise<void> {
    return new Promise((resolve, reject) => {
      // Se buscan los estuidiantes activos
      const estadoEstudiante = this.parametros.find(p => p.CodigoAbreviacion === 'EST_ACT_PLX');
      if (!estadoEstudiante) {
        reject('No se pudieron consultar los estudiantes del trabajo de grado.');
        return;
      }

      const payloadEstudiantes = `query=EstadoEstudianteTrabajoGrado:${estadoEstudiante?.Id},TrabajoGrado:${trabajoGradoId}&limit=0`;
      this.poluxCrud.get('estudiante_trabajo_grado', payloadEstudiantes)
        .subscribe({
          next: async (responseEstudiantes: DetalleEstudiante[]) => {
            this.estudiantes = responseEstudiantes;

            const promesasEstudiantes: Promise<void>[] = [];
            responseEstudiantes.forEach((estudiante) => {
              // this.cargarEstudiante(estudiante)
              promesasEstudiantes.push(this.cargarEstudiante(estudiante));
            });

            await Promise.all(promesasEstudiantes)
              .then(() => resolve())
              .catch((error) => reject(error));
          }, error: () => {
            reject('No se pudieron consultar los estudiantes del trabajo de grado.');
          }
        });
    })
  }

  private cargarEstudiante(estudiante: DetalleEstudiante): Promise<void> {
    return new Promise((resolve, reject) => {
      // Consultar datos básicos del estudiante
      this.academica.get('datos_basicos_estudiante', estudiante.Estudiante)
        .subscribe({
          next: (responseDatosBasicos: responseDatosEstudiante) => {
            if (responseDatosBasicos.datosEstudianteCollection?.datosBasicosEstudiante) {
              estudiante.datosBasicos = responseDatosBasicos.datosEstudianteCollection.datosBasicosEstudiante[0];

              // Consultar nombre carrera
              this.academica.get('carrera', estudiante.datosBasicos.carrera)
                .subscribe({
                  next: (responseCarrera: responseCarrera) => {
                    if (responseCarrera.carrerasCollection?.carrera) {
                      estudiante.proyecto = responseCarrera.carrerasCollection?.carrera[0].codigo + ' - ' + responseCarrera.carrerasCollection.carrera[0].nombre;
                      resolve();
                    } else {
                      reject('No se pudo consultar el proyecto curricular del estudiante');
                    }
                  }, error: () => {
                    reject('No se pudo consultar el proyecto curricular del estudiante');
                  }
                });
            } else {
              reject('No se pudieron consultar los datos básicos del estudiante.');
            }
          }, error: () => {
            reject('No se pudieron consultar los datos básicos del estudiante.');
          }
        });
    });
  }

  private cargarAsignaturasTrabajoGrado(trabajoGradoId: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const payloadAsignaturas = `query=TrabajoGrado:${trabajoGradoId}&limit=2`;
      this.poluxCrud.get('asignatura_trabajo_grado', payloadAsignaturas)
        .subscribe({
          next: (responseAsignaturas: AsignaturaTrabajoGradoDetalle[]) => {
            this.asignaturas = responseAsignaturas;
            this.asignaturas.map((rev) => this.parametrosCrud.fillPropiedad(rev, 'EstadoAsignaturaTrabajoGrado', this.parametros));
            if (responseAsignaturas.length) {
              resolve();
            } else {
              reject('No hay asignaturas de trabajo de grado asociadas a la consulta')
            }
          }, error: () => {
            reject('No se pudieron consultar las asignaturas del trabajo de grado')
          }
        });
    });
  }

  private cargarCertificadoARL(trabajoGradoId: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const tipoDocumento = this.tiposDocumento.find(p => p.CodigoAbreviacion === 'DPAS_PLX');
      if (!tipoDocumento) {
        reject('No se pudieron consultar los documentos asociados al trabajo de grado.');
        return;
      }

      // Se consulta el tipo de documento 6 que es acta de socialización
      const payloadActaSocializacion = `query=DocumentoEscrito.TipoDocumentoEscrito:${tipoDocumento.Id},TrabajoGrado:${trabajoGradoId}&limit=1`;
      this.poluxCrud.get('documento_trabajo_grado', payloadActaSocializacion)
        .subscribe({
          next: (responseCertificadoARL: DocumentoTrabajoGrado[]) => {
            if (responseCertificadoARL.length > 0) {
              this.certificadoARL = responseCertificadoARL[0];
            }
            resolve();
          }, error: () => {
            reject('Ocurrió un error cargando la certificación de afiliación a la ARL. Por favor verifique su conexión e intente de nuevo');
          }
        });
    });
  }

  private cargarActaSocializacion(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Se consulta el tipo de documento 6 que es acta de socialización
      const tipoDocumento = this.tiposDocumento.find(p => p.CodigoAbreviacion === 'ACT_PLX');
      if (!tipoDocumento) {
        reject('No se pudieron consultar los documentos asociados al trabajo de grado.');
        return;
      }

      const payloadActaSocializacion = `query=DocumentoEscrito.TipoDocumentoEscrito:${tipoDocumento.Id},TrabajoGrado:${this.trabajoGrado.Id}&limit=1`;
      this.poluxCrud.get('documento_trabajo_grado', payloadActaSocializacion)
        .subscribe({
          next: (responseActaSocializacion: DocumentoTrabajoGrado[]) => {
            if (responseActaSocializacion.length > 0) {
              this.actaSocializacion = responseActaSocializacion[0];
            }
            resolve();
          }, error: () => {
            reject('Ocurrió un error cargando la certificación de afiliación a la ARL. Por favor verifique su conexión e intente de nuevo');
          }
        });
    });
  }

  private getVinculaciones(): Promise<void> {
    // Se consultan los vinculados
    return new Promise((resolve, reject) => {
      const payloadVinculados = `query=Activo:True,TrabajoGrado:${this.trabajoGrado.Id}&limit=0`;
      this.poluxCrud.get('vinculacion_trabajo_grado', payloadVinculados)
        .subscribe({
          next: async (responseVinculados: any[]) => {
            const promises: Promise<void>[] = [];
            responseVinculados.forEach(vinculacion => {
              vinculacion.RolTrabajoGrado = this.parametros.find(p => p.Id === vinculacion.RolTrabajoGrado);
              if (vinculacion.RolTrabajoGrado.CodigoAbreviacion === 'DIR_EXTERNO_PLX') {
                // Director externo
                promises.push(this.getExterno(vinculacion));
              } else {
                // Director interno y evaluadores
                promises.push(this.getInterno(vinculacion));
              }
              promises.push(this.getNota(vinculacion));
            });

            await Promise.all(promises)
              .then(() => {
                this.vinculados = responseVinculados;
                resolve();
              })
              .catch((error) => reject(error));
          }, error: () => {
            reject('Ocurrió un error al cargar los docentes vinculados al trabajo de grado, por favor verifique su conexión e intente de nuevo.');
          },
        });
    });
  }


  private getExterno(vinculacion: VinculacionTrabajoGradoDetalle): Promise<void> {
    return new Promise((resolve, reject) => {
      const payloadVinculado = `query=TrabajoGrado:${this.trabajoGrado.Id}&limit=0`;
      this.poluxCrud.get('detalle_pasantia', payloadVinculado)
        .subscribe({
          next: (dataExterno: DetallePasantia[]) => {
            if (dataExterno.length > 0) {
              var temp = dataExterno[0].Observaciones.split(' y dirigida por ');
              temp = temp[1].split(' con número de identificacion ');
              vinculacion.Nombre = temp[0];
              resolve();
            } else {
              reject('No hay datos asociados al director externo');
            }
          }, error: () => {
            reject('No se pudo consultar el director externo');
          }
        });
    });
  }

  private getInterno(vinculacion: VinculacionTrabajoGradoDetalle): Promise<void> {
    return new Promise((resolve, reject) => {
      this.academica.get('docente_tg', `${vinculacion.Usuario}`)
        .subscribe({
          next: (docente: responseDocente) => {
            if (docente.docenteTg?.docente) {
              vinculacion.Nombre = docente.docenteTg.docente[0].nombre;
              resolve();
            } else {
              reject('No hay datos relacionados al docente');
            }
          }, error: () => {
            reject('No se pudo consultar el director interno');
          }
        });
    });
  }

  private getNota(vinculacion: VinculacionTrabajoGradoDetalle): Promise<void> {
    return new Promise((resolve, reject) => {
      if (['DIR_EXTERNO_PLX', 'CODIRECTOR_PLX'].includes(vinculacion.RolTrabajoGrado.CodigoAbreviacion)) {
        vinculacion.Nota = `$translate.instant("ERROR.VINCULADO_NO_PUEDE_NOTA")`;
        resolve();
      } else if (['DIRECTOR_PLX', 'EVALUADOR_PLX'].includes(vinculacion.RolTrabajoGrado.CodigoAbreviacion)) {
        const payloadEvaluacion = `limit=1&query=VinculacionTrabajoGrado:${vinculacion.Id}`
        this.poluxCrud.get('evaluacion_trabajo_grado', payloadEvaluacion)
          .subscribe({
            next: (responseEvaluacion: EvaluacionTrabajoGrado[]) => {
              if (responseEvaluacion.length > 0) {
                // Si ya registró la nota
                vinculacion.Nota = responseEvaluacion[0].Nota; // Revisar
              } else {
                // Si no ha registrado ninguna nota
                vinculacion.Nota = 'No ha registrado nota en el sistema';
                // NOTIFICA QUE EL TRABAJO DE GRADO ESTÁ SIN CALIFICAR
                this.asignaturas.forEach(asignatura => { asignatura.Aprobacion = 'Sin Calificación' }); // Revisar
              }
              resolve();
            }, error: () => {
              reject('No se pudo consultar la evaluación del trabajo de grado')
            }
          });
      }
    });
  }

  private cargarAreasConocimiento(): Promise<void> {
    return new Promise((resolve, reject) => {
      const payloadAreas = `query=TrabajoGrado:${this.trabajoGrado.Id}&limit=0`;
      this.poluxCrud.get('areas_trabajo_grado', payloadAreas)
        .subscribe({
          next: (responseAreasConocimiento: AreasTrabajoGrado[]) => {
            responseAreasConocimiento.forEach((area) => {
              this.areasConocimiento.push(this.parametros.find(p => p.Id === area.AreaConocimiento) || new Parametro);
            })
            resolve();
          }, error: () => {
            reject('Ocurrió un error al cargar las áreas de conocimiento, por favor verifique su conexión e intente de nuevo.');
          }
        });
    });
  }

  private getEspaciosAcademicosInscritos(): Promise<void> {
    return new Promise((resolve, reject) => {

      const payloadEspaciosAcademicosInscritos = `query=TrabajoGrado:${this.trabajoGrado.Id}&limit=0`;
      this.poluxCrud.get('espacio_academico_inscrito', payloadEspaciosAcademicosInscritos)
        .subscribe({
          next: async (responseEspacios) => {
            if (responseEspacios.length > 0) {
              this.espacios = responseEspacios;
              const promises: Promise<void>[] = [];

              // Consultar nombres de los espacios
              this.espacios.forEach((espacio) => promises.push(this.getDataEspacio(espacio)));
              await Promise.all(promises)
                .then(() => resolve())
                .catch((error) => reject(error));
            } else {
              reject('Sin espacios académicos inscritos');
            }
          }, error: () => {
            reject('Ocurrió un error al intentar consultar los espacios académicos inscritos de los trabajos de grado consultados. Comuníquese con el administrador.');
          }
        });
    });
  }

  private getDataEspacio(espacio: EspacioAcademicoInscritoDetalle): Promise<void> {
    return new Promise((resolve, reject) => {
      this.academica.get('asignatura_pensum',
        `${espacio.EspaciosAcademicosElegibles.CodigoAsignatura}/${espacio.EspaciosAcademicosElegibles.CarreraElegible.CodigoPensum}`)
        .subscribe({
          next: (responseEspacio) => {
            if (responseEspacio.asignatura.datosAsignatura) {
              espacio.Nombre = responseEspacio.asignatura.datosAsignatura[0].nombre;
              resolve();
            } else {
              reject('No se encuentran datos de la materia');
            }
          }, error: () => {
            reject('No se encuentran datos de la materia');
          }
        });
    });
  }

  private getActas(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Se buscan los documentos de tipo acta de seguimiento
      const tipoDocumento = this.tiposDocumento.find(p => p.CodigoAbreviacion === 'ACT_PLX');
      if (!tipoDocumento) {
        reject('No se pudieron consultar los documentos asociados al trabajo de grado.');
        return;
      }

      var payloadActas = `query=DocumentoEscrito.TipoDocumentoEscrito:${tipoDocumento.Id},TrabajoGrado:${this.trabajoGrado.Id}&limit: 0`;
      this.poluxCrud.get('documento_trabajo_grado', payloadActas)
        .subscribe({
          next: (responseActas: DocumentoTrabajoGrado[]) => {
            this.actas = responseActas;
            resolve();
          }, error: () => {
            reject('Ocurrió un error cargando las actas de seguimiento, por favor verifique su conexion e intente de nuevo.');
          }
        });
    });
  }

  private getDetallePasantia(): Promise<void> {
    return new Promise((resolve, reject) => {
      var payloadPasantia = `query=TrabajoGrado:${this.trabajoGrado.Id}&limit=1`;
      this.poluxCrud.get('detalle_pasantia', payloadPasantia)
        .subscribe({
          next: (responsePasantia: DetallePasantia[]) => {
            if (responsePasantia.length > 0) {
              this.detallePasantia = responsePasantia[0];
              resolve();
            } else {
              reject('No hay detalles de la pasantia registrados.');
            }
          }, error: () => {
            reject('Ocurrió un error cargando los de talles de la pasantia, por favor verifique su conexion e intente de nuevo.');
          }
        });
    });
  }

  get getSettings(): Settings {
    return {
      actions: {
        columnTitle: 'Acciones',
        position: 'right',
        add: false,
        edit: false,
        delete: false,
      },
      mode: 'external',
      noDataMessage: 'No tiene trabajos para consultar',
      columns: {
        CodigoAsignatura: {
          title: 'Asignatura',
        },
        Anio: {
          title: 'Año',
        },
        Periodo: {
          title: 'Periodo',
        },
        Calificacion: {
          title: 'Calificación',
        },
        EstadoAsignaturaTrabajoGrado: {
          title: 'Estado',
          ...this.smartTable.getSettingsObject('Nombre'),
        },
        Aprobacion: {
          title: 'Aprobación',
        },
      },
    };
  }

  get getSettingsEspacios(): Settings {
    return {
      actions: {
        columnTitle: 'Acciones',
        position: 'right',
        add: false,
        edit: false,
        delete: false,
      },
      mode: 'external',
      noDataMessage: 'No hay espacios registrados',
      columns: {
        EspaciosAcademicosElegibles: {
          title: 'Asignatura',
          ...this.smartTable.getSettingsObject('CodigoAsignatura'),
        },
        NombreEspacio: {
          title: 'Año',
        },
        EstadoEspacioAcademicoInscrito: {
          title: 'Estado Trabajo Grado',
          ...this.smartTable.getSettingsObject('Nombre'),
        },
        Nota: {
          title: 'Nota',
        },
      },
    };
  }

  get getSettingsVinculaciones(): Settings {
    return {
      actions: {
        columnTitle: 'Acciones',
        position: 'right',
        add: false,
        edit: false,
        delete: false,
      },
      mode: 'external',
      noDataMessage: 'No hay vinculados al trabajo de grado',
      columns: {
        Nombre: {
          title: 'Nombre',
        },
        RolTrabajoGrado: {
          title: 'Rol',
          ...this.smartTable.getSettingsObject('Nombre'),
        },
        Nota: {
          title: 'Estado Trabajo Grado',
        },
      },
    };
  }

}
