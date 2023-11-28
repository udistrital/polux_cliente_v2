import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { environment } from 'src/environments/environment';
import * as moment from 'moment';
import { UserService } from '../../services/userService';
import { RequestManager } from 'src/app/core/manager/request.service';
import { GestorDocumentalService } from '../../services/gestorDocumentalService';
import { Modalidad } from 'src/app/shared/models/modalidad.model';
import { ModalidadTipoSolicitud } from 'src/app/shared/models/modalidadTipoSolicitud.model';
import { DetalleTipoSolicitud, DetalleTipoSolicitudForm } from 'src/app/shared/models/detalleTipoSolicitud.model';
import { TipoSolicitud } from 'src/app/shared/models/tipoSolicitud.model';

@Component({
  selector: 'app-form-solicitud',
  templateUrl: './form-solicitud.component.html',
  styleUrls: ['./form-solicitud.component.scss']
})
export class FormSolicitudComponent implements OnInit {
  @Input() tipoSolicitudSeleccionadaId: number = 0;
  @Input() trabajoGradoId: number = 0;
  @Output() volver = new EventEmitter;

  areasConocimiento: any[] = [];
  // * @property {Object} estudiante Datos del estudiante que esta realizando la solicitud.
  detalles: DetalleTipoSolicitudForm[] = []; //Detalles cargados para mostrar en el formulario que se asocian con la modalidad y el tipo de solicitud escogidas por el solicitante.
  areas: any[] = []; // Areas del conocimiento.
  espaciosElegidos: any[] = []; //Objeto que contiene los espacios elegidos por el estudiante en la solicitud inicial.
  // * @property {Boolean} restringirModalidadesPosgrado Flag que permite identificar si se deben restringir las demas modalidades debido a que el estudiante ya realizo una solicitud inicial de materias de posgrado.
  estudiantes: any[] = []; // Estudiantes que se agregan a la solicitud inicial.
  Trabajo: any = {};// Datos del trabajo de grado que cursa el estudiante que esta realizando la solicitud.
  // * @property {Boolean} solicitudConDetalles Indicador que maneja el contenido de los detalles dentro de una solicitud
  // * @property {Boolean} restringirModalidadesProfundizacion Indicador que maneja la restricción de modalidades para crear solicitud y solo habilita la modalidad de profundización
  detallesConDocumento: any[] = []; // Colección que maneja los detalles con documento de una solicitud
  codigo = '';// Texto que carga el código del estudiante en sesión
  // * @property {Object} Trabajo Objeto que carga la información del estudiante con trabajo de grado registrado
  carreraElegida: any = {};// Objeto que carga la información sobre la carrera elegida por el estudiante
  // * @property {Boolean} errorCarga Indicador que maneja la aparición de un error durante la carga de información
  // * @property {String} mensajeError Texto que aparece en caso de haber un error al cargar los datos del estudiante con solicitud de trabajo de grado
  // * @property {Boolean} errorParametros Indicador que maneja la aparición de un error durante la carga de parámetros
  erroresFormulario = false; // Indicador que maneja la aparición de errores durante el diligenciamiento del formulario
  // * @property {Object} solicitud Contenido que va a registrarse en la base de datos sobre la solicitud
  // * @property {Object} doc Objeto que carga la información sobre el documento que se obtiene
  // * @property {Object} document Objeto que carga la información sobre el documento que se obtiene
  // * @property {Object} blob Objeto que carga la información sobre el Blob del documento en carga
  // * @property {Object} content Objeto que define las propiedades de visualización para el documento en carga
  // * @property {Number} contador contador para no repetir valores en la modalidad de pasantia
  url = 'url';
  estudiantesTg: any[] = []; // Estudiantes asociados al tranajo de grado.

  loadDocenteSolicitud = false;
  showForm = false;
  estudiante: any = {};

  constructor(
    private request: RequestManager,
    private userService: UserService,
    private gestorDocumental: GestorDocumentalService,
  ) {
    this.codigo = this.userService.user.userService?.Codigo;
  }

  ngOnInit(): void {
    if (this.tipoSolicitudSeleccionadaId > 0) {
      this.cargarFormularioSolicitud();
      this.obtenerAreas();
      this.getEspaciosInscritos(this.trabajoGradoId);
    }
  }

