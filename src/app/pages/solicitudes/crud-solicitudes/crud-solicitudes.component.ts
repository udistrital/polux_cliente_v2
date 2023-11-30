import { Component, Input, OnInit } from '@angular/core';
import * as moment from 'moment';
import { RequestManager } from 'src/app/core/manager/request.service';
import { Modalidad } from 'src/app/shared/models/modalidad.model';
import { ModalidadTipoSolicitud } from 'src/app/shared/models/modalidadTipoSolicitud.model';
import { TipoSolicitud } from 'src/app/shared/models/tipoSolicitud.model';
import { environment } from 'src/environments/environment';
import { GestorDocumentalService } from '../../services/gestorDocumentalService';
import { DetalleTipoSolicitudForm } from 'src/app/shared/models/detalleTipoSolicitud.model';
import { UserService } from '../../services/userService';

@Component({
  selector: 'app-crud-solicitudes',
  templateUrl: './crud-solicitudes.component.html',
  styleUrls: ['./crud-solicitudes.component.scss']
})
export class CrudSolicitudesComponent implements OnInit {
  @Input() modo = 'create' || 'update';
  @Input() solicitudId = 0;

  modalidades: Modalidad[] = [];
  tiposSolicitud: ModalidadTipoSolicitud[] = [];

  titulo = 'Registrar Solicitud' || 'Revisar Solicitud';
  tipoSolicitudSeleccionada: ModalidadTipoSolicitud = new ModalidadTipoSolicitud();
  modalidadId = 0;
  siModalidad = false;
  periodoActual: any = {};
  periodoAnterior: any = {};
  periodoSiguiente: any = {};
  Trabajo: any = {};
  codigo = '';
  trabajoGradoId = 0;
  trabajoGrado: any = {};
  periodo = '';
  estudiante: any = {};
  fechaActual = '';
  fechaInicio = '';
  siPuede = false;
  fechaFin = '';
  estudiantesTg: any[] = []; // Estudiantes asociados al tranajo de grado.
  tieneProrrogas = false;
  trabajo_grado_completo: any = {}; // Objeto que carga la información del trabajo de grado en curso
  carreraElegida: any = {};// Objeto que carga la información sobre la carrera elegida por el estudiante
  estudiantes: any[] = []; // Estudiantes que se agregan a la solicitud inicial.
  docDocenteDir = ''; // Documento del docente director
  Nota = false; // flag que indica si el trabajo de grado ya está calificado

  mostrarFormulario = false;

  constructor(
    private request: RequestManager,
    private userService: UserService,
    private gestorDocumental: GestorDocumentalService,
  ) {
    this.codigo = this.userService.user.userService?.Codigo;
  }

  ngOnInit(): void {
    if (this.modo === 'create' && this.solicitudId === 0) {
      this.titulo = 'Registrar Solicitud';
      this.verificarSiPuedeSolicitar()
        .then(async puedeSolicitar => {
          if (puedeSolicitar) {
            await Promise.all([
              this.getTrabajoGrado(),
              this.getPeriodoActual(),
              this.getPeriodoAnterior(),
              this.getPeriodoSiguiente(),
            ]);
            this.obtenerDatosEstudiante();
          } // else {
          // }
        })
    } else if (this.modo === 'update' && this.solicitudId > 0) {
      this.titulo = 'Revisar Solicitud';
    }

  }

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

  private getModalidades() {
    this.request.get(environment.POLUX_SERVICE, `modalidad?limit=-1`)
      .subscribe((responseModalidad) => {
        if (responseModalidad.length) {
          this.modalidades = responseModalidad;
        } else {
          // ctrl.mensajeErrorCarga = $translate.instant('ERROR.SIN_MODALIDADES');
          // defer.reject('No hay modalidades registradas');
        }
      })
  }

  public cargaTiposSolicitudInicial() {
    if (this.modalidadId > 0) {
      this.tipoSolicitudSeleccionada = <ModalidadTipoSolicitud>{ TipoSolicitud: <TipoSolicitud>{ Id: 2 } };
      const payload = `query=TipoSolicitud.Id:${this.tipoSolicitudSeleccionada.TipoSolicitud.Id},Modalidad.Id:${this.modalidadId}&limit=1`;
      this.request.get(environment.POLUX_SERVICE, `modalidad_tipo_solicitud?${payload}`)
        .subscribe((responseModalidadTipoSolicitud) => {
          if (responseModalidadTipoSolicitud.length) {
            this.tipoSolicitudSeleccionada = responseModalidadTipoSolicitud[0];
            this.mostrarFormulario = true;
          } else {
            // error no hay registrada el tipo solicitud para la modalidad
          }
        })
    } else {
      this.tipoSolicitudSeleccionada = new ModalidadTipoSolicitud();
      this.tiposSolicitud = [];
    }
  }

