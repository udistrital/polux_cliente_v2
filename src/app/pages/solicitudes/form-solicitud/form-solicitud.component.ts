import { Component, OnInit } from '@angular/core';
import { AbstractControlOptions, FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { environment } from 'src/environments/environment';
import { RequestManager } from 'src/app/core/manager/request.service';
import * as moment from 'moment';
import { UserService } from '../../services/userService';

@Component({
  selector: 'app-form-solicitud',
  templateUrl: './form-solicitud.component.html',
  styleUrls: ['./form-solicitud.component.scss']
})
export class FormSolicitudComponent implements OnInit {
  formSolicitud: FormGroup = this.initForm();

  modalidades: any[] = [
    {
      Id: 1,
      Nombre: 'Pasantía',
    },
    {
      Id: 2,
      Nombre: 'Monografía',
    },
  ];
  areasConocimiento: any[] = [{
    Id: 1,
    Nombre: 'Ingeniería',
  },
  {
    Id: 3,
    Nombre: 'Ciencias',
  },
  ];

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
  // * @property {Array} estudiantes Estudiantes que se agregan a la solicitud inicial.
  Trabajo: any = {};// Datos del trabajo de grado que cursa el estudiante que esta realizando la solicitud.
  siModalidad = false; // Indicador que maneja la habilitación de una modalidad
  modalidadSelect = false;// Indicador que maneja la selección de una modalidad
  tipoSolicitudId = 0;
  // * @property {Boolean} solicitudConDetalles Indicador que maneja el contenido de los detalles dentro de una solicitud
  // * @property {Boolean} restringirModalidadesProfundizacion Indicador que maneja la restricción de modalidades para crear solicitud y solo habilita la modalidad de profundización
  // * @property {Array} detallesConDocumento Colección que maneja los detalles con documento de una solicitud
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
  // * @property {Object} TipoSolicitud Objeto que carga la información del tipo de solicitud seleccionada
  modalidadTipoSolicitudId = 0; // Valor que carga el identificador del tipo de solicitud asociada a una modalidad
  // * @property {Boolean} erroresFormulario Indicador que maneja la aparición de errores durante el diligenciamiento del formulario
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
  // * @property {Number} docDocenteDir Documento del docente director
  // * @property {Number} contador contador para no repetir valores en la modalidad de pasantia
  // * @property {Boolean} Nota flag que indica si el trabajo de grado ya está calificado

  Docente_solicitudes: any[] = [];
  loadDocenteSolicitud = false;
  Docente_trabajos = false;
  tipoSolicitud_Docente = 0;
  showForm = false;

  constructor(
    private fb: FormBuilder,
    private request: RequestManager,
    private userService: UserService
  ) {
    this.codigo = this.userService.user.userService?.Codigo;
  }

  ngOnInit(): void {
    this.form();
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

  form() {
    this.formSolicitud = this.fb.group({
      modalidad: this.fb.control({
        value: '',
        disabled: false,
      }),
      titulo: this.fb.control({
        value: '',
        disabled: false,
      }),
      objetivos: this.fb.control({
        value: '',
        disabled: false,
      }),
      tipo: this.fb.control({
        value: '',
        disabled: false,
      }),
      soporte: this.fb.control({
        value: '',
        disabled: false,
      }),
      areas: this.fb.control({
        value: '',
        disabled: false,
      }),
      elementos: this.fb.array([]),
    } as AbstractControlOptions);
    // , { validators: this.checkValidness }
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

  modalidad = 2;
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
                      if (evaluacion_trabajo_grado_results[i].data[0].Nota >= 0) {
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
        if (this.tieneProrrogas) {
          this.tiposSolicitud = responseTiposSolicitudes.filter((s: any) => s.TipoSolicitud.Id !== 7)
        } else {
          if (this.Docente === 1) {
            this.tiposSolicitud = responseTiposSolicitudes.filter((s: any) => s.TipoSolicitud.Id === 6)
          } else {
            this.tiposSolicitud = responseTiposSolicitudes.filter((s: any) => s.TipoSolicitud.Id !== 6)
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
            const areasSnies = [
              { Id: 1, estado: true, Nombre: 'AGRONOMIA VETERINARIA Y AFINES' },
              { Id: 2, estado: true, Nombre: 'BELLAS ARTES' },
              { Id: 3, estado: true, Nombre: 'CIENCIAS DE LA EDUCACION' },
              { Id: 4, estado: true, Nombre: 'CIENCIAS DE LA SALUD' },
              { Id: 5, estado: true, Nombre: 'CIENCIAS SOCIALES Y HUMANAS' },
              { Id: 6, estado: true, Nombre: 'ECONOMIA, ADMINISTRACION, CONTADURIA Y AFINES' },
              { Id: 7, estado: true, Nombre: 'INGENIERIA, ARQUITECTURA, URBANISMO Y AFINES' },
              { Id: 8, estado: true, Nombre: 'MATEMATICAS Y CIENCIAS NATURALES' },
              { Id: 9, estado: true, Nombre: 'SIN CLASIFICAR' }
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
              "NOMBRE": responseOpciones[0].Titulo,
              "bd": responseOpciones[0].Titulo,
            });
            resolve();
          } else if (detalle.Detalle.Nombre.includes("Actual resumen de la propuesta")) {
            detalle.opciones.push({
              "NOMBRE": responseOpciones[0].DocumentoEscrito.Resumen,
              "bd": responseOpciones[0].DocumentoEscrito.Resumen
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
              "NOMBRE": areasString.substring(2),
              "bd": areasString.substring(2)
            });
            resolve();
          } else if (detalle.Detalle.Nombre.includes("Nombre Empresa")) {
            responseOpciones.forEach((empresa: any) => {
              detalle.opciones.push({
                "NOMBRE": empresa.Identificacion + "",
                "bd": empresa.Identificacion + "",
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
                if (docente.data.docenteTg.docente) {
                  detalle.opciones.push({
                    NOMBRE: docente.data.docenteTg.docente[0].nombre,
                    bd: docente.bd = docente.data.docenteTg.docente[0].id
                  });
                }
                resolve();
              })
          } else if (detalle.Detalle.Nombre.includes("Codirector Actual")) {
            if (this.Trabajo.codirector) {
              this.request.get(environment.ACADEMICA_SERVICE, `docente_tg/${this.Trabajo.codirector.Usuario}`)
                .subscribe((docente) => {
                  if (docente.data.docenteTg.docente) {
                    detalle.opciones.push({
                      NOMBRE: docente.data.docenteTg.docente[0].nombre,
                      bd: docente.bd = docente.data.docenteTg.docente[0].id
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
              NOMBRE: responseOpciones.data[0].Objetivo,
              bd: responseOpciones.data[0].Objetivo,
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

  public cargarDetalles() {
  }

  private getOpcionesAcademica(detalle: any, parametrosServicio: string[]): Promise<void> {
    return new Promise((resolve) => {
      if (parametrosServicio[1] === "docente") {
        this.request.get(environment.ACADEMICA_SERVICE, `docentes_tg`)
          .subscribe((response) => {
            if (response.data.docentesTg.docente) {
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