  public onInputFileDocumento(event: any) {
    const sizeSoporte = 8;
    if (event.target.files.length > 0) {
      const file = event.target.files[0];
      if (file.type === 'application/pdf' && file.size < sizeSoporte * 1024000) {
        file.urlTemp = URL.createObjectURL(event.srcElement.files[0]);
        file.IdDocumento = 13; // tipo de documento (API documentos_crud)
        file.file = event.target.files[0];
        file.nombre = file.name;
        console.log(file.file)
        // this.fileDocumento[index] = file;
      } else {
        // this.pUpManager.showErrorAlert('error' + this.translate.instant('GLOBAL.error'));
      }
    }
  }

  public onVolver() {
    this.volver.emit();
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
            //  coreAmazonCrudService.get('snies_area').then(function(responseAreas) {
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
              // ctrl.mensajeErrorCarga = $translate.instant('ERROR.CARGAR_AREAS');
              // defer.reject('no hay areas');
            }
            /*  })
              .catch(function(error) {
                ctrl.mensajeErrorCarga = $translate.instant('ERROR.CARGAR_AREAS');
                defer.reject(error);
              });
              */
          } else {
            // ctrl.mensajeErrorCarga = $translate.instant('ERROR.CARGAR_AREAS');
            // defer.reject('no hay areas');
          }
        });
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

  private getOpcionesPolux(detalle: any, parametrosServicio: string[], parametrosConsulta: any[], sql: string): Promise<void> {
    return new Promise((resolve) => {
      if (parametrosServicio[2] !== undefined) {
        parametrosConsulta = parametrosServicio[2].split(',');
        parametrosConsulta.forEach((parametro) => {
          if (!parametro.includes(':')) {
            if (parametro == 'trabajo_grado') {
              parametro = parametro + ':' + this.trabajoGradoId;
            }
            if (parametro == 'carrera_elegible') {
              parametro = parametro + ':' + this.carreraElegida;
            }
            /* //Si el parametro es activo se deja tal y como esta en la bd
            if (parametro == 'activo') {
              parametro = parametro;
            }*/
            if (parametro == 'id') {
              parametro = parametro + ':' + this.trabajoGradoId;
            }
          }
          if (sql === '') {
            sql = parametro;
          } else {
            sql = sql + ',' + parametro;
          }
        });
        detalle.parametros = `query=${sql}&limit=0`;
      }
      this.request.get(environment.POLUX_SERVICE, `${parametrosServicio[1]}?${detalle.parametros}`)
        .subscribe(async (responseOpciones) => {
          if (detalle.Detalle.Nombre.includes('Nombre actual de la propuesta')) {
            detalle.opciones.push({
              NOMBRE: responseOpciones[0].Titulo,
              bd: responseOpciones[0].Titulo,
            });
            resolve();
          } else if (detalle.Detalle.Nombre.includes('Actual resumen de la propuesta')) {
            detalle.opciones.push({
              NOMBRE: responseOpciones[0].DocumentoEscrito.Resumen,
              bd: responseOpciones[0].DocumentoEscrito.Resumen
            });
            resolve();
          } else if (detalle.Detalle.Nombre.includes('Propuesta actual')) {
            detalle.respuesta = responseOpciones[0].DocumentoEscrito.Enlace;
            //
            resolve();
          } else if (detalle.Detalle.Nombre.includes('Areas de conocimiento actuales')) {
            //
            var areasString = '';
            responseOpciones.forEach((area: any) => {
              areasString = areasString + ', ' + area.AreaConocimiento.Nombre;
            });
            detalle.opciones.push({
              NOMBRE: areasString.substring(2),
              bd: areasString.substring(2)
            });
            resolve();
          } else if (detalle.Detalle.Nombre.includes('Nombre Empresa')) {
            responseOpciones.forEach((empresa: any) => {
              detalle.opciones.push({
                NOMBRE: empresa.Identificacion + '',
                bd: empresa.Identificacion + '',
              });
            });
            resolve();
          } else if (detalle.Detalle.Nombre.includes('Espacio Academico Anterior')) {
            const promisesEspacio: any[] = [];
            responseOpciones.forEach((espacio: any) => {
              promisesEspacio.push(this.getEspacioAnterior(detalle, espacio));
            });

            await Promise.all(promisesEspacio);
            resolve();
          } else if (detalle.Detalle.Nombre.includes('Evaluador Actual')) {
            const promisesDocente: any = []
            responseOpciones.forEach((evaluador: any) => {
              promisesDocente.push(this.getDocente(evaluador, detalle));
            });

            await Promise.all(promisesDocente);
            resolve()
          } else if (detalle.Detalle.Nombre.includes('Director Actual')) {
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
          } else if (detalle.Detalle.Nombre.includes('Codirector Actual')) {
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
              // defer.reject('Sin codirector');
            }
          } else if (detalle.Detalle.Nombre.includes('Espacio Academico Nuevo')) {
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
          } else if (detalle.Detalle.Nombre.includes('Nombre del anterior director externo')) {
            let temp = responseOpciones[0].Observaciones.split(' y dirigida por ');
            temp = temp[1].split(' con número de identificacion ');
            detalle.opciones.push({
              NOMBRE: temp[1] + ' - ' + temp[0],
              bd: temp[1]
            });
            resolve();
          } else if (detalle.Detalle.Nombre.includes('Nombre de evaluador(es) actuales')) {
            const promisasDocente: any[] = []
            responseOpciones.forEach((evaluador: any) => {
              promisasDocente.push(this.obtenerDocente(evaluador, detalle));
            });

            Promise.all(promisasDocente)
              .then((evaluadores) => {
                detalle.opciones.push({
                  NOMBRE: evaluadores.map((evaluador) => { return evaluador.nombre }).join(', '),
                  bd: evaluadores.map((evaluador) => { return evaluador.id }).join(',')
                });
              })
          } else if (detalle.Detalle.Nombre.includes('Objetivo Actual')) {
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

  public validarFormularioSolicitud() {
    this.detallesConDocumento = [];

    this.detalles.forEach((detalle) => {
      if (detalle.Detalle.TipoDetalle.Nombre === 'Numerico') {
        detalle.respuesta = detalle.respuestaNumerica + '';
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
          detalle.respuesta = 'JSON';
          this.estudiante.asignaturas_elegidas.forEach((asignatura: any) => {
            asignatura.$$hashKey = undefined;
            detalle.respuesta = detalle.respuesta + '-' + JSON.stringify(asignatura);
          });
        }
        if (detalle.Detalle.Descripcion == 'asignar-estudiantes') {
          detalle.respuesta = (!this.estudiantes.length) ? this.codigo : this.codigo + ',' + this.estudiantes.toString();
        }
        if (detalle.Detalle.Descripcion == 'asignar-area') {
          detalle.respuesta = 'JSON';
          this.estudiante.areas_elegidas.forEach((area: any) => {
            area.$$hashKey = undefined;
            detalle.respuesta = detalle.respuesta + '-' + JSON.stringify(area);
          });
        }
      }
      if (detalle.Detalle.TipoDetalle.Nombre === 'Checkbox' || detalle.Detalle.TipoDetalle.Nombre === 'Radio') {

        if (detalle.bool === undefined) {
          detalle.bool = false;
        }
        if (detalle.bool) {
          detalle.respuesta = 'SI';
        } else {
          detalle.respuesta = 'NO';
        }

        //detalle.respuesta = detalle.bool.toString();
      }
    });
    //Realizar validaciones
    this.erroresFormulario = false;
    this.detalles.forEach((detalle) => {
      if (typeof (detalle.respuesta) !== 'string') {
        // swal(
        //   'Validación del formulario',
        //   'Diligencie correctamente el formulario por favor.',
        //   'warning'
        // );
        //
        this.erroresFormulario = true;
      }
      if (detalle.respuesta === '' && detalle.Detalle.TipoDetalle.Nombre !== 'Directiva' && detalle.Detalle.TipoDetalle.Nombre !== 'Selector') {
        // swal(
        //   'Validación del formulario',
        //   'Debe completar todos los campos del formulario.',
        //   'warning'
        // );
        //
        this.erroresFormulario = true;
      }
      if (!this.estudiante.areas_elegidas.length && detalle.Detalle.Descripcion == 'asignar-area') {
        // swal(
        //   'Validación del formulario',
        //   'Debe ingresar al menos un área de conocimiento.',
        //   'warning'
        // );
        //
        this.erroresFormulario = true;
      }
      if (detalle.Detalle.Descripcion == 'solicitar-asignaturas' && !this.estudiante.minimoCreditos) {
        // swal(
        //   'Validación del formulario',
        //   'Debe cumplir con el minimo de creditos.',
        //   'warning'
        // );
        this.erroresFormulario = true;
      }
      if (detalle.Detalle.TipoDetalle.Nombre === 'Selector' || detalle.Detalle.TipoDetalle.Nombre === 'Lista') {
        var contiene = false;
        //
        detalle.opciones.forEach((opcion: any) => {
          if (opcion.bd == detalle.respuesta) {
            contiene = true;
          }
        });
        //Si el detalle es de docente co-director se puede dejar vacio
        if (detalle.Detalle.Id == 56 && (detalle.respuesta == '' || detalle.respuesta == 'No solicita')) {
          detalle.respuesta = 'No solicita';
          contiene = true;
        }
        if (!contiene) {
          // swal(
          //   'Validación del formulario',
          //   'Error ingrese una opcion valida.',
          //   'warning'
          // );
          this.erroresFormulario = true;
        }
      }
      if (detalle.Detalle.TipoDetalle.Nombre === 'Documento') {
        if (detalle.fileModel == null) {
          // swal(
          //   'Validación del formulario',
          //   'Error ingrese una opcion valida. (Documento)',
          //   'warning'
          // );
          this.erroresFormulario = true;
        }
      }
      if (detalle.Detalle.TipoDetalle.Nombre === 'Checkbox') {
        if (detalle.respuesta == 'NO') {
          // swal(
          //   'Validación del formulario',
          //   'Debe aceptar los terminos y condiciones de la modalidad.',
          //   'warning'
          // );
          this.erroresFormulario = true;
        }
      }
    });

    if (!this.erroresFormulario) {
      // emit
    } else {
      // Error form
    }
  }

  public cargarFormularioSolicitud() {
    const parametrosDetalles = `query=ModalidadTipoSolicitud.Id:${this.tipoSolicitudSeleccionadaId}` +
      `&limit=0&sortby=NumeroOrden&order=asc`;
    this.detalles = [];

    this.request.get(environment.POLUX_SERVICE, `detalle_tipo_solicitud?${parametrosDetalles}`)
      .subscribe(async (responseDetalles) => {
        if (responseDetalles.length) {
          this.detalles = responseDetalles.filter((detalle: DetalleTipoSolicitud) => (detalle.Detalle.Id !== 69 && detalle.Detalle.Activo));
          // Se cargan opciones de los detalles
          const promises: any[] = []
          this.detalles.forEach((detalle) => {
            //Se internacionalizan variables y se crean labels de los detalles
            // detalle.label = $translate.instant(detalle.Detalle.Enunciado);
            detalle.label = detalle.Detalle.Enunciado;
            detalle.respuesta = '';
            detalle.fileModel = null;
            detalle.opciones = [];

            //Se evalua si el detalle necesita cargar datos
            if (!detalle.Detalle.Descripcion.includes('no_service') && detalle.Detalle.TipoDetalle.Id !== 8) {
              //Se separa el strig
              var parametrosServicio = detalle.Detalle.Descripcion.split(';');
              var sql = '';
              var parametrosConsulta: any[] = [];
              //servicio de academiaca
              if (parametrosServicio[0] === 'polux') {
                promises.push(this.getOpcionesPolux(detalle, parametrosServicio, parametrosConsulta, sql));
              }
              if (parametrosServicio[0] === 'academica') {
                promises.push(this.getOpcionesAcademica(detalle, parametrosServicio));
              }
              if (parametrosServicio[0] === 'cidc') {
                // if (parametrosServicio[1] === 'estructura_investigacion') {
                //   detalle.opciones = cidcRequest.obtenerEntidades();
                // }
                // if (parametrosServicio[1] === 'docentes') {
                //   detalle.opciones = cidcRequest.obtenerDoncentes();
                // }
              }
              if (parametrosServicio[0] === 'estatico') {
                parametrosConsulta = parametrosServicio[2].split(',');
                parametrosConsulta.forEach((opcion) => {
                  detalle.opciones.push({
                    'NOMBRE': opcion,
                    'bd': opcion
                  });
                });
              }
              if (parametrosServicio[0] === 'mensaje') {
                detalle.opciones.push({
                  // 'NOMBRE': $translate.instant(parametrosServicio[1]),
                  // 'bd': $translate.instant(parametrosServicio[1])
                });
              }

              if (parametrosServicio[0] === 'categorias-revista') {
                const payload = 'query=CodigoAbreviacion.in:A1_PLX|A2_PLX|B_PLX|C_PLX';
                this.request.get(environment.PARAMETROS_SERVICE, `parametro?${payload}`)
                  .subscribe((parametros) => {
                    parametros.forEach((parametro: any) => {
                      detalle.opciones.push({
                        'NOMBRE': parametro.Nombre,
                        'bd': parametro.Id
                      });
                    });
                  });
              }
            }
            // FILTRO SEGÚN MODALIDAD PARA EL CAMPO DE ACEPTACIÓN DE TERMINOS
            if (detalle.Detalle.CodigoAbreviacion == 'ACTERM') {
              // PARA MODALIDAD DE MONOGRAFIA
              if (detalle.ModalidadTipoSolicitud.Modalidad.CodigoAbreviacion == 'MONO') {
                // detalle.label = $translate.instant('TERMINOS.MONOGRAFIA')
                detalle.label = 'TERMINOS.MONOGRAFIA'
              }
              // PARA MODALIDAD DE MONOGRAFIA
              if (detalle.ModalidadTipoSolicitud.Modalidad.CodigoAbreviacion == 'PAS' || detalle.ModalidadTipoSolicitud.Modalidad.CodigoAbreviacion == 'PASIN') {
                // detalle.label = $translate.instant('TERMINOS.PASANTIA')
                detalle.label = 'TERMINOS.PASANTIA'
              }
              // PARA MODALIDAD DE EMPRENDIMIENTO
              if (detalle.ModalidadTipoSolicitud.Modalidad.CodigoAbreviacion == 'PEMP') {
                // detalle.label = $translate.instant('TERMINOS.EMPRENDIMIENTO')
                detalle.label = 'TERMINOS.EMPRENDIMIENTO'
              }
              // PARA MODALIDAD DE MATERIAS DE POSGRADO
              if (detalle.ModalidadTipoSolicitud.Modalidad.CodigoAbreviacion == 'EAPOS') {
                // detalle.label = $translate.instant('TERMINOS.POSGRADO')
                detalle.label = 'TERMINOS.POSGRADO'
              }
              // PARA MODALIDAD DE MATERIAS DE INVESTIGACION E INNOVACION
              if (detalle.ModalidadTipoSolicitud.Modalidad.CodigoAbreviacion == 'INV') {
                // detalle.label = $translate.instant('TERMINOS.INVESTIGACION')
                detalle.label = 'TERMINOS.INVESTIGACION'
              }
              // PARA MODALIDAD DE MATERIAS DE ARTICULO ACADEMICO
              if (detalle.ModalidadTipoSolicitud.Modalidad.CodigoAbreviacion == 'PACAD') {
                // detalle.label = $translate.instant('TERMINOS.ARTICULO')
                detalle.label = 'TERMINOS.ARTICULO'
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
          // ctrl.mensajeError = $translate.instant('ERROR.SIN_DETALLE_SOLICITUD');
          // ctrl.errorParametros = true;
          // $scope.loadDetalles = false;
          // ctrl.detalles = [];
        }
      })
  }

  private getOpcionesAcademica(detalle: any, parametrosServicio: string[]): Promise<void> {
    return new Promise((resolve) => {
      if (parametrosServicio[1] === 'docente') {
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

  private getEspacioAnterior(detalle: any, espacio: any): Promise<void> {
    return new Promise((resolve) => {
      const payload = `${espacio.EspaciosAcademicosElegibles.CodigoAsignatura}/${espacio.EspaciosAcademicosElegibles.CarreraElegible.CodigoPensum}`;
      this.request.get(environment.ACADEMICA_SERVICE, `asignatura_pensum/${payload}`)
        .subscribe((asignatura) => {
          detalle.asignatura = asignatura.asignatura.datosAsignatura[0];
          detalle.opciones.push({
            NOMBRE: asignatura.asignatura.datosAsignatura[0].nombre + ', creditos: ' + asignatura.asignatura.datosAsignatura[0].creditos,
            bd: espacio.EspaciosAcademicosElegibles.CodigoAsignatura + '-' + asignatura.asignatura.datosAsignatura[0].nombre,
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

  public displayOption(item: any) {
    return item ? item.NOMBRE : '';
  }

}
