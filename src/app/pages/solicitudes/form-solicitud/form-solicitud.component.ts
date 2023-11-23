import { Component, OnInit } from '@angular/core';
import { AbstractControlOptions, FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { environment } from 'src/environments/environment';
import { RequestManager } from 'src/app/core/manager/request.service';
import * as moment from 'moment';
import { UserService } from '../../services/userService';
import { GestorDocumentalService } from '../../services/gestorDocumentalService';

@Component({
  selector: 'app-form-solicitud',
  templateUrl: './form-solicitud.component.html',
  styleUrls: ['./form-solicitud.component.scss']
})
export class FormSolicitudComponent implements OnInit {
  formSolicitud: FormGroup = this.initForm();

  modalidades: any[] = [];
  areasConocimiento: any[] = [];

  // * @property {Array} modalidades Modalidades disponibles para la elección del estudiante.
  // * @property {Object} estudiante Datos del estudiante que esta realizando la solicitud.
  periodoAnterior: any = {};
  periodoActual: any = {};
  periodoSiguiente: any = {};
  tiposSolicitud: any[] = []; // Solicitudes realizadas por el estudiante anteriormente
  detalles: any[] = []; //Detalles cargados para mostrar en el formulario que se asocian con la modalidad y el tipo de solicitud escogidas por el solicitante.
  areas: any[] = []; // Areas del conocimiento.
  espaciosElegidos: any[] = []; //Objeto que contiene los espacios elegidos por el estudiante en la solicitud inicial.
  // * @property {Boolean} detallesCargados Flag que indica que los detalles terminaron de cargarse..
  siPuede = false; // Flag que permite identificar si se puede realizar la solicitud (el estudiante cumple con los requisitos y se encuentra en las fechas para hacerlo)
  // * @property {Boolean} restringirModalidadesPosgrado Flag que permite identificar si se deben restringir las demas modalidades debido a que el estudiante ya realizo una solicitud inicial de materias de posgrado.
  estudiantesTg: any[] = []; // Estudiantes asociados al tranajo de grado.
  estudiantes: any[] = []; // Estudiantes que se agregan a la solicitud inicial.
  Trabajo: any = {};// Datos del trabajo de grado que cursa el estudiante que esta realizando la solicitud.
  siModalidad = false; // Indicador que maneja la habilitación de una modalidad
  modalidadSelect = false;// Indicador que maneja la selección de una modalidad
  tipoSolicitudId = 0;
  // * @property {Boolean} solicitudConDetalles Indicador que maneja el contenido de los detalles dentro de una solicitud
  // * @property {Boolean} restringirModalidadesProfundizacion Indicador que maneja la restricción de modalidades para crear solicitud y solo habilita la modalidad de profundización
  detallesConDocumento: any[] = []; // Colección que maneja los detalles con documento de una solicitud
  tieneProrrogas = false // Indicador que maneja si existen prórrogas registradas para el estudiante que realiza la solicitud
  codigo = '';// Texto que carga el código del estudiante en sesión
  mensajeErrorCarga = '';// Texto que aparece en caso de haber un error durante la carga de información
  // * @property {Object} modalidad Objeto que carga el contenido de la modalidad seleccionada
  // * @property {Object} Trabajo Objeto que carga la información del estudiante con trabajo de grado registrado
  carreraElegida: any = {};// Objeto que carga la información sobre la carrera elegida por el estudiante
  trabajo_grado_completo: any = {}; // Objeto que carga la información del trabajo de grado en curso
  trabajoGradoId = 0;// Valor que carga el identificador del trabajo de grado
  trabajoGrado: any = {};
  // * @property {Boolean} errorCarga Indicador que maneja la aparición de un error durante la carga de información
  // * @property {String} mensajeError Texto que aparece en caso de haber un error al cargar los datos del estudiante con solicitud de trabajo de grado
  periodo = '';
  fechaActual = '';
  fechaInicio = '';
  fechaFin = '';
  // * @property {Boolean} errorParametros Indicador que maneja la aparición de un error durante la carga de parámetros
  TipoSolicitud: any; // Objeto que carga la información del tipo de solicitud seleccionada
  modalidadTipoSolicitudId = 0; // Valor que carga el identificador del tipo de solicitud asociada a una modalidad
  erroresFormulario = false; // Indicador que maneja la aparición de errores durante el diligenciamiento del formulario
  // * @property {Object} solicitud Contenido que va a registrarse en la base de datos sobre la solicitud
  // * @property {Object} doc Objeto que carga la información sobre el documento que se obtiene
  // * @property {Object} document Objeto que carga la información sobre el documento que se obtiene
  // * @property {Object} blob Objeto que carga la información sobre el Blob del documento en carga
  // * @property {Object} content Objeto que define las propiedades de visualización para el documento en carga
  // * @property {Boolean} cargandoParametros Texto que aparece durante la carga de parámetros en la vista
  // * @property {Boolean} enviandoFormulario Texto que aparece durante el envío del formulario
  // * @property {Boolean} cargandoDetalles Texto que aparece durante la carga de detalles en el módulo
  // * @property {Boolean} loadParametros Indicador que define el periodo de carga para los parámetros
  // * @property {Object} infiniteScroll Objeto que configura las propiedades para la barra de desplazamiento en la visualización
  // * @property {Boolean} loadDetalles Indicador que define el periodo de carga para los detalles de la solicitud
  // * @property {Boolean} loadFormulario Indicador que define el periodo de carga para el formulario
  posDocente = 0; // Posición en la que se encuentra la información del docente en los detalles del tipo de solicitud
  docDocenteDir = ''; // Documento del docente director
  // * @property {Number} contador contador para no repetir valores en la modalidad de pasantia
  Nota = false; // flag que indica si el trabajo de grado ya está calificado
  url = 'url';

  Docente_solicitudes: any[] = [];
  loadDocenteSolicitud = false;
  Docente_trabajos = false;
  tipoSolicitud_Docente = 0;
  showForm = false;

  constructor(
    private request: RequestManager,
    private userService: UserService,
    private gestorDocumental: GestorDocumentalService
  ) {
    this.codigo = this.userService.user.userService?.Codigo;
  }

  ngOnInit(): void {
    this.verificarSiPuedeSolicitar()
      .then(async puedeSolicitar => {
        if (puedeSolicitar) {
          await Promise.all([
            this.getTrabajoGrado(),
            this.getPeriodoActual(),
            this.getPeriodoAnterior(),
            this.getPeriodoSiguiente(),
            this.obtenerAreas(),
          ]);
          this.obtenerDatosEstudiante();
        } // else {
        // }
      })
  }

  private initForm(): FormGroup {
    const ff: FormGroup = new FormGroup({});
    return ff;
  }


  get controlSoporte() {
    return this.formSolicitud.get('soporte') as FormControl;
  }

  private verificarRequisitos(): Promise<void> {
    return new Promise((resolve) => {
      resolve();
    })
    // const promesas = [];
    // if (!this.siModalidad) {
    //   promesas.push(this.verificarRequisitosModalidad());
    //   promesas.push(this.verificarFechas(tipoSolicitud, modalidad));
    // }
    // if (!tipoSolicitud.TipoSolicitud) {
    //   promesas.push(this.verificarRequisitosModalidad());
    //   promesas.push(this.verificarTipoSolicitud(tipoSolicitud));
    // }

    // const result: boolean[] = await Promise.all(promesas);

  }

  modalidad = 0;
  estudiante: any = {};
  Docente = 0;
  private verificarRequisitosModalidad(): void {
    if (!this.estudiante.Modalidad) {
      this.estudiante.Modalidad = this.modalidad;
    }
    this.request.post(
      environment.POLUX_MID_SERVICE, `verificarRequisitos/Registrar`, this.estudiante)
      .subscribe((requisitos: any) => {
        this.estudiante.Modalidad = null;
        if (requisitos.data.RequisitosModalidades) {
          return true;
        } else {
          return this.Docente === 1;
        }
      })
  }

  private verificarFechas(tipoSolicitud: number, modalidad: number): any {
    //si la solicitud es de materias de posgrado e inicial
    if (tipoSolicitud === 2 && (modalidad === 2 || modalidad === 3)) {
      this.periodo = this.periodoSiguiente.anio + '-' + this.periodoSiguiente.periodo;
      this.fechaActual = moment(new Date()).format('YYYY-MM-DD HH:mm');
      let tipoSesionPadre = 0;
      if (modalidad === 2) {
        // modalidad == 'POSGRADO'
        tipoSesionPadre = 1;
      } else {
        // modalidad === 3, modalidad === 'PREGRADO'
        tipoSesionPadre = 9;
      }

      const payload = 'query=SesionPadre.TipoSesion.Id:' + tipoSesionPadre +
        ',SesionHijo.TipoSesion.Id:3,SesionPadre.periodo:' + this.periodoSiguiente.anio + this.periodoSiguiente.periodo +
        '&limit=1';
      this.request.get(environment.SESIONES_SERVICE, `relacion_sesiones?${payload}`)
        .subscribe((responseSesiones: any) => {
          if (Object.keys(responseSesiones?.data[0]).length > 0) {
            const sesion = responseSesiones.data[0];
            const fechaHijoInicio = new Date(sesion.SesionHijo.FechaInicio);
            fechaHijoInicio.setTime(fechaHijoInicio.getTime() + fechaHijoInicio.getTimezoneOffset() * 60 * 1000);
            this.fechaInicio = moment(fechaHijoInicio).format('YYYY-MM-DD HH:mm');
            const fechaHijoFin = new Date(sesion.SesionHijo.FechaFin);
            fechaHijoFin.setTime(fechaHijoFin.getTime() + fechaHijoFin.getTimezoneOffset() * 60 * 1000);
            this.fechaInicio = moment(fechaHijoInicio).format('YYYY-MM-DD HH:mm');
            this.fechaFin = moment(fechaHijoFin).format('YYYY-MM-DD HH:mm');
            if (this.fechaInicio <= this.fechaActual && this.fechaActual <= this.fechaFin) {
              return true;
            } else {
              // ctrl.mensajeError = $translate.instant('ERROR.NO_EN_FECHAS_INSCRIPCION');
              return false;
            }
          } else {
            // ctrl.mensajeError = $translate.instant('ERROR.SIN_FECHAS_MODALIDAD');
            return false;
          }
        })
    } else {
      return true;
    }
  }

  private verificarTipoSolicitud(tipoSolicitud: any): boolean {
    if (tipoSolicitud?.TipoSolicitud?.Id === 6) {
      // solicitud de socialización
      // el estado del trabajo de grado debe ser Listo para sustentar Id 17
      if (this.trabajoGrado.EstadoTrabajoGrado.Id === 17) {
        return true;
      } else {
        // ctrl.mensajeError = $translate.instant("ERROR.ESTADO_TRABAJO_GRADO_NO_PERMITE", {
        //   estado_tg: ctrl.trabajoGrado.EstadoTrabajoGrado.Nombre,
        //   tipoSolicitud: tipoSolicitud.TipoSolicitud.Nombre,
        // });
        return false
      }
    } else if (tipoSolicitud.TipoSolicitud.Id === 13) {
      // solicitud de revisión de jurado
      // el estado del trabajo de grado debe ser en curso Id 13 o en Modificable 16
      if (this.trabajoGrado.EstadoTrabajoGrado.Id === 13 || this.trabajoGrado.EstadoTrabajoGrado.Id === 16) {
        return true;
      } else {
        // ctrl.mensajeError = $translate.instant("ERROR.ESTADO_TRABAJO_GRADO_NO_PERMITE", {
        //   estado_tg: ctrl.trabajoGrado.EstadoTrabajoGrado.Nombre,
        //   tipoSolicitud: tipoSolicitud.TipoSolicitud.Nombre,
        // });
        return false;
      }
    } else {
      return true;
    }
  }

  // ctrl.verificarSolicitudes
  private verificarSiPuedeSolicitar(): Promise<boolean> {
    const payload = 'query=Usuario:' + this.codigo + '&limit=-1';

    return new Promise((resolve) => {
      this.request.get(environment.POLUX_SERVICE, `usuario_solicitud?${payload}`)
        .subscribe(async (responseUser) => {
          this.getProrroga();
          const arregloSolicitudesNormales = responseUser
            .filter((us: any) => us.SolicitudTrabajoGrado.ModalidadTipoSolicitud.Id !== 13)
            .map((usF: any) => usF.SolicitudTrabajoGrado.Id);
          const arregloSolicitudesMaterias = responseUser
            .filter((us: any) => us.SolicitudTrabajoGrado.ModalidadTipoSolicitud.Id === 13)
            .map((usF: any) => usF.SolicitudTrabajoGrado.Id);

          const resultado = await Promise.all([
            this.requestRespuesta(arregloSolicitudesNormales),
            this.requestRespuestaMateriasPosgrado(arregloSolicitudesMaterias),
          ]);

          resolve(!resultado.filter(r => r === false).length);
        })
    })
  }

  private requestRespuesta(solicitudesActuales: any[]): Promise<boolean> {
    const payload = 'query=EstadoSolicitud__in:1|19,Activo:true,SolicitudTrabajoGrado__in:' + solicitudesActuales.join('|') + '&limit=1'
    return new Promise((resolve) => {
      if (!solicitudesActuales.length) {
        resolve(true);
      } else {
        this.request.get(environment.POLUX_SERVICE, `respuesta_solicitud?${payload}`)
          .subscribe((responseSolicitudesActuales) => {
            resolve(!responseSolicitudesActuales.length);
          })
      }
    });
  }

  private requestRespuestaMateriasPosgrado(solicitudesActuales: any[]): Promise<boolean> {
    const payload = 'query=EstadoSolicitud__in:1|4|5|7|9|10|23,Activo:true,SolicitudTrabajoGrado__in:' + solicitudesActuales.join('|') + '&limit=1';
    return new Promise((resolve) => {
      if (!solicitudesActuales.length) {
        resolve(true);
      } else {
        this.request.get(environment.POLUX_SERVICE, `respuesta_solicitud?${payload}`)
          .subscribe((responseSolicitudesActuales) => {
            resolve(!responseSolicitudesActuales.length);
          })
      }
    });
  }

  private getProrroga(): void {
    const payload = 'query=TrabajoGrado.EstadoTrabajoGrado.Id:1,Estudiante:' + this.codigo;
    this.request.get(environment.POLUX_SERVICE, `estudiante_trabajo_grado?${payload}`)
      .subscribe((responseTrabajoGrado: any) => {
        // Se consulta si el trabajo tiene solicitudes de proroga aprobadas
        if (responseTrabajoGrado.length) {
          const payload = 'query=EstadoSolicitud:6,Activo:true,SolicitudTrabajoGrado.ModalidadTipoSolicitud.TipoSolicitud.Id:7' +
            ',SolicitudTrabajoGrado.TrabajoGrado.Id:' + responseTrabajoGrado[0].Id + '&limit=1';
          this.request.get(environment.POLUX_SERVICE, `respuesta_solicitud?${payload}`)
            .subscribe((responseProrroga) => {
              this.tieneProrrogas = responseProrroga.length;
            });
        }
      });
  }

  // ctrl.getTrabajoGrado
  private getTrabajoGrado(): Promise<void> {
    return new Promise((resolve) => {
      const payload = `query=Estudiante:${this.codigo},EstadoEstudianteTrabajoGrado:1&limit=1`;
      this.request.get(environment.POLUX_SERVICE, `estudiante_trabajo_grado?${payload}`)
        .subscribe(async (responseTrabajoEstudiante) => {
          const promises = [];
          if (responseTrabajoEstudiante.length) {
            this.Trabajo = responseTrabajoEstudiante[0];
            this.modalidad = responseTrabajoEstudiante[0].TrabajoGrado.Modalidad.Id;
            this.trabajo_grado_completo = responseTrabajoEstudiante[0].TrabajoGrado;
            this.trabajoGradoId = responseTrabajoEstudiante[0].TrabajoGrado.Id;
            this.trabajoGrado = responseTrabajoEstudiante[0].TrabajoGrado;
            this.siModalidad = true;
            this.modalidadSelect = true;
            // Buscar de autores del tg
            this.getEstudiantesTg(this.trabajoGradoId);
            this.cargarTipoSolicitud(this.modalidad);
            this.getVinculadosTg(this.trabajoGradoId);
            if (this.modalidad === 2 || this.modalidad === 3) {
              promises.push(this.getEspaciosInscritos(this.trabajoGradoId));
            }
          } else {
            if (this.Docente == 1) {
              const payload = 'query=Usuario:' + this.codigo + ',Activo:true,RolTrabajoGrado:3';
              this.request.get(environment.POLUX_SERVICE, `vinculacion_trabajo_grado?${payload}`)
                .subscribe((responseVinculacion) => {
                  responseVinculacion.forEach((solicitud: any) => {
                    if (solicitud.TrabajoGrado.EstadoTrabajoGrado.Id === 17) {
                      this.Docente_solicitudes.push(solicitud);
                      // this.loadDocenteSolicitud = true;
                    }
                  });
                  if (responseVinculacion.length) {
                    this.Trabajo = responseVinculacion[0];
                    this.modalidad = responseVinculacion[0].TrabajoGrado.Modalidad.Id;
                    this.trabajo_grado_completo = responseVinculacion[0].TrabajoGrado;
                    this.trabajoGradoId = responseVinculacion[0].TrabajoGrado.Id;
                    this.trabajoGrado = responseVinculacion[0].TrabajoGrado;
                    this.siModalidad = true;
                    this.modalidadSelect = true;
                    //buscar # de autores del tg
                    promises.push(this.getEstudiantesTg(this.trabajoGrado));
                    promises.push(this.cargarTipoSolicitud(this.modalidad));
                    promises.push(this.getVinculadosTg(this.trabajoGrado));
                    if (this.modalidad == 2 || this.modalidad == 3) {
                      promises.push(this.getEspaciosInscritos(this.trabajoGradoId));
                    }
                  }
                });
            } else {
              promises.push(this.getModalidades());
              //obtener solicitudes iniciales anteriores hechas por el usuario modalidad de posgrado
              //promises.push(getSolicitudesAnteriores());
            }
          }

          await Promise.all(promises);
          resolve();
        })
    })
  }

  private getNotaTrabajoGrado(): Promise<boolean> {
    return new Promise((resolve) => {
      const payload = `query=Estudiante:${this.codigo},EstadoEstudianteTrabajoGrado:1&limit=1`;
      this.request.get(environment.POLUX_SERVICE, `estudiante_trabajo_grado?${payload}`)
        .subscribe((estudiante_trabajo_grado) => {
          const payload = `query=TrabajoGrado:${estudiante_trabajo_grado[0].TrabajoGrado.Id}&limit=0`;
          this.request.get(environment.POLUX_SERVICE, `vinculacion_trabajo_grado?${payload}`)

            .subscribe((vinculacion_trabajo_grado) => {
              for (var i = 0; i < vinculacion_trabajo_grado.length; i++) {
                const payload = `query=VinculacionTrabajoGrado:${vinculacion_trabajo_grado[i].Id}&limit=0`;
                this.request.get(environment.POLUX_SERVICE, `evaluacion_trabajo_grado?${payload}`)
                  .subscribe((evaluacion_trabajo_grado_results) => {
                    for (var i = 0; i < evaluacion_trabajo_grado_results.length; i++) {
                      if (evaluacion_trabajo_grado_results[i][0].Nota >= 0) {
                        //CAMBIAR CUANDO SE VAYA A SUBIR A PRODUCCIÓN
                        resolve(false);
                      }
                    }

                    resolve(false);
                  })

              }

            })
        })
    })
  }

  private getEstudiantesTg(idTrabajoGrado: number) {
    const payload = `query=EstadoEstudianteTrabajoGrado.Id:1,TrabajoGrado:${idTrabajoGrado}&limit=0`;
    this.request.get(environment.POLUX_SERVICE, `estudiante_trabajo_grado?${payload}`)
      .subscribe((autoresTg) => {
        autoresTg.forEach((estudiante: any) => {
          if (estudiante.Estudiante !== this.codigo && estudiante.Estudiante !== '') {
            this.estudiantesTg.push(estudiante.Estudiante);
          }
        });
      })
  }

  private getVinculadosTg(idTrabajoGrado: number) {
    const payload = 'query=TrabajoGrado:' + idTrabajoGrado + ',Activo:true&limit=0';
    this.request.get(environment.POLUX_SERVICE, `vinculacion_trabajo_grado?${payload}`)
      .subscribe((responseVinculacion) => {
        this.Trabajo.evaluadores = [];
        responseVinculacion.forEach((vinculado: any) => {
          if (vinculado.RolTrabajoGrado.Id === 1) {
            this.Trabajo.directorInterno = vinculado;
          }
          if (vinculado.RolTrabajoGrado.Id === 2) {
            this.Trabajo.directorExterno = vinculado;
          }
          if (vinculado.RolTrabajoGrado.Id === 3) {
            this.Trabajo.evaluadores.push(vinculado);
          }
          if (vinculado.RolTrabajoGrado.Id === 4) {
            this.Trabajo.codirector = vinculado;
          }
        });
      })
  }

  private getEspaciosInscritos(idTrabajoGrado: number) {
    const payload = 'query=trabajo_grado:' + idTrabajoGrado + '&limit=0';
    this.request.get(environment.POLUX_SERVICE, `vinculacion_trabajo_grado?${payload}`)
      .subscribe((responseEspacios) => {
        if (responseEspacios.length) {
          responseEspacios.forEach((espacio: any) => {
            this.espaciosElegidos.push(espacio.EspaciosAcademicosElegibles);
          });
          this.carreraElegida = responseEspacios[0].EspaciosAcademicosElegibles.CarreraElegible.Id;
        }
      })
  }

  private getModalidades() {
    this.request.get(environment.POLUX_SERVICE, `modalidad?limit=-1`)
      .subscribe((responseModalidad) => {
        if (responseModalidad.length) {
          this.modalidades = responseModalidad;
        } else {
          // ctrl.mensajeErrorCarga = $translate.instant("ERROR.SIN_MODALIDADES");
          // defer.reject("No hay modalidades registradas");
        }
      })
  }

  // ctrl.cargarTipoSolicitud
  private cargarTipoSolicitud(modalidad: any): void {
    this.tiposSolicitud = [];
    if (this.Docente !== 0 && !modalidad) {
      modalidad = 1;
    }

    const payload = 'query=Modalidad:' + modalidad + ',TipoSolicitud.Activo:true&limit=0';
    this.request.get(environment.POLUX_SERVICE, `modalidad_tipo_solicitud?${payload}`)
      .subscribe((responseTiposSolicitudes) => {
        responseTiposSolicitudes = responseTiposSolicitudes
          .filter((s: any) => s.TipoSolicitud.Id !== 2 && s.TipoSolicitud.Id !== 11);
        if (this.tieneProrrogas) {
          this.tiposSolicitud = responseTiposSolicitudes.filter((s: any) => s.TipoSolicitud.Id !== 7);
        } else {
          if (this.Docente === 1) {
            this.tiposSolicitud = responseTiposSolicitudes.filter((s: any) => s.TipoSolicitud.Id === 6);
          } else {
            this.tiposSolicitud = responseTiposSolicitudes.filter((s: any) => s.TipoSolicitud.Id !== 6);
          }
        }
      });
  }

  private getPeriodoActual(): Promise<void> {
    return new Promise((resolve) => {
      this.request.get(environment.ACADEMICA_SERVICE, 'periodo_academico/A')
        .subscribe((responsePeriodo) => {
          if (responsePeriodo.periodoAcademicoCollection.periodoAcademico) {
            this.periodoActual = responsePeriodo.periodoAcademicoCollection.periodoAcademico[0];
            this.periodo = this.periodoActual.anio + '-' + this.periodoActual.periodo;
            resolve();
          } else {
            // ctrl.mensajeErrorCarga = $translate.instant("ERROR.SIN_PERIODO");
            // defer.reject("sin periodo");
          }
        });
    });
  }

  private getPeriodoAnterior(): Promise<void> {
    return new Promise((resolve) => {
      this.request.get(environment.ACADEMICA_SERVICE, 'periodo_academico/P')
        .subscribe((responsePeriodo) => {
          if (responsePeriodo.periodoAcademicoCollection.periodoAcademico) {
            this.periodoAnterior = responsePeriodo.periodoAcademicoCollection.periodoAcademico[0];
          } else {
            // ctrl.mensajeErrorCarga = $translate.instant("ERROR.SIN_PERIODO");
            // defer.reject("sin periodo");
          }
          resolve();
        })
    })
  }

  private getPeriodoSiguiente(): Promise<void> {
    return new Promise((resolve) => {
      this.request.get(environment.ACADEMICA_SERVICE, 'periodo_academico/X')
        .subscribe((responsePeriodo) => {
          if (responsePeriodo.periodoAcademicoCollection.periodoAcademico) {
            this.periodoSiguiente = responsePeriodo.periodoAcademicoCollection.periodoAcademico[0];
          } else {
            // ctrl.mensajeErrorCarga = $translate.instant("ERROR.SIN_PERIODO");
            // defer.reject("sin periodo");
          }
          resolve();
        });
    })
  }

  private obtenerAreas(): Promise<void> {
    return new Promise((resolve) => {
      const payload = 'query=Activo:true&limit=0';
      this.request.get(environment.POLUX_SERVICE, `area_conocimiento?${payload}`)
        .subscribe((responseAreas) => {
          this.areas = responseAreas;
          if (this.areas.length) {
            const estado = true;
            const areasSnies = [
              { Id: 1, estado, Nombre: 'AGRONOMIA VETERINARIA Y AFINES' },
              { Id: 2, estado, Nombre: 'BELLAS ARTES' },
              { Id: 3, estado, Nombre: 'CIENCIAS DE LA EDUCACION' },
              { Id: 4, estado, Nombre: 'CIENCIAS DE LA SALUD' },
              { Id: 5, estado, Nombre: 'CIENCIAS SOCIALES Y HUMANAS' },
              { Id: 6, estado, Nombre: 'ECONOMIA, ADMINISTRACION, CONTADURIA Y AFINES' },
              { Id: 7, estado, Nombre: 'INGENIERIA, ARQUITECTURA, URBANISMO Y AFINES' },
              { Id: 8, estado, Nombre: 'MATEMATICAS Y CIENCIAS NATURALES' },
              { Id: 9, estado, Nombre: 'SIN CLASIFICAR' }
            ];
            //  coreAmazonCrudService.get("snies_area").then(function(responseAreas) {
            //      var areasSnies = responseAreas.data;
            if (Object.keys(areasSnies[0]).length > 0) {
              this.areas.forEach((area) => {
                areasSnies.forEach((areaSnies) => {
                  if (area.SniesArea === areaSnies.Id) {
                    area.Snies = areaSnies.Nombre;
                  }
                });
              });
              //
              resolve();
            } else {
              // ctrl.mensajeErrorCarga = $translate.instant("ERROR.CARGAR_AREAS");
              // defer.reject("no hay areas");
            }
            /*  })
              .catch(function(error) {
                ctrl.mensajeErrorCarga = $translate.instant("ERROR.CARGAR_AREAS");
                defer.reject(error);
              });
              */
          } else {
            // ctrl.mensajeErrorCarga = $translate.instant("ERROR.CARGAR_AREAS");
            // defer.reject("no hay areas");
          }
        });
    })
  }

  private obtenerDatosEstudiante(): void {
    this.request.get(environment.ACADEMICA_SERVICE, `datos_estudiante/${this.codigo}/${this.periodoAnterior.anio}/${this.periodoAnterior.periodo}`)
      .subscribe((response2) => {
        if (response2.estudianteCollection.datosEstudiante) {
          this.estudiante = {
            Codigo: this.codigo,
            Nombre: response2.estudianteCollection.datosEstudiante[0].nombre,
            Modalidad: this.modalidad,
            Tipo: 'POSGRADO',
            PorcentajeCursado: response2.estudianteCollection.datosEstudiante[0].porcentaje_cursado,
            // "PorcentajeCursado": response2.data.estudianteCollection.datosEstudiante[0].creditosCollection.datosCreditos[0].porcentaje.porcentaje_cursado[0].porcentaje_cursado,
            Promedio: response2.estudianteCollection.datosEstudiante[0].promedio,
            Rendimiento: response2.estudianteCollection.datosEstudiante[0].rendimiento,
            Estado: response2.estudianteCollection.datosEstudiante[0].estado,
            Nivel: response2.estudianteCollection.datosEstudiante[0].nivel,
            TipoCarrera: response2.estudianteCollection.datosEstudiante[0].nombre_tipo_carrera,
            Carrera: response2.estudianteCollection.datosEstudiante[0].carrera
          };

          if (this.estudiante.Nombre === undefined) {
            // ctrl.mensajeErrorCarga = $translate.instant("ERROR.CARGAR_DATOS_ESTUDIANTE");
            // defer.reject("datos del estudiante invalidos");
          } else {
            this.estudiante.asignaturas_elegidas = [];
            this.estudiante.areas_elegidas = [];
            this.estudiante.minimoCreditos = false;
            // defer.resolve(ctrl.estudiante);
          }
          // this.cargarDetalles(false);
        } else {
          if (this.Docente === 1) {
            // resolve(true);
          } else {
            // ctrl.mensajeErrorCarga = $translate.instant("ERROR.ESTUDIANTE_NO_ENCONTRADO");
            // defer.reject("no se encuentran datos estudiante");
          }
        }
      })
    // .catch(function (error) {
    //   ctrl.mensajeErrorCarga = $translate.instant("ERROR.CARGAR_DATOS_ESTUDIANTE");
    //   defer.reject(error);
    // });
  }

  private getModalidadTipoSolicitud(): Promise<void> {
    return new Promise((resolve) => {
      const payload = `query=TipoSolicitud.Id:${this.tipoSolicitudId},Modalidad.Id:${this.modalidad}&limit=1`;
      this.request.get(environment.POLUX_SERVICE, `modalidad_tipo_solicitud?${payload}`)
        .subscribe((responseModalidadTipoSolicitud) => {
          this.modalidadTipoSolicitudId = responseModalidadTipoSolicitud[0].Id;
          resolve();
        })
    })
  }

  private getOpcionesPolux(detalle: any, parametrosServicio: string[], parametrosConsulta: any[], sql: string): Promise<void> {
    return new Promise((resolve) => {
      if (parametrosServicio[2] !== undefined) {
        parametrosConsulta = parametrosServicio[2].split(",");
        parametrosConsulta.forEach((parametro) => {
          if (!parametro.includes(":")) {
            if (parametro == "trabajo_grado") {
              parametro = parametro + ":" + this.trabajoGradoId;
            }
            if (parametro == "carrera_elegible") {
              parametro = parametro + ":" + this.carreraElegida;
            }
            /* //Si el parametro es activo se deja tal y como esta en la bd
            if (parametro == "activo") {
              parametro = parametro;
            }*/
            if (parametro == "id") {
              parametro = parametro + ":" + this.trabajoGradoId;
            }
          }
          if (sql === "") {
            sql = parametro;
          } else {
            sql = sql + "," + parametro;
          }
        });
        detalle.parametros = `query=${sql}&limit=0`;
      }
      this.request.get(environment.POLUX_SERVICE, `${parametrosServicio[1]}?${detalle.parametros}`)
        .subscribe(async (responseOpciones) => {
          if (detalle.Detalle.Nombre.includes("Nombre actual de la propuesta")) {
            detalle.opciones.push({
              NOMBRE: responseOpciones[0].Titulo,
              bd: responseOpciones[0].Titulo,
            });
            resolve();
          } else if (detalle.Detalle.Nombre.includes("Actual resumen de la propuesta")) {
            detalle.opciones.push({
              NOMBRE: responseOpciones[0].DocumentoEscrito.Resumen,
              bd: responseOpciones[0].DocumentoEscrito.Resumen
            });
            resolve();
          } else if (detalle.Detalle.Nombre.includes("Propuesta actual")) {
            detalle.respuesta = responseOpciones[0].DocumentoEscrito.Enlace;
            //
            resolve();
          } else if (detalle.Detalle.Nombre.includes("Areas de conocimiento actuales")) {
            //
            var areasString = "";
            responseOpciones.forEach((area: any) => {
              areasString = areasString + ", " + area.AreaConocimiento.Nombre;
            });
            detalle.opciones.push({
              NOMBRE: areasString.substring(2),
              bd: areasString.substring(2)
            });
            resolve();
          } else if (detalle.Detalle.Nombre.includes("Nombre Empresa")) {
            responseOpciones.forEach((empresa: any) => {
              detalle.opciones.push({
                NOMBRE: empresa.Identificacion + "",
                bd: empresa.Identificacion + "",
              });
            });
            resolve();
          } else if (detalle.Detalle.Nombre.includes("Espacio Academico Anterior")) {
            const promisesEspacio: any[] = [];
            responseOpciones.forEach((espacio: any) => {
              promisesEspacio.push(this.getEspacioAnterior(detalle, espacio));
            });

            await Promise.all(promisesEspacio);
            resolve();
          } else if (detalle.Detalle.Nombre.includes("Evaluador Actual")) {
            const promisesDocente: any = []
            responseOpciones.forEach((evaluador: any) => {
              promisesDocente.push(this.getDocente(evaluador, detalle));
            });

            await Promise.all(promisesDocente);
            resolve()
          } else if (detalle.Detalle.Nombre.includes("Director Actual")) {
            this.request.get(environment.ACADEMICA_SERVICE, `docente_tg/${this.Trabajo.directorInterno.Usuario}`)
              .subscribe((docente) => {
                if (docente.docenteTg.docente) {
                  detalle.opciones.push({
                    NOMBRE: docente.docenteTg.docente[0].nombre,
                    bd: docente.bd = docente.docenteTg.docente[0].id
                  });
                }
                resolve();
              })
          } else if (detalle.Detalle.Nombre.includes("Codirector Actual")) {
            if (this.Trabajo.codirector) {
              this.request.get(environment.ACADEMICA_SERVICE, `docente_tg/${this.Trabajo.codirector.Usuario}`)
                .subscribe((docente) => {
                  if (docente.docenteTg.docente) {
                    detalle.opciones.push({
                      NOMBRE: docente.docenteTg.docente[0].nombre,
                      bd: docente.bd = docente.docenteTg.docente[0].id
                    });
                  }
                  resolve();
                })
            } else {
              // defer.reject("Sin codirector");
            }
          } else if (detalle.Detalle.Nombre.includes("Espacio Academico Nuevo")) {
            const promises: any[] = [];
            responseOpciones.forEach((espacio: any) => {
              var esta = false;
              this.espaciosElegidos.forEach((asignatura) => {
                if (espacio.CodigoAsignatura === asignatura.CodigoAsignatura) {
                  esta = true;
                }
              });
              if (!esta) {
                promises.push(this.getEspacio(detalle, espacio));
              }
            });

            await Promise.all(promises);
            resolve();
          } else if (detalle.Detalle.Nombre.includes("Nombre del anterior director externo")) {
            let temp = responseOpciones[0].Observaciones.split(" y dirigida por ");
            temp = temp[1].split(" con número de identificacion ");
            detalle.opciones.push({
              NOMBRE: temp[1] + " - " + temp[0],
              bd: temp[1]
            });
            resolve();
          } else if (detalle.Detalle.Nombre.includes("Nombre de evaluador(es) actuales")) {
            const promisasDocente: any[] = []
            responseOpciones.forEach((evaluador: any) => {
              promisasDocente.push(this.obtenerDocente(evaluador, detalle));
            });

            Promise.all(promisasDocente)
              .then((evaluadores) => {
                detalle.opciones.push({
                  NOMBRE: evaluadores.map((evaluador) => { return evaluador.nombre }).join(", "),
                  bd: evaluadores.map((evaluador) => { return evaluador.id }).join(",")
                });
              })
          } else if (detalle.Detalle.Nombre.includes("Objetivo Actual")) {
            detalle.opciones.push({
              NOMBRE: responseOpciones[0].Objetivo,
              bd: responseOpciones[0].Objetivo,
            });
            resolve();
          } else {
            detalle.opciones = responseOpciones;
            resolve();
          }
        })
    })
  }

  private docenteVinculado(docente: any): boolean {
    if (this.Trabajo != undefined) {
      if (this.Trabajo.directorInterno !== undefined) {
        if (this.Trabajo.directorInterno.Usuario == docente) {
          return true;
        }
      }
      if (this.Trabajo.directorExterno !== undefined) {
        if (this.Trabajo.directorInterno.Usuario == docente) {
          return true;
        }
      }
      if (this.Trabajo.evaluadores != undefined) {
        let esta = false;
        this.Trabajo.evaluadores.forEach((evaluador: any) => {
          if (evaluador.Usuario === docente) {
            esta = true;
          }
        });
        if (esta) {
          return true;
        }
      }
      if (this.Trabajo.codirector !== undefined) {
        if (this.Trabajo.codirector.Usuario == docente) {
          return true;
        }
      }
    }
    return false;
  }

  public cargaTiposSolicitudInicial() {
    if (this.modalidad) {
      this.tipoSolicitudId = 2;
      const payload = `query=TipoSolicitud.Id:${this.tipoSolicitudId},Modalidad.Id:${this.modalidad}&limit=1`;
      this.request.get(environment.POLUX_SERVICE, `modalidad_tipo_solicitud?${payload}`)
        .subscribe((responseModalidadTipoSolicitud) => {
          this.tiposSolicitud = responseModalidadTipoSolicitud;
        })
    } else {
      this.tipoSolicitudId = 0;
      this.tiposSolicitud = [];
    }
  }

  public validarFormularioSolicitud() {
    //

    this.detallesConDocumento = [];

    this.detalles.forEach((detalle) => {
      if (detalle.Detalle.TipoDetalle.Nombre === 'Numerico') {
        detalle.respuesta = detalle.respuestaNumerica + "";
      }
      if (detalle.Detalle.TipoDetalle.Nombre === 'Label') {
        detalle.respuesta = detalle.opciones[0].bd;
      }
      if (detalle.Detalle.TipoDetalle.Nombre === 'Documento') {
        detalle.respuesta = this.url;
        this.detallesConDocumento.push(detalle);
      }
      if (detalle.Detalle.TipoDetalle.Nombre === 'Directiva') {
        if (detalle.Detalle.Descripcion == 'solicitar-asignaturas') {
          detalle.respuesta = "JSON";
          this.estudiante.asignaturas_elegidas.forEach((asignatura: any) => {
            asignatura.$$hashKey = undefined;
            detalle.respuesta = detalle.respuesta + "-" + JSON.stringify(asignatura);
          });
          //detalle.respuesta = detalle.respuesta.substring(1);
        }
        if (detalle.Detalle.Descripcion == 'asignar-estudiantes') {
          detalle.respuesta = (!this.estudiantes.length) ? this.codigo : this.codigo + "," + this.estudiantes.toString();
        }
        if (detalle.Detalle.Descripcion == 'asignar-area') {
          detalle.respuesta = "JSON";
          this.estudiante.areas_elegidas.forEach((area: any) => {
            area.$$hashKey = undefined;
            detalle.respuesta = detalle.respuesta + "-" + JSON.stringify(area);
            //detalle.respuesta = detalle.respuesta +"," + (area.Id+"-"+area.Nombre);
          });
          //detalle.respuesta = detalle.respuesta.substring(1);
        }
      }
      if (detalle.Detalle.TipoDetalle.Nombre === 'Checkbox' || detalle.Detalle.TipoDetalle.Nombre === 'Radio') {

        if (detalle.bool === undefined) {
          detalle.bool = false;
        }
        if (detalle.bool) {
          detalle.respuesta = "SI";
        } else {
          detalle.respuesta = "NO";
        }

        //detalle.respuesta = detalle.bool.toString();
      }
    });
    //Realizar validaciones
    this.erroresFormulario = false;
    this.detalles.forEach((detalle) => {
      if (typeof (detalle.respuesta) !== "string") {
        // swal(
        //   'Validación del formulario',
        //   "Diligencie correctamente el formulario por favor.",
        //   'warning'
        // );
        //
        this.erroresFormulario = true;
      }
      if (detalle.respuesta === "" && detalle.Detalle.TipoDetalle.Nombre !== "Directiva" && detalle.Detalle.TipoDetalle.Nombre !== "Selector") {
        // swal(
        //   'Validación del formulario',
        //   "Debe completar todos los campos del formulario.",
        //   'warning'
        // );
        //
        this.erroresFormulario = true;
      }
      if (!this.estudiante.areas_elegidas.length && detalle.Detalle.Descripcion == 'asignar-area') {
        // swal(
        //   'Validación del formulario',
        //   "Debe ingresar al menos un área de conocimiento.",
        //   'warning'
        // );
        //
        this.erroresFormulario = true;
      }
      if (detalle.Detalle.Descripcion == 'solicitar-asignaturas' && !this.estudiante.minimoCreditos) {
        // swal(
        //   'Validación del formulario',
        //   "Debe cumplir con el minimo de creditos.",
        //   'warning'
        // );
        this.erroresFormulario = true;
      }
      if (detalle.Detalle.TipoDetalle.Nombre === "Selector" || detalle.Detalle.TipoDetalle.Nombre === "Lista") {
        var contiene = false;
        //
        detalle.opciones.forEach((opcion: any) => {
          if (opcion.bd == detalle.respuesta) {
            contiene = true;
          }
        });
        //Si el detalle es de docente co-director se puede dejar vacio
        if (detalle.Detalle.Id == 56 && (detalle.respuesta == "" || detalle.respuesta == "No solicita")) {
          detalle.respuesta = "No solicita";
          contiene = true;
        }
        if (!contiene) {
          // swal(
          //   'Validación del formulario',
          //   "Error ingrese una opcion valida.",
          //   'warning'
          // );
          this.erroresFormulario = true;
        }
      }
      if (detalle.Detalle.TipoDetalle.Nombre === 'Documento') {
        if (detalle.fileModel == null) {
          // swal(
          //   'Validación del formulario',
          //   "Error ingrese una opcion valida. (Documento)",
          //   'warning'
          // );
          this.erroresFormulario = true;
        }
      }
      if (detalle.Detalle.TipoDetalle.Nombre === 'Checkbox') {
        if (detalle.respuesta == "NO") {
          // swal(
          //   'Validación del formulario',
          //   "Debe aceptar los terminos y condiciones de la modalidad.",
          //   'warning'
          // );
          this.erroresFormulario = true;
        }
      }
    });
    if (!this.erroresFormulario) {
      //ctrl.cargarSolicitudes();
      this.cargarDocumentos();
    }
  }

  private cargarDocumentos() {
    if (this.detallesConDocumento.length) {
      // OK, the returned client is connected
      var fileTypeError = false;
      this.detallesConDocumento.forEach((detalle) => {
        var documento = detalle.fileModel;
        var tam = parseInt(detalle.Detalle.Descripcion.split(";")[1] + "000");
        if (documento.type !== "application/pdf" || documento.size > tam) {
          fileTypeError = true;
        }
      });

      if (!fileTypeError) {
        const archivos: any[] = []
        this.gestorDocumental.uploadFiles

        this.detallesConDocumento.forEach(file => {
          const data = {
            IdTipoDocumento: 5,
            nombre: file.Detalle.Nombre,
            metadatos: {
              NombreArchivo: file.Detalle.Nombre + ": " + this.codigo,
              Tipo: 'Archivo',
              Observaciones: 'Solicitud inicial',
            },
            descripcion: file.nombre,
          }
          archivos.push(data);
        })

        this.gestorDocumental.uploadFiles(archivos)
          .subscribe(() => this.postSolicitud())
        // swal(
        //   $translate.instant("ERROR.SUBIR_DOCUMENTO"),
        //   $translate.instant("VERIFICAR_DOCUMENTO"),
        //   'warning'
        // );
        // $scope.loadFormulario = false;

      } else {
      }
    } else {
      //agregar validación de error
      // $scope.loadFormulario = true;
      this.postSolicitud();
    }
  };

  private postSolicitud() {
    //var data_solicitud = [];
    var data_solicitud = {};
    var data_detalles: any = [];
    var data_usuarios = [];
    let data_respuesta: any = {};
    var fecha = new Date();

    if (this.trabajoGradoId) {
      data_solicitud = {
        Fecha: fecha,
        ModalidadTipoSolicitud: {
          Id: this.tipoSolicitudId
        },
        TrabajoGrado: {
          Id: this.trabajoGradoId
        },
        PeriodoAcademico: this.periodo
      };
    } else {
      if (this.tipoSolicitudId === 2) {
        this.tipoSolicitudId = 70;
      }
      /*if(ctrl.ModalidadTipoSolicitud === 13){
        ctrl.ModalidadTipoSolicitud = 71;
      }*/
      if (this.tipoSolicitudId === 16) {
        this.tipoSolicitudId = 72;
      } else if (this.tipoSolicitudId === 20) {
        this.tipoSolicitudId = 73;
      } else if (this.tipoSolicitudId === 28) {
        this.tipoSolicitudId = 74;
      } else if (this.tipoSolicitudId === 38) {
        this.tipoSolicitudId = 75;
      } else if (this.tipoSolicitudId === 46) {
        this.tipoSolicitudId = 76;
      } else if (this.tipoSolicitudId === 55) {
        this.tipoSolicitudId = 77;
      } else if (this.tipoSolicitudId === 82) {
        this.tipoSolicitudId = 83;
      }

      data_solicitud = {
        Fecha: fecha,
        ModalidadTipoSolicitud: {
          Id: this.tipoSolicitudId
        },
        PeriodoAcademico: this.periodo
      };
    }
    this.detalles.forEach((detalle) => {
      if (detalle.Id == this.posDocente) {
        this.docDocenteDir = detalle.respuesta;
      }
      data_detalles.push({
        Descripcion: detalle.respuesta,
        SolicitudTrabajoGrado: {
          Id: 0
        },
        DetalleTipoSolicitud: {
          Id: detalle.Id
        }
      });

    });
    //Se agrega solicitud al estudiante
    data_usuarios.push({
      Usuario: this.codigo,
      SolicitudTrabajoGrado: {
        Id: 0
      }
    });
    //estudiantes que ya pertenecian al tg
    //si es diferente a una solicitud de cancelación
    if (this.TipoSolicitud.TipoSolicitud !== undefined) {
      if (this.TipoSolicitud.TipoSolicitud.Id !== 3) {
        this.estudiantesTg.forEach((estudiante) => {
          if (estudiante !== undefined) {
            data_usuarios.push({
              Usuario: estudiante,
              SolicitudTrabajoGrado: {
                Id: 0
              }
            });
          }
        });
      }
    }
    //estudiantes agregados en la solicitud inicial
    this.estudiantes.forEach((estudiante) => {
      data_usuarios.push({
        Usuario: estudiante,
        SolicitudTrabajoGrado: {
          Id: 0
        }
      });
    });
    if (this.siModalidad && [3, 4, 5, 7, 8, 10, 12, 13, 15].includes(this.TipoSolicitud.TipoSolicitud.Id)) {
      //Respuesta de la solicitud
      data_respuesta = {
        Fecha: fecha,
        Justificacion: "Su solicitud esta pendiente a la revision del docente",
        EnteResponsable: 0,
        Usuario: 0,
        EstadoSolicitud: {
          Id: 19
        },
        SolicitudTrabajoGrado: {
          Id: 0
        },
        Activo: true
      }
      if (this.Trabajo.TrabajoGrado.Modalidad.CodigoAbreviacion != "EAPOS") {
        data_respuesta.EnteResponsable = this.Trabajo.directorInterno.Usuario
      } else {
        data_respuesta.EstadoSolicitud.Id = 1
      }
    } else {
      //Respuesta de la solicitud
      data_respuesta = {
        Fecha: fecha,
        Justificacion: "Su solicitud fue radicada",
        EnteResponsable: parseInt(this.docDocenteDir),
        Usuario: 0,
        EstadoSolicitud: {
          Id: 1
        },
        SolicitudTrabajoGrado: {
          Id: 0
        },
        Activo: true
      }
    }



    //se crea objeto con las solicitudes
    const solicitud = {
      Solicitud: data_solicitud,
      Respuesta: data_respuesta,
      DetallesSolicitud: data_detalles,
      UsuariosSolicitud: data_usuarios
    }
    this.request.post(environment.POLUX_SERVICE, 'tr_solicitud', solicitud)
      .subscribe((response) => {
        if (response[0] === "Success") {
          // swal(
          //   $translate.instant("FORMULARIO_SOLICITUD"),
          //   $translate.instant("SOLICITUD_REGISTRADA"),
          //   'success'
          // );
        } else {
          // swal(
          //   $translate.instant("FORMULARIO_SOLICITUD"),
          //   $translate.instant(response.data[1]),
          //   'warning'
          // );
        }
      });

  }

  public cargarFormularioSolicitud() {
    const parametrosDetalles = `query=ModalidadTipoSolicitud.TipoSolicitud.Id:${this.tipoSolicitudId},` +
      `ModalidadTipoSolicitud.Modalidad.Id:${this.modalidad}&limit=0&sortby=NumeroOrden&order=asc`;

    this.request.get(environment.POLUX_SERVICE, `detalle_tipo_solicitud?${parametrosDetalles}`)
      .subscribe(async (responseDetalles) => {
        if (responseDetalles.length) {
          this.detalles = responseDetalles.filter((detalle: any) => (detalle.Detalle.Id !== 69 && detalle.Detalle.Activo));
          //Se cargan opciones de los detalles
          const promises: any[] = []
          this.detalles.forEach((detalle) => {
            //Se internacionalizan variables y se crean labels de los detalles
            // detalle.label = $translate.instant(detalle.Detalle.Enunciado);
            detalle.label = detalle.Detalle.Enunciado;
            detalle.respuesta = '';
            detalle.fileModel = null;
            detalle.opciones = [];
            if (detalle.Detalle.Enunciado.includes('DOCENTE_AVALA_PROPUESTA') || detalle.Detalle.Enunciado.includes('SELECCIONE_DOCENTE_DESIGNADO_INVESTIGACION')) {
              this.posDocente = detalle.Id;
            }
            //Se evalua si el detalle necesita cargar datos
            if (!detalle.Detalle.Descripcion.includes('no_service') && detalle.Detalle.TipoDetalle.Id !== 8) {
              //Se separa el strig
              var parametrosServicio = detalle.Detalle.Descripcion.split(";");
              var sql = "";
              var parametrosConsulta: any[] = [];
              //servicio de academiaca
              if (parametrosServicio[0] === "polux") {
                promises.push(this.getOpcionesPolux(detalle, parametrosServicio, parametrosConsulta, sql));
              }
              if (parametrosServicio[0] === "academica") {
                promises.push(this.getOpcionesAcademica(detalle, parametrosServicio));
              }
              if (parametrosServicio[0] === "cidc") {
                // if (parametrosServicio[1] === "estructura_investigacion") {
                //   detalle.opciones = cidcRequest.obtenerEntidades();
                // }
                // if (parametrosServicio[1] === "docentes") {
                //   detalle.opciones = cidcRequest.obtenerDoncentes();
                // }
              }
              if (parametrosServicio[0] === "estatico") {
                parametrosConsulta = parametrosServicio[2].split(",");
                parametrosConsulta.forEach((opcion) => {
                  detalle.opciones.push({
                    "NOMBRE": opcion,
                    "bd": opcion
                  });
                });
              }
              if (parametrosServicio[0] === "mensaje") {
                detalle.opciones.push({
                  // "NOMBRE": $translate.instant(parametrosServicio[1]),
                  // "bd": $translate.instant(parametrosServicio[1])
                });
              }

              if (parametrosServicio[0] === "categorias-revista") {
                const payload = 'query=CodigoAbreviacion.in:A1_PLX|A2_PLX|B_PLX|C_PLX';
                this.request.get(environment.PARAMETROS_SERVICE, `parametro?${payload}`)
                  .subscribe((parametros) => {
                    parametros.forEach((parametro: any) => {
                      detalle.opciones.push({
                        "NOMBRE": parametro.Nombre,
                        "bd": parametro.Id
                      });
                    });
                  });
              }
            }
            // FILTRO SEGÚN MODALIDAD PARA EL CAMPO DE ACEPTACIÓN DE TERMINOS
            if (detalle.Detalle.CodigoAbreviacion == "ACTERM") {
              // PARA MODALIDAD DE MONOGRAFIA
              if (detalle.ModalidadTipoSolicitud.Modalidad.CodigoAbreviacion == "MONO") {
                // detalle.label = $translate.instant("TERMINOS.MONOGRAFIA")
                detalle.label = "TERMINOS.MONOGRAFIA"
              }
              // PARA MODALIDAD DE MONOGRAFIA
              if (detalle.ModalidadTipoSolicitud.Modalidad.CodigoAbreviacion == "PAS" || detalle.ModalidadTipoSolicitud.Modalidad.CodigoAbreviacion == "PASIN") {
                // detalle.label = $translate.instant("TERMINOS.PASANTIA")
                detalle.label = "TERMINOS.PASANTIA"
              }
              // PARA MODALIDAD DE EMPRENDIMIENTO
              if (detalle.ModalidadTipoSolicitud.Modalidad.CodigoAbreviacion == "PEMP") {
                // detalle.label = $translate.instant("TERMINOS.EMPRENDIMIENTO")
                detalle.label = "TERMINOS.EMPRENDIMIENTO"
              }
              // PARA MODALIDAD DE MATERIAS DE POSGRADO
              if (detalle.ModalidadTipoSolicitud.Modalidad.CodigoAbreviacion == "EAPOS") {
                // detalle.label = $translate.instant("TERMINOS.POSGRADO")
                detalle.label = "TERMINOS.POSGRADO"
              }
              // PARA MODALIDAD DE MATERIAS DE INVESTIGACION E INNOVACION
              if (detalle.ModalidadTipoSolicitud.Modalidad.CodigoAbreviacion == "INV") {
                // detalle.label = $translate.instant("TERMINOS.INVESTIGACION")
                detalle.label = "TERMINOS.INVESTIGACION"
              }
              // PARA MODALIDAD DE MATERIAS DE ARTICULO ACADEMICO
              if (detalle.ModalidadTipoSolicitud.Modalidad.CodigoAbreviacion == "PACAD") {
                // detalle.label = $translate.instant("TERMINOS.ARTICULO")
                detalle.label = "TERMINOS.ARTICULO"
              }
            }
          });

          await Promise.all(promises);
          //   $q.all(promises).then(function () {
          //     $scope.loadDetalles = false;
          //     ctrl.detallesCargados = true;
          //     if (ctrl.detalles == null) {
          //       ctrl.soliciudConDetalles = false;
          //     }
          //   })
          // });
        } else {
          // ctrl.mensajeError = $translate.instant("ERROR.SIN_DETALLE_SOLICITUD");
          // ctrl.errorParametros = true;
          // $scope.loadDetalles = false;
          // ctrl.detalles = [];
        }
      })
  }

  private cargarDetalles(inicial: boolean) {
    if (this.Docente == 1 && this.Docente_trabajos == false) {
      this.Docente_trabajos = true;
      // this.tipoSolicitud_Docente = tipoSolicitudSeleccionada;
    } else {
      this.siPuede = false;
      // this.detallesCargados = false;
      // this.estudiantes = [];
      // this.TipoSolicitud = tipoSolicitudSeleccionada;
      // var tipoSolicitud = tipoSolicitudSeleccionada.Id;
      // ctrl.ModalidadTipoSolicitud = tipoSolicitud;

      // if (tipoSolicitudSeleccionada != 2 && tipoSolicitudSeleccionada.TipoSolicitud.Id == 3) {
      //   // SE LLAMA A LA FUNCION PARA MIRAR SI TIENE UNA SOLICITUD
      //   ctrl.getCancelacionModalidad().then(function (cancelado) {
      //     ctrl.Cancelacion = cancelado;
      //     ctrl.mensajeCancelacion = $translate.instant("ERROR.CANCELACIONES");
      //   });
      // } else {
      //   ctrl.Cancelacion = false;
      // }

      //SE LLAMA LA FUNCIÓN POR CADA UNA DE LAS NOVEDADES
      this.getNotaTrabajoGrado()
        .then((resultado) => {
          this.Nota = resultado;
          // this.mensajeCalificado = $translate.instant("ERROR.CALIFICADO");
        });

      this.verificarRequisitos()
        .then(() => {
          // this.soliciudConDetalles = true;
          this.detalles = [];
          var tipo_solicitud = 2;
          if (this.Docente == 1) {
            tipo_solicitud = 6;
          }
          var promises: any[] = []
          let parametrosDetalles = '';
          if (this.modalidad === 0) {
            parametrosDetalles = `query=ModalidadTipoSolicitud:${tipo_solicitud}&limit=0&sortby=NumeroOrden&order=asc`;
          } else {
            parametrosDetalles = `query=Activo:true,ModalidadTipoSolicitud.TipoSolicitud.Id:${tipo_solicitud}` +
              `,ModalidadTipoSolicitud.Modalidad.Id:${this.modalidad}&limit=0&sortby=NumeroOrden&order=asc`;
            promises.push(this.getModalidadTipoSolicitud());
          }

          this.request.get(environment.POLUX_SERVICE, `detalle_tipo_solicitud?${parametrosDetalles}`)
            .subscribe(async (responseDetalles) => {
              if (responseDetalles.length) {
                this.detalles = responseDetalles.filter((detalle: any) => (detalle.Detalle.Id !== 69 && detalle.Detalle.Activo));
                //Se cargan opciones de los detalles
                this.detalles.forEach((detalle) => {
                  //Se internacionalizan variables y se crean labels de los detalles
                  // detalle.label = $translate.instant(detalle.Detalle.Enunciado);
                  detalle.label = detalle.Detalle.Enunciado;
                  detalle.respuesta = '';
                  detalle.fileModel = null;
                  detalle.opciones = [];
                  if (detalle.Detalle.Enunciado.includes('DOCENTE_AVALA_PROPUESTA') || detalle.Detalle.Enunciado.includes('SELECCIONE_DOCENTE_DESIGNADO_INVESTIGACION')) {
                    this.posDocente = detalle.Id;
                  }
                  //Se evalua si el detalle necesita cargar datos
                  if (!detalle.Detalle.Descripcion.includes('no_service') && detalle.Detalle.TipoDetalle.Id !== 8) {
                    //Se separa el strig
                    var parametrosServicio = detalle.Detalle.Descripcion.split(";");
                    var sql = "";
                    var parametrosConsulta: any[] = [];
                    //servicio de academiaca
                    if (parametrosServicio[0] === "polux") {
                      promises.push(this.getOpcionesPolux(detalle, parametrosServicio, parametrosConsulta, sql));
                    }
                    if (parametrosServicio[0] === "academica") {
                      promises.push(this.getOpcionesAcademica(detalle, parametrosServicio));
                    }
                    if (parametrosServicio[0] === "cidc") {
                      // if (parametrosServicio[1] === "estructura_investigacion") {
                      //   detalle.opciones = cidcRequest.obtenerEntidades();
                      // }
                      // if (parametrosServicio[1] === "docentes") {
                      //   detalle.opciones = cidcRequest.obtenerDoncentes();
                      // }
                    }
                    if (parametrosServicio[0] === "estatico") {
                      parametrosConsulta = parametrosServicio[2].split(",");
                      parametrosConsulta.forEach((opcion) => {
                        detalle.opciones.push({
                          "NOMBRE": opcion,
                          "bd": opcion
                        });
                      });
                    }
                    if (parametrosServicio[0] === "mensaje") {
                      detalle.opciones.push({
                        // "NOMBRE": $translate.instant(parametrosServicio[1]),
                        // "bd": $translate.instant(parametrosServicio[1])
                      });
                    }

                    if (parametrosServicio[0] === "categorias-revista") {
                      const payload = 'query=CodigoAbreviacion.in:A1_PLX|A2_PLX|B_PLX|C_PLX';
                      this.request.get(environment.PARAMETROS_SERVICE, `parametro?${payload}`)
                        .subscribe((parametros) => {
                          parametros.forEach((parametro: any) => {
                            detalle.opciones.push({
                              "NOMBRE": parametro.Nombre,
                              "bd": parametro.Id
                            });
                          });
                        });
                    }
                  }
                  // FILTRO SEGÚN MODALIDAD PARA EL CAMPO DE ACEPTACIÓN DE TERMINOS
                  if (detalle.Detalle.CodigoAbreviacion == "ACTERM") {
                    // PARA MODALIDAD DE MONOGRAFIA
                    if (detalle.ModalidadTipoSolicitud.Modalidad.CodigoAbreviacion == "MONO") {
                      // detalle.label = $translate.instant("TERMINOS.MONOGRAFIA")
                      detalle.label = 'TERMINOS.MONOGRAFIA'
                    }
                    // PARA MODALIDAD DE MONOGRAFIA
                    if (detalle.ModalidadTipoSolicitud.Modalidad.CodigoAbreviacion == "PAS" || detalle.ModalidadTipoSolicitud.Modalidad.CodigoAbreviacion == "PASIN") {
                      // detalle.label = $translate.instant("TERMINOS.PASANTIA")
                      detalle.label = "TERMINOS.PASANTIA"
                    }
                    // PARA MODALIDAD DE EMPRENDIMIENTO
                    if (detalle.ModalidadTipoSolicitud.Modalidad.CodigoAbreviacion == "PEMP") {
                      // detalle.label = $translate.instant("TERMINOS.EMPRENDIMIENTO")
                      detalle.label = "TERMINOS.EMPRENDIMIENTO"
                    }
                    // PARA MODALIDAD DE MATERIAS DE POSGRADO
                    if (detalle.ModalidadTipoSolicitud.Modalidad.CodigoAbreviacion == "EAPOS") {
                      // detalle.label = $translate.instant("TERMINOS.POSGRADO")
                      detalle.label = "TERMINOS.POSGRADO"
                    }
                    // PARA MODALIDAD DE MATERIAS DE INVESTIGACION E INNOVACION
                    if (detalle.ModalidadTipoSolicitud.Modalidad.CodigoAbreviacion == "INV") {
                      // detalle.label = $translate.instant("TERMINOS.INVESTIGACION")
                      detalle.label = "TERMINOS.INVESTIGACION"
                    }
                    // PARA MODALIDAD DE MATERIAS DE ARTICULO ACADEMICO
                    if (detalle.ModalidadTipoSolicitud.Modalidad.CodigoAbreviacion == "PACAD") {
                      // detalle.label = $translate.instant("TERMINOS.ARTICULO")
                      detalle.label = "TERMINOS.ARTICULO"
                    }
                  }
                });

                await Promise.all(promises);
                //   $q.all(promises).then(function () {
                //     $scope.loadDetalles = false;
                //     ctrl.detallesCargados = true;
                //     if (ctrl.detalles == null) {
                //       ctrl.soliciudConDetalles = false;
                //     }
                //   })
                // });
              } else {
                // ctrl.mensajeError = $translate.instant("ERROR.SIN_DETALLE_SOLICITUD");
                // ctrl.errorParametros = true;
                // $scope.loadDetalles = false;
                // ctrl.detalles = [];
              }
            })
          //}else {
          //$scope.loadDetalles = false;
          //ctrl.siPuede=true;
          //ctrl.detalles = [];
          //}
        })
    }
  };

  displayOption(item: any) {
    return item ? item.NOMBRE : '';
  }

  private getOpcionesAcademica(detalle: any, parametrosServicio: string[]): Promise<void> {
    return new Promise((resolve) => {
      if (parametrosServicio[1] === "docente") {
        this.request.get(environment.ACADEMICA_SERVICE, `docentes_tg`)
          .subscribe((response) => {
            if (response.docentesTg.docente) {
              var docentes = response.docentesTg.docente;
              const vinculados: any[] = [];
              docentes.forEach((docente: any) => {
                if (this.docenteVinculado(docente.id)) {
                  vinculados.push(docente);
                } else {
                  docente.bd = docente.id;
                }
              });
              vinculados.forEach((docente) => {
                const index = docentes.indexOf(docente);
                docentes.splice(index, 1);
              });
              detalle.opciones = docentes;
              resolve();
            }
          });
      } else {
        resolve();
      }
    })
  }

  private getEspacioAnterior(detalle: any, espacio: any): Promise<void> {
    return new Promise((resolve) => {
      const payload = `${espacio.EspaciosAcademicosElegibles.CodigoAsignatura}/${espacio.EspaciosAcademicosElegibles.CarreraElegible.CodigoPensum}`;
      this.request.get(environment.ACADEMICA_SERVICE, `asignatura_pensum/${payload}`)
        .subscribe((asignatura) => {
          detalle.asignatura = asignatura.asignatura.datosAsignatura[0];
          detalle.opciones.push({
            NOMBRE: asignatura.asignatura.datosAsignatura[0].nombre + ", creditos: " + asignatura.asignatura.datosAsignatura[0].creditos,
            bd: espacio.EspaciosAcademicosElegibles.CodigoAsignatura + '-' + asignatura.asignatura.datosAsignatura[0].nombre,
          });
          resolve();
        })
    })
  }

  private getDocente(evaluador: any, detalle: any): Promise<void> {
    return new Promise((resolve) => {
      this.request.get(environment.ACADEMICA_SERVICE, `docente_tg/${evaluador.Usuario}`)
        .subscribe((docente) => {
          if (docente.docenteTg.docente) {
            detalle.opciones.push({
              NOMBRE: docente.docenteTg.docente[0].nombre,
              bd: docente.bd = docente.docenteTg.docente[0].id
            });
          }
          resolve();
        })
    })
  }

  private getEspacio(detalle: any, espacio: any): Promise<void> {
    return new Promise((resolve) => {
      this.request.get(environment.ACADEMICA_SERVICE, `asignatura_pensum/${espacio.CodigoAsignatura}/${espacio.CarreraElegible.CodigoPensum}`)
        .subscribe((asignatura) => {
          detalle.asignatura = asignatura.asignatura.datosAsignatura[0];
          detalle.opciones.push({
            NOMBRE: asignatura.asignatura.datosAsignatura[0].nombre + ', creditos: ' + asignatura.asignatura.datosAsignatura[0].creditos,
            bd: espacio.CodigoAsignatura + '-' + asignatura.asignatura.datosAsignatura[0].nombre
          });
          resolve();
        })
    })
  }

  private obtenerDocente(evaluador: any, detalle: any): Promise<any> {
    return new Promise((resolve) => {
      this.request.get(environment.ACADEMICA_SERVICE, `docente_tg/${evaluador.Usuario}`)
        .subscribe((docente) => {
          const evaluador = {
            nombre: '',
            id: '',
          }
          if (docente.docenteTg.docente) {
            evaluador.nombre = docente.docenteTg.docente[0].nombre;
            evaluador.id = docente.docenteTg.docente[0].id;
          }
          resolve(evaluador);
        })
    })
  }

}
