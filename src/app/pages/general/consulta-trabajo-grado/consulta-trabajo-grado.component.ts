import { Component, OnInit } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ParametrosService } from '../../services/parametrosService';
import { DocumentoCrudService } from '../../services/documentoCrudService';
import { Parametro } from 'src/app/shared/models/parametro.model';
import { TipoDocumento } from 'src/app/shared/models/tipoDocumento.model';
import { UserService } from '../../services/userService';
import { PoluxCrudService } from '../../services/poluxCrudService';
import { EstudianteTrabajoGrado } from 'src/app/shared/models/estudianteTrabajoGrado.model';
import { TrabajoGrado, TrabajoGradoDetalle } from 'src/app/shared/models/trabajoGrado.model';
import { AcademicaService } from '../../services/academicaService';
import { DocumentoTrabajoGrado } from 'src/app/shared/models/documentoTrabajoGrado.model';
import { VinculacionTrabajoGradoDetalle } from 'src/app/shared/models/vinculacionTrabajoGrado.model';
import { DetallePasantia } from 'src/app/shared/models/detallePasantia.model';
import { EspacioAcademicoInscritoDetalle } from 'src/app/shared/models/espacioAcademicoInscrito.model';
import { AsignaturaTrabajoGrado } from 'src/app/shared/models/asignaturaTrabajoGrado.model';

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
  trabajoGrado: TrabajoGrado | TrabajoGradoDetalle | undefined;
  estudiantes: DetalleEstudiante[] = [];
  asignaturas: AsignaturaTrabajoGrado[] = [];
  vinculados: VinculacionTrabajoGradoDetalle[] = [];
  certificadoARL: DocumentoTrabajoGrado | undefined;
  actaSocializacion: DocumentoTrabajoGrado | undefined;
  actas: DocumentoTrabajoGrado[] = [];
  areasConocimiento: Parametro[] = [];
  espacios: EspacioAcademicoInscritoDetalle[] = [];
  detallePasantia: DetallePasantia | undefined;

  constructor(
    private userService: UserService,
    private poluxCrud: PoluxCrudService,
    private parametrosCrud: ParametrosService,
    private documentosCrud: DocumentoCrudService,
    private academica: AcademicaService,
  ) {
    this.codigo = this.userService.getCodigo();
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
    this.cargarTrabajos();
  }

  private cargarTrabajos() {
    // // Consultar trabajo de grado del estudiante
    const estadoEstudiante = this.parametros.find(p => p.CodigoAbreviacion === 'EST_ACT_PLX');
    if (!estadoEstudiante) {
      // alerta
      return;
    }

    const payloadTrabajoGrado = `query=EstadoEstudianteTrabajoGrado:${estadoEstudiante.Id},Estudiante:${this.codigo}&limit=1`;
    this.poluxCrud.get('estudiante_trabajo_grado', payloadTrabajoGrado)
      .subscribe({
        next: async (responseTrabajoGrado: EstudianteTrabajoGrado[]) => {
          if (responseTrabajoGrado.length > 0) {
            this.trabajoGrado = responseTrabajoGrado[0].TrabajoGrado;
            const estado = this.parametrosCrud.findParametro(responseTrabajoGrado[0].TrabajoGrado.EstadoTrabajoGrado, this.parametros);
            const modalidad = this.parametrosCrud.findParametro(responseTrabajoGrado[0].TrabajoGrado.Modalidad, this.parametros);

            // ctrl.userRole.includes('ESTUDIANTE')
            const esAnteproyectoModificable = ['AMO_PLX', 'ASMO_PLX'].includes(estado.CodigoAbreviacion);

            // Si el anteproyecto es viable se puede subir la primera versión del proyecto
            const esPrimeraVersion = ['AVI_PLX', 'ASVI_PLX'].includes(estado.CodigoAbreviacion);

            // Si el proyecto es modificable
            const esProyectoModificable = ['MOD_PLX'].includes(estado.CodigoAbreviacion);

            // Si es pasantia y esta en espera de ARL
            const pasantiaEnEsperaArl = ['PAEA_PLX'].includes(estado.CodigoAbreviacion);;

            this.trabajoGrado.EstadoTrabajoGrado = estado;
            this.trabajoGrado.Modalidad = modalidad;

            const promises = [
              this.cargarActaSocializacion(),
              this.cargarCertificadoARL(this.trabajoGrado.Id),
              this.getEstudiantesTg(this.trabajoGrado.Id),
              this.cargarAsignaturasTrabajoGrado(this.trabajoGrado.Id),
            ]


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
              .catch((error) => console.log(error));

            // COMPRUEBA SI EL USUARIO APROBÓ O NO
            this.asignaturas.forEach((asignatura) => {
              if (asignatura.Aprobacion == undefined) {
                // CONSULTA EL PERIODO ACADEMICO ANTERIOR
                this.academica.get('periodo_academico', 'P')
                  .subscribe({
                    next: (Periodo) => {
                      var P = Periodo.periodoAcademicoCollection.periodoAcademico[0];
                      // CONSULTA LOS DATOS DEL ESTUDIANTE
                      this.academica.get('datos_estudiante', [this.codigo, P.anio, P.periodo].join('/'))
                        .subscribe({
                          next: (respuestaDatos) => {
                            if (respuestaDatos.estudianteCollection.datosEstudiante[0].nivel === 'PREGRADO') {
                              // VALIDACIÓN PARA LA MODADLIDAD DE MATERIAS DE PROFUNDIZACIÓN EN PREGRADO
                              if (modalidad.CodigoAbreviacion == "EAPOS") {
                                if (asignatura.Calificacion >= 3.5) {
                                  asignatura.Aprobacion = 'Aprobado';
                                } else {
                                  asignatura.Aprobacion = 'Reprobado';
                                }
                              } else {
                                if (asignatura.Calificacion >= 3.0) {
                                  asignatura.Aprobacion = 'Aprobado';
                                } else {
                                  asignatura.Aprobacion = 'Reprobado';
                                }
                              }
                            } else if (respuestaDatos.estudianteCollection.datosEstudiante[0].nivel == 'POSGRADO') {
                              if (asignatura.Calificacion >= 3.5) {
                                asignatura.Aprobacion = 'Aprobado';
                              } else {
                                asignatura.Aprobacion = 'Reprobado';
                              }
                            }
                          }
                        });
                    }
                  });
              }
            });
            //   ctrl.gridOptionsAsignaturas.data = ctrl.trabajoGrado.asignaturas;
            //   angular.forEach(ctrl.gridOptionsAsignaturas.data, function (asignatura) {
            //     let EstadoAsignaturaTrabajoGradoTemp = ctrl.EstadosAsignaturaGrado.find(data => {
            //       return data.Id == asignatura.EstadoAsignaturaTrabajoGrado
            //     });
            //     asignatura.EstadoAsignaturaTrabajoGrado = EstadoAsignaturaTrabajoGradoTemp;
            //   });
            //   ctrl.gridOptionsEspacios.data = ctrl.trabajoGrado.espacios;
            //   ctrl.trabajoCargado = true;
            //   ctrl.loadTrabajoGrado = false;
            // })
          } else {
            // alerta no trabajo de grado en curso
          }
        }, error: () => {

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
            reject(new Error('No se pudieron consultar los estudiantes del trabajo de grado.'));
          }
        });

      // $q.all(promesasEstudiantes)
      //   .then(() => {
      //     ctrl.trabajoGrado.estudiantes = responseEstudiantes.data.map((estudiante) => {
      //       return estudiante.datos.codigo + " - " + estudiante.datos.nombre;
      //     }).join(', ');
      //     defer.resolve();
      //   })
    })
  }

  private cargarEstudiante(estudiante: DetalleEstudiante): Promise<void> {
    return new Promise((resolve, reject) => {
      // Consultar datos básicos del estudiante
      this.academica.get('datos_basicos_estudiante', estudiante.Estudiante)
        .subscribe({
          next: (responseDatosBasicos) => {
            if (responseDatosBasicos.datosEstudianteCollection.datosBasicosEstudiante) {
              estudiante.datosBasicos = responseDatosBasicos.datosEstudianteCollection.datosBasicosEstudiante[0];

              // Consultar nombre carrera
              this.academica.get('carrera', estudiante.datosBasicos.carrera)
                .subscribe({
                  next: (responseCarrera) => {
                    estudiante.proyecto = estudiante.datosBasicos.carrera + ' - ' + responseCarrera.carrerasCollection.carrera[0].nombre;
                    resolve();
                  }, error: () => {
                    reject(new Error('No se pudo consultar el proyecto curricular del estudiante'));
                  }
                });
            } else {
              reject(new Error('No se pudieron consultar los datos básicos del estudiante.'));
            }
          }, error: () => {
            reject(new Error('No se pudieron consultar los datos básicos del estudiante.'));
          }
        });
    });
  }

  private cargarAsignaturasTrabajoGrado(trabajoGradoId: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const payloadAsignaturas = `query=TrabajoGrado:${trabajoGradoId}&limit=2`;
      this.poluxCrud.get('asignatura_trabajo_grado', payloadAsignaturas)
        .subscribe({
          next: (responseAsignaturas) => {
            this.asignaturas = responseAsignaturas;
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

      const payloadActaSocializacion = `query=DocumentoEscrito.TipoDocumentoEscrito:${tipoDocumento.Id},TrabajoGrado:${this.trabajoGrado?.Id}&limit=1`;
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
      const payloadVinculados = `query=Activo:True,TrabajoGrado:${this.trabajoGrado?.Id}&limit=0`;
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
      const payloadVinculado = `query=TrabajoGrado:${this.trabajoGrado?.Id}&limit=0`;
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
          next: (docente) => {
            if (docente.docenteTg.docente) {
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
            next: (responseEvaluacion) => {
              if (responseEvaluacion.length > 0) {
                // Si ya registró la nota
                vinculacion.Nota = responseEvaluacion[0].Nota;
              } else {
                // Si no ha registrado ninguna nota
                vinculacion.Nota = `$translate.instant("ERROR.VINCULADO_NO_NOTA")`;
                // NOTIFICA QUE EL TRABAJO DE GRADO ESTÁ SIN CALIFICAR
                // angular.forEach(ctrl.trabajoGrado.asignaturas, function (asignatura) {
                //   asignatura.Aprobacion = $translate.instant("ERROR.SIN_CALIFICACION");
                // })
              }
              resolve();
            }, error: () => {
              reject('No se pudo consultar la evaluación del trabajo de grado')
            }
          })
      }
    });
  }

  private cargarAreasConocimiento(): Promise<void> {
    return new Promise((resolve, reject) => {
      const payloadAreas = `query=TrabajoGrado:${this.trabajoGrado?.Id}&limit=0`;
      this.poluxCrud.get('areas_trabajo_grado', payloadAreas)
        .subscribe({
          next: (responseAreasConocimiento: any[]) => {
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

      const payloadEspaciosAcademicosInscritos = `query=TrabajoGrado:${this.trabajoGrado?.Id}&limit=0`;
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

      var payloadActas = `query=DocumentoEscrito.TipoDocumentoEscrito:${tipoDocumento.Id},TrabajoGrado:${this.trabajoGrado?.Id}&limit: 0`;
      this.poluxCrud.get('documento_trabajo_grado', payloadActas)
        .subscribe({
          next: (responseActas) => {
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
      var payloadPasantia = `query=TrabajoGrado:${this.trabajoGrado?.Id}&limit=1`;
      this.poluxCrud.get('detalle_pasantia', payloadPasantia)
        .subscribe({
          next: (responsePasantia) => {
            if (responsePasantia.length > 0) {
              this.detallePasantia = responsePasantia[0].Observaciones;
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

}