  public mostrarForm() {
    this.mostrarFormulario = !!this.tipoSolicitudSeleccionada;
  }

  public eventVolverForm() {
    this.tipoSolicitudSeleccionada = new ModalidadTipoSolicitud();
    this.mostrarFormulario = false;
  }

  private cargarTipoSolicitud(): void {
    this.tiposSolicitud = [];
    const payload = `query=Modalidad:${this.modalidadId},TipoSolicitud.Activo:true&limit=0`;
    this.request.get(environment.POLUX_SERVICE, `modalidad_tipo_solicitud?${payload}`)
      .subscribe((responseTiposSolicitudes) => {
        responseTiposSolicitudes = responseTiposSolicitudes
          .filter((s: any) => s.TipoSolicitud.Id !== 2 && s.TipoSolicitud.Id !== 11);
        if (this.tieneProrrogas) {
          this.tiposSolicitud = responseTiposSolicitudes.filter((s: any) => s.TipoSolicitud.Id !== 7);
        } else {
          this.tiposSolicitud = responseTiposSolicitudes.filter((s: any) => s.TipoSolicitud.Id !== 6);
        }
      });
  }

  private getTrabajoGrado(): Promise<void> {
    return new Promise((resolve) => {
      const payload = `query=Estudiante:${this.codigo},EstadoEstudianteTrabajoGrado:1&limit=1`;
      this.request.get(environment.POLUX_SERVICE, `estudiante_trabajo_grado?${payload}`)
        .subscribe(async (responseTrabajoEstudiante) => {
          const promises = [];
          if (responseTrabajoEstudiante.length) {
            this.Trabajo = responseTrabajoEstudiante[0];
            this.modalidadId = responseTrabajoEstudiante[0].TrabajoGrado.Modalidad.Id;
            this.trabajo_grado_completo = responseTrabajoEstudiante[0].TrabajoGrado;
            this.trabajoGradoId = responseTrabajoEstudiante[0].TrabajoGrado.Id;
            this.trabajoGrado = responseTrabajoEstudiante[0].TrabajoGrado;
            this.siModalidad = true;
            // Buscar de autores del tg
            this.getEstudiantesTg(this.trabajoGradoId);
            this.cargarTipoSolicitud();
            this.getVinculadosTg(this.trabajoGradoId);
            if (this.modalidadId === 2 || this.modalidadId === 3) {
              promises.push(this.getEspaciosInscritos(this.trabajoGradoId));
            }
          } else {
            promises.push(this.getModalidades());
          }

          await Promise.all(promises);
          resolve();
        })
    })
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
            // ctrl.mensajeErrorCarga = $translate.instant('ERROR.SIN_PERIODO');
            // defer.reject('sin periodo');
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
            // ctrl.mensajeErrorCarga = $translate.instant('ERROR.SIN_PERIODO');
            // defer.reject('sin periodo');
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
            // ctrl.mensajeErrorCarga = $translate.instant('ERROR.SIN_PERIODO');
            // defer.reject('sin periodo');
          }
          resolve();
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
            Modalidad: this.modalidadId,
            Tipo: 'POSGRADO',
            PorcentajeCursado: response2.estudianteCollection.datosEstudiante[0].porcentaje_cursado,
            // 'PorcentajeCursado': response2.data.estudianteCollection.datosEstudiante[0].creditosCollection.datosCreditos[0].porcentaje.porcentaje_cursado[0].porcentaje_cursado,
            Promedio: response2.estudianteCollection.datosEstudiante[0].promedio,
            Rendimiento: response2.estudianteCollection.datosEstudiante[0].rendimiento,
            Estado: response2.estudianteCollection.datosEstudiante[0].estado,
            Nivel: response2.estudianteCollection.datosEstudiante[0].nivel,
            TipoCarrera: response2.estudianteCollection.datosEstudiante[0].nombre_tipo_carrera,
            Carrera: response2.estudianteCollection.datosEstudiante[0].carrera
          };

          if (this.estudiante.Nombre === undefined) {
            // ctrl.mensajeErrorCarga = $translate.instant('ERROR.CARGAR_DATOS_ESTUDIANTE');
            // defer.reject('datos del estudiante invalidos');
          } else {
            this.estudiante.asignaturas_elegidas = [];
            this.estudiante.areas_elegidas = [];
            this.estudiante.minimoCreditos = false;
            // defer.resolve(ctrl.estudiante);
          }
          // this.cargarDetalles(false);
        } else {
          // ctrl.mensajeErrorCarga = $translate.instant('ERROR.ESTUDIANTE_NO_ENCONTRADO');
          // defer.reject('no se encuentran datos estudiante');
        }
      })
    // .catch(function (error) {
    //   ctrl.mensajeErrorCarga = $translate.instant('ERROR.CARGAR_DATOS_ESTUDIANTE');
    //   defer.reject(error);
    // });
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

  private verificarRequisitosModalidad(): void {
    if (!this.estudiante.Modalidad) {
      this.estudiante.Modalidad = this.modalidadId;
    }
    this.request.post(
      environment.POLUX_MID_SERVICE, `verificarRequisitos/Registrar`, this.estudiante)
      .subscribe((requisitos: any) => {
        this.estudiante.Modalidad = null;
        if (requisitos.data.RequisitosModalidades) {
          return true;
        } else {
          return false;
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
        // ctrl.mensajeError = $translate.instant('ERROR.ESTADO_TRABAJO_GRADO_NO_PERMITE', {
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
        // ctrl.mensajeError = $translate.instant('ERROR.ESTADO_TRABAJO_GRADO_NO_PERMITE', {
        //   estado_tg: ctrl.trabajoGrado.EstadoTrabajoGrado.Nombre,
        //   tipoSolicitud: tipoSolicitud.TipoSolicitud.Nombre,
        // });
        return false;
      }
    } else {
      return true;
    }
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
              this.tieneProrrogas = !!responseProrroga.length;
            });
        }
      });
  }

  private getNotaTrabajoGrado(): Promise<boolean> {
    return new Promise((resolve) => {
      const payload = `query=Estudiante:${this.codigo},EstadoEstudianteTrabajoGrado:1&limit=1`;
      this.request.get(environment.POLUX_SERVICE, `estudiante_trabajo_grado?${payload}`)
        .subscribe((estudiante_trabajo_grado) => {
          const payload = `query=TrabajoGrado:${estudiante_trabajo_grado[0].TrabajoGrado.Id}&limit=0`;
          this.request.get(environment.POLUX_SERVICE, `vinculacion_trabajo_grado?${payload}`)

            .subscribe((vinculacion_trabajo_grado) => {
              for (let i = 0; i < vinculacion_trabajo_grado.length; i++) {
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

  public postDocumentos(detalles: DetalleTipoSolicitudForm[]) {
    const detallesConDocumento = detalles.filter(detalle => detalle.Detalle.TipoDetalle.Nombre === 'Documento');
    if (detallesConDocumento.length) {
      let errorDocumento = false;
      for (let detalleConDocumento of detallesConDocumento) {
        const documento = detalleConDocumento.fileModel;
        const size = parseInt(detalleConDocumento.Detalle.Descripcion.split(';')[1] + '000');
        if (documento.type !== 'application/pdf' || documento.size > size) {
          errorDocumento = true;
          break;
        }
      }

      if (!errorDocumento) {
        const archivos: any[] = [];
        detallesConDocumento.forEach(file => {
          const data = {
            IdTipoDocumento: 5,
            nombre: file.Detalle.Nombre,
            metadatos: {
              NombreArchivo: file.Detalle.Nombre + ': ' + this.codigo,
              Tipo: 'Archivo',
              Observaciones: 'Solicitud inicial',
            },
            descripcion: file.Detalle.Nombre,
          }
          archivos.push(data);
        })

        this.gestorDocumental.uploadFiles(archivos)
          .subscribe(() => this.postSolicitud([]))

      } else {
        // Alerta error archivo
      }
    } else {
      this.postSolicitud([]);
    }
  };

  private postSolicitud(detalles: DetalleTipoSolicitudForm[]) {
    //var data_solicitud = [];
    var data_solicitud = {};
    var data_detalles: any = [];
    var data_usuarios = [];
    let dataRespuesta: any = {};
    var fecha = new Date();

    if (this.trabajoGradoId) {
      data_solicitud = {
        Fecha: fecha,
        ModalidadTipoSolicitud: {
          Id: this.tipoSolicitudSeleccionada.Id
        },
        TrabajoGrado: {
          Id: this.trabajoGradoId
        },
        PeriodoAcademico: this.periodo
      };
    } else {
      if (this.tipoSolicitudSeleccionada.Id === 2) {
        this.tipoSolicitudSeleccionada.Id = 70;
      }
      if (this.tipoSolicitudSeleccionada.Id === 16) {
        this.tipoSolicitudSeleccionada.Id = 72;
      } else if (this.tipoSolicitudSeleccionada.Id === 20) {
        this.tipoSolicitudSeleccionada.Id = 73;
      } else if (this.tipoSolicitudSeleccionada.Id === 28) {
        this.tipoSolicitudSeleccionada.Id = 74;
      } else if (this.tipoSolicitudSeleccionada.Id === 38) {
        this.tipoSolicitudSeleccionada.Id = 75;
      } else if (this.tipoSolicitudSeleccionada.Id === 46) {
        this.tipoSolicitudSeleccionada.Id = 76;
      } else if (this.tipoSolicitudSeleccionada.Id === 55) {
        this.tipoSolicitudSeleccionada.Id = 77;
      } else if (this.tipoSolicitudSeleccionada.Id === 82) {
        this.tipoSolicitudSeleccionada.Id = 83;
      }

      data_solicitud = {
        Fecha: fecha,
        ModalidadTipoSolicitud: {
          Id: this.tipoSolicitudSeleccionada.Id
        },
        PeriodoAcademico: this.periodo
      };
    }
    detalles.forEach((detalle) => {
      if (detalle.Detalle.Enunciado.includes('DOCENTE_AVALA_PROPUESTA') || detalle.Detalle.Enunciado.includes('SELECCIONE_DOCENTE_DESIGNADO_INVESTIGACION')) {
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
    // estudiantes que ya pertenecian al tg
    // si es diferente a una solicitud de cancelación
    if (this.tipoSolicitudSeleccionada.TipoSolicitud !== undefined) {
      if (this.tipoSolicitudSeleccionada.TipoSolicitud.Id !== 3) {
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

    // estudiantes agregados en la solicitud inicial
    this.estudiantes.forEach((estudiante) => {
      data_usuarios.push({
        Usuario: estudiante,
        SolicitudTrabajoGrado: {
          Id: 0
        }
      });
    });

    if (this.siModalidad && [3, 4, 5, 7, 8, 10, 12, 13, 15].includes(this.tipoSolicitudSeleccionada.TipoSolicitud.Id)) {
      //Respuesta de la solicitud
      dataRespuesta = {
        Fecha: fecha,
        Justificacion: 'Su solicitud esta pendiente a la revision del docente',
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
      if (this.Trabajo.TrabajoGrado.Modalidad.CodigoAbreviacion != 'EAPOS') {
        dataRespuesta.EnteResponsable = this.Trabajo.directorInterno.Usuario
      } else {
        dataRespuesta.EstadoSolicitud.Id = 1
      }
    } else {
      // Respuesta de la solicitud
      dataRespuesta = {
        Fecha: fecha,
        Justificacion: 'Su solicitud fue radicada',
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

    // Se crea objeto con las solicitudes
    const solicitud = {
      Solicitud: data_solicitud,
      Respuesta: dataRespuesta,
      DetallesSolicitud: data_detalles,
      UsuariosSolicitud: data_usuarios
    }
    this.request.post(environment.POLUX_SERVICE, 'tr_solicitud', solicitud)
      .subscribe((response) => {
        if (response[0] === 'Success') {
          // swal(
          //   $translate.instant('FORMULARIO_SOLICITUD'),
          //   $translate.instant('SOLICITUD_REGISTRADA'),
          //   'success'
          // );
        } else {
          // swal(
          //   $translate.instant('FORMULARIO_SOLICITUD'),
          //   $translate.instant(response.data[1]),
          //   'warning'
          // );
        }
      });

  }

  private cargarDetalles(inicial: boolean) {
    this.siPuede = false;
    // this.detallesCargados = false;
    // this.estudiantes = [];

    // if (tipoSolicitudSeleccionada != 2 && tipoSolicitudSeleccionada.TipoSolicitud.Id == 3) {
    //   // SE LLAMA A LA FUNCION PARA MIRAR SI TIENE UNA SOLICITUD
    //   ctrl.getCancelacionModalidad().then(function (cancelado) {
    //     ctrl.Cancelacion = cancelado;
    //     ctrl.mensajeCancelacion = $translate.instant('ERROR.CANCELACIONES');
    //   });
    // } else {
    //   ctrl.Cancelacion = false;
    // }

    //SE LLAMA LA FUNCIÓN POR CADA UNA DE LAS NOVEDADES
    this.getNotaTrabajoGrado()
      .then((resultado) => {
        this.Nota = resultado;
        // this.mensajeCalificado = $translate.instant('ERROR.CALIFICADO');
      });

    this.verificarRequisitos()
      .then(() => {
      })

  }

  private getEspaciosInscritos(idTrabajoGrado: number) {
    const payload = 'query=TrabajoGrado:' + idTrabajoGrado + '&limit=0';
    this.request.get(environment.POLUX_SERVICE, `espacio_academico_inscrito?${payload}`)
      .subscribe((responseEspacios) => {
        if (responseEspacios.length) {
          this.carreraElegida = responseEspacios[0].EspaciosAcademicosElegibles.CarreraElegible.Id;
        }
      });
  }

}
