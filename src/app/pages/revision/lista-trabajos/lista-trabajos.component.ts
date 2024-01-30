import { Component, OnInit } from '@angular/core';
import { VinculacionTrabajoGrado, VinculacionTrabajoGradoDetalle, VinculacionTrabajoGradoNombre } from 'src/app/shared/models/vinculacionTrabajoGrado.model';
import { UserService } from '../../services/userService';
import { DocumentoTrabajoGrado } from 'src/app/shared/models/documentoTrabajoGrado.model';
import { GestorDocumentalService } from '../../services/gestorDocumentalService';
import { ParametrosService } from '../../services/parametrosService';
import { Parametro } from 'src/app/shared/models/parametro.model';
import { firstValueFrom } from 'rxjs';
import { RevisionTrabajoGrado, RevisionTrabajoGradoDetalle } from 'src/app/shared/models/revisionTrabajoGrado.model';
import { PoluxCrudService } from '../../services/poluxCrudService';
import { TrabajoGrado } from 'src/app/shared/models/trabajoGrado.model';
import { DetallePasantia } from 'src/app/shared/models/detallePasantia.model';
import { AcademicaService } from '../../services/academicaService';
import { EstudianteTrabajoGrado } from 'src/app/shared/models/estudianteTrabajoGrado.model';
import { DocumentoCrudService } from '../../services/documentoCrudService';
import { TipoDocumento } from 'src/app/shared/models/tipoDocumento.model';
import { ActivatedRoute } from '@angular/router';
import { AlertService } from '../../services/alertService';
import { datosEstudiante, responseDocente } from 'src/app/shared/models/academica/periodo.model';
import { DocumentoEscrito } from 'src/app/shared/models/documentoEscrito.model';

@Component({
  selector: 'app-lista-trabajos',
  templateUrl: './lista-trabajos.component.html',
  styleUrls: ['./lista-trabajos.component.scss']
})
export class ListaTrabajosComponent implements OnInit {
  modo = 'DOCENTE' || 'ESTUDIANTE';
  trabajosDirigidos: VinculacionTrabajoGradoDetalle[] = [];
  revisionesTrabajoGrado: RevisionTrabajoGradoDetalle[] = [];

  parametros: Parametro[] = [];
  tiposDocumento: TipoDocumento[] = [];
  tipoDocumentoRevision = 0;

  codigoEstudiante = '';
  nombreUsuario = '';
  documento = '';
  trabajoId = 0;

  doc: any;
  nuevoDocumento: File = new File([], '');
  revisorId = 0;
  trabajoGrado: TrabajoGrado | undefined;
  vinculados: VinculacionTrabajoGradoNombre[] = [];
  informacionAcademica: datosEstudiante | undefined;
  documentoEscrito: DocumentoTrabajoGrado = new DocumentoTrabajoGrado;

  mensaje = '';

  constructor(
    private userService: UserService,
    private poluxCrud: PoluxCrudService,
    private gestorDocumental: GestorDocumentalService,
    private parametrosCrud: ParametrosService,
    private academica: AcademicaService,
    private documentosCrud: DocumentoCrudService,
    private route: ActivatedRoute,
    private alert: AlertService,
  ) {
    this.documento = this.userService.getDocumento();
    this.codigoEstudiante = this.userService.getCodigo();
  }

  ngOnInit(): void {
    this.route.data
      .subscribe(async (data: any) => {
        if (data && data.modo && ['DOCENTE', 'ESTUDIANTE'].includes(data.modo)) {
          this.modo = data.modo;
          await Promise.all([
            this.getParametros(),
            this.getTipoDocumento(),
          ])
            .then(([parametros, tiposDocumento]) => {
              this.parametros = parametros;
              this.tiposDocumento = tiposDocumento;
              this.tipoDocumentoRevision = this.tiposDocumento.find(td => td.CodigoAbreviacion === 'DGRREV_PLX')?.Id || 0;
            })
            .catch(() => {
              this.mensaje = 'Ocurrió un error consultando los datos del trabajo de grado. Intente de nuevo.';
            });

          if (this.modo === 'DOCENTE') {
            this.getParametrosDocente();
          } else {
            this.getParametrosEstudiante();
          }
        }
      });
  }

  private getParametrosEstudiante() {
    const estadosValidos = ['APR_PLX', 'RVS_PLX', 'AVI_PLX', 'AMO_PLX', 'SRV_PLX', 'SRVS_PLX', 'ASVI_PLX',
      'ASMO_PLX', 'ASNV_PLX', 'EC_PLX', 'PR_PLX', 'ER_PLX', 'MOD_PLX', 'LPS_PLX', 'STN_PLX', 'NTF_PLX'];

    const idsEstados: number[] = this.parametros
      .filter(estado => estadosValidos.includes(estado.CodigoAbreviacion))
      .map(estadoValido => estadoValido.Id);
    const estadoEstudiante = this.parametros
      .find(estEstTrGr => estEstTrGr.CodigoAbreviacion === 'EST_ACT_PLX');

    if (!estadoEstudiante || !estadosValidos.length) {
      this.mensaje = 'Ocurrió un error consultando los datos del trabajo de grado. Intente de nuevo.';
      return;
    }

    const uri = `limit=0&query=Estudiante:${this.codigoEstudiante}` +
      `,TrabajoGrado.EstadoTrabajoGrado.in:${idsEstados.join('|')}` +
      `,EstadoEstudianteTrabajoGrado:${estadoEstudiante.Id}`;
    this.poluxCrud.get('estudiante_trabajo_grado', uri)
      .subscribe({
        next: (estudiante: EstudianteTrabajoGrado[]) => {
          if (estudiante.length) {
            this.trabajoId = estudiante[0].TrabajoGrado.Id;
            this.trabajoId = 84;
            Promise.all([
              this.consultarRevisionesTrabajoGrado(),
              this.consultarInformacionAcademicaDelEstudiante(),
              this.consultarDocumentoTrabajoGradoEst(),
              this.consultarVinculacionTrabajoGrado(),
            ])
              .catch((err) => this.mensaje = err);
          } else {
            this.mensaje = 'No hay información estudiantil asociada a los trabajos de grado consultados.';
          }
        }, error: () => {
          this.mensaje = 'No hay información estudiantil asociada a los trabajos de grado consultados.';
        }
      });
  }

  private getParametrosDocente() {
    Promise.all([this.getInfoDocente(), this.consultarVinculacionesTrabajoGrado()])
      .catch(err => this.mensaje = err);
  }

  private getParametros(): Promise<Parametro[]> {
    const tipoParametros = 'EST_TRG|ROL_TRG|MOD_TRG|ESTREV_TRG|EST_ESTU_TRG';
    return firstValueFrom(this.parametrosCrud.getAllParametroByTipo(tipoParametros));
  }

  private getTipoDocumento(): Promise<TipoDocumento[]> {
    const uri = 'query=DominioTipoDocumento__CodigoAbreviacion:DOC_PLX&limit=0';
    return firstValueFrom(this.documentosCrud.get('tipo_documento', uri));
  }

  private consultarVinculacionesTrabajoGrado(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.documento.length) {
        reject('No se pueden consultar los trabajos de grado asociados. Contacte soporte.');
        return;
      }

      const estadosValidos = ['APR_PLX', 'RVS_PLX', 'AVI_PLX', 'AMO_PLX', 'SRV_PLX', 'SRVS_PLX', 'ASVI_PLX', 'ASMO_PLX',
        'ASNV_PLX', 'EC_PLX', 'PR_PLX', 'ER_PLX', 'MOD_PLX', 'LPS_PLX', 'STN_PLX', 'NTF_PLX', 'PAEA_PLX', 'PECSPR_PLX'];
      const rolesValidos = ['DIRECTOR_PLX', 'CODIRECTOR_PLX'];

      const idsEstados: number[] = this.parametros
        .filter(estado => estadosValidos.includes(estado.CodigoAbreviacion))
        .map(estadoValido => estadoValido.Id);

      const idsRoles: number[] = this.parametros
        .filter(rol => rolesValidos.includes(rol.CodigoAbreviacion))
        .map(rolValido => rolValido.Id);

      const uri = 'limit=0&query=TrabajoGrado.EstadoTrabajoGrado.in:' + idsEstados.join('|')
        + ',RolTrabajoGrado.in:' + idsRoles.join('|')
        + ',Activo:true,Usuario:' + this.documento;

      this.poluxCrud.get('vinculacion_trabajo_grado', uri)
        .subscribe({
          next: (respuestaVinculaciones: VinculacionTrabajoGrado[]) => {
            this.trabajosDirigidos = respuestaVinculaciones
              .map((rev) => this.parametrosCrud.fillPropiedad(rev, 'RolTrabajoGrado', this.parametros))
              .map((rev) => this.parametrosCrud.fillPropiedad(rev, 'TrabajoGrado.EstadoTrabajoGrado', this.parametros))
              .map((rev) => this.parametrosCrud.fillPropiedad(rev, 'TrabajoGrado.Modalidad', this.parametros));
            resolve();
          }, error: () => reject('Ocurrió un error al consultar los trabajos de grado asociados.'),
        });
    });
  }

  public consultarTrabajoGrado() {
    this.consultarRevisionesTrabajoGrado();
    this.consultarDocumentoTrabajoGrado();
  }

  public subirVersion() {
    const tipoDocumento = this.tiposDocumento.find(tipoDoc => tipoDoc.CodigoAbreviacion === 'DTR_PLX');
    if (!tipoDocumento) {
      return;
    }

    const descripcion = 'Versión nueva del trabajo de grado';
    const nombre = `${this.trabajoGrado?.Titulo}: ${this.codigoEstudiante}`;
    const documento = {
      descripcion,
      file: this.nuevoDocumento,
      IdTipoDocumento: tipoDocumento.Id,
      nombre,
      Observaciones: 'Nueva version trabajo ' + this.trabajoGrado?.Titulo,
    };

    this.gestorDocumental.uploadFiles([documento])
      .subscribe({
        next: (response) => {
          if (response && Array.isArray(response) && response.length > 0 && response[0].res) {
            this.actualizarDocumentoTrabajoGrado(response[0].res.Enlace);
          }
        }, error: () => {
          this.alert.error('Ocurrió un error subiendo la nueva versión del trabajo de grado. Intente de nuevo.');
        }
      });
  }

  private actualizarDocumentoTrabajoGrado(nuevoEnlace: string) {
    this.documentoEscrito.DocumentoEscrito.Enlace = nuevoEnlace;
    this.poluxCrud.put('documento_escrito', this.documentoEscrito.Id, this.documentoEscrito)
      .subscribe({
        next: (respuestaActualizarDocumento) => {
          if (Array.isArray(respuestaActualizarDocumento) &&
            respuestaActualizarDocumento.length === 1 && respuestaActualizarDocumento[0] === 'Success') {
            this.alert.success('El documento ha sido actualizado.')
          } else {
            this.alert.error('Ocurrió un error subiendo la nueva versión del trabajo de grado. Intente de nuevo.')
          }
        }, error: () => {
          this.alert.error('Ocurrió un error subiendo la nueva versión del trabajo de grado. Intente de nuevo.');
        },
      });
  }

  public solicitarRevision() {
    const estadoRevisionTrabajoGrado = this.parametros.find(estado => estado.CodigoAbreviacion === 'PENDIENTE_PLX');
    if (!estadoRevisionTrabajoGrado) {
      this.alert.error('Ocurrió un error al intentar solicitar la revisión. Intente de nuevo.');
      return;
    }

    const nuevaRevision = <RevisionTrabajoGrado>{
      NumeroRevision: this.revisionesTrabajoGrado.length + 1,
      FechaRecepcion: new Date(),
      EstadoRevisionTrabajoGrado: estadoRevisionTrabajoGrado.Id,
      DocumentoTrabajoGrado: {
        Id: this.documentoEscrito.Id,
      },
      VinculacionTrabajoGrado: {
        Id: this.revisorId,
      },
    };

    this.poluxCrud.post('revision_trabajo_grado', nuevaRevision)
      .subscribe({
        next: (respuesta: RevisionTrabajoGrado) => {
          if (respuesta && respuesta.Id > 0) {
            this.alert.success('Revisión solicitada exitosamente.')
          } else {
            this.alert.error('Ocurrió un error al intentar solicitar la revisión');
          }
        }, error: () => {
          this.alert.error('Ocurrió un error al intentar solicitar la revisión');
        },
      })
  }

  private consultarDocumentoTrabajoGrado(): Promise<void> {
    this.doc = '';
    return new Promise((resolve, reject) => {
      if (this.trabajoId === 0) {
        resolve();
        return;
      }

      const tipoDocumento = this.tiposDocumento.find(tipoDoc => tipoDoc.CodigoAbreviacion === 'DTR_PLX');
      if (!tipoDocumento) {
        reject('No tipo documento');
        return;
      }

      const uri = `query=DocumentoEscrito.TipoDocumentoEscrito:${tipoDocumento.Id},TrabajoGrado.Id:${this.trabajoId}&limit=0`;
      this.poluxCrud.get('documento_trabajo_grado', uri)
        .subscribe({
          next: (respuestaDocumentoTrabajoGrado: DocumentoTrabajoGrado[]) => {
            if (respuestaDocumentoTrabajoGrado.length > 0) {
              this.documentoEscrito = respuestaDocumentoTrabajoGrado[0];
              resolve();
            } else {
              reject('No documento en trabajo de grado');
            }
          }, error: () => {
            reject('Ocurrió un error al consultar el documento del trabajo de grado. Intente de nuevo.');
          }
        });
    })
  }

  private consultarRevisionesTrabajoGrado(): Promise<void> {
    this.revisionesTrabajoGrado = [];
    const uri = `query=DocumentoTrabajoGrado.TrabajoGrado.Id:${this.trabajoId}&limit=0`;
    return new Promise((resolve, reject) => {
      this.poluxCrud.get('revision_trabajo_grado', uri)
        .subscribe({
          next: (respuestaRevisionesTrabajoGrado: RevisionTrabajoGrado[]) => {
            if (respuestaRevisionesTrabajoGrado.length) {
              this.doc = respuestaRevisionesTrabajoGrado[0].DocumentoTrabajoGrado.DocumentoEscrito.Enlace;
              this.revisionesTrabajoGrado = respuestaRevisionesTrabajoGrado
                .map((rev) => this.parametrosCrud.fillPropiedad(rev, 'EstadoRevisionTrabajoGrado', this.parametros));
            }
            resolve();
          }, error: () => {
            reject('Ocurrió un error consultando las revisiones del trabajo de grado. Intente de nuevo.');
          }
        });
    });
  }


  private consultarDocumentoTrabajoGradoEst(): Promise<void> {
    // Verificar si el filtro es necesario
    // const estadoTrabajoGrado = this.parametros.find(estado => estado.Id === this.trabajoGrado.EstadoTrabajoGrado);
    // const estadoTrabajoGradoAceptada = ['APR_PLX', 'RVS_PLX', 'AVI_PLX', 'AMO_PLX',
    //   'SRV_PLX', 'SRVS_PLX', 'ASVI_PLX', 'ASMO_PLX', 'PAEA_PLX', 'PECSPR_PLX',
    //   'EC_PLX', 'PR_PLX', 'ER_PLX', 'MOD_PLX', 'LPS_PLX', 'STN_PLX', 'NTF_PLX'];
    // estadoTrabajoGradoAceptada.includes(estadoTrabajoGrado.CodigoAbreviacion)
    return this.consultarDocumentoTrabajoGrado();
  }

  private consultarVinculacionTrabajoGrado(): Promise<void> {
    return new Promise((resolve, reject) => {
      const consultasVinculados: Promise<void>[] = [];
      const uri = `query=Activo:true,TrabajoGrado.Id:${this.trabajoId}&limit=0`;
      this.poluxCrud.get('vinculacion_trabajo_grado', uri)
        .subscribe({
          next: async (respuestaVinculaciones: VinculacionTrabajoGradoNombre[]) => {
            if (respuestaVinculaciones.length) {
              respuestaVinculaciones.forEach(vinculacionTrabajoGrado => {
                const rolTrabajoGrado = this.parametros.find(rol => rol.Id === vinculacionTrabajoGrado.RolTrabajoGrado);
                if (!rolTrabajoGrado) {
                  reject('Rol no registrado');
                  return;
                }

                if (rolTrabajoGrado.CodigoAbreviacion === 'DIR_EXTERNO_PLX') {
                  consultasVinculados.push(this.consultarDirectorExterno(vinculacionTrabajoGrado));
                } else {
                  consultasVinculados.push(this.consultarDocenteTrabajoGrado(vinculacionTrabajoGrado));
                }
              });

              await Promise.all(consultasVinculados);
              this.vinculados = respuestaVinculaciones.filter(vinculacion => vinculacion.Nombre !== '');
              resolve();
            }
          }, error() {
            reject('Ocurrió un error al consultar los vinculados al trabajo de grado.');
          },
        });
    })
  }

  private consultarDirectorExterno(vinculacionTrabajoGrado: VinculacionTrabajoGradoNombre): Promise<void> {
    return new Promise((resolve, reject) => {
      this.poluxCrud.get('detalle_pasantia', `query=TrabajoGrado.Id:${vinculacionTrabajoGrado.TrabajoGrado.Id}&limit=1`)
        .subscribe({
          next: (docenteExterno: DetallePasantia[]) => {
            if (docenteExterno.length > 0) {
              let resultadoDocenteExterno = docenteExterno[0].Observaciones.split(' y dirigida por ');
              resultadoDocenteExterno = resultadoDocenteExterno[1].split(' con número de identificacion ');
              vinculacionTrabajoGrado.Nombre = resultadoDocenteExterno[0];
            }
            resolve();
          }, error() {
            reject('No se pudo cargar la información del director externo. Intente de nuevo.');
          },
        });
    });
  }

  private getInfoDocente(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.academica.get('docente_tg', this.documento)
        .subscribe({
          next: (docenteDirector: responseDocente) => {
            if (docenteDirector.docenteTg?.docente) {
              this.nombreUsuario = docenteDirector.docenteTg.docente[0].nombre;
              resolve();
            } else {
              reject('No existe información relacionada con los docentes asociados al trabajo de grado.');
            }
          }, error() {
            reject('Ocurrió un error al intentar consultar los docentes de los trabajos de grado consultados. Comuníquese con el administrador.');
          },
        });
    });
  }

  private consultarDocenteTrabajoGrado(vinculacionTrabajoGrado: VinculacionTrabajoGradoNombre): Promise<void> {
    return new Promise((resolve, reject) => {
      this.academica.get('docente_tg', `${vinculacionTrabajoGrado.Usuario}`)
        .subscribe({
          next: (docenteDirector: responseDocente) => {
            if (docenteDirector.docenteTg?.docente) {
              vinculacionTrabajoGrado.Nombre = docenteDirector.docenteTg.docente[0].nombre;
            }
            resolve();
          }, error() {
            reject('No se pudo cargar la información de los docentes del trabajo de grado. Intente de nuevo.');
          },
        });
    });
  }

  private consultarInformacionAcademicaDelEstudiante(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.academica.getPeriodoAnterior()
        .then((periodoAcademicoPrevio) => {
          this.academica.get('datos_estudiante', `${this.codigoEstudiante}/${periodoAcademicoPrevio.anio}/${periodoAcademicoPrevio.periodo}`)
            .subscribe({
              next: (estudianteConsultado) => {
                if (estudianteConsultado.estudianteCollection.datosEstudiante) {
                  this.informacionAcademica = estudianteConsultado.estudianteCollection.datosEstudiante[0];
                  this.nombreUsuario = estudianteConsultado.estudianteCollection.datosEstudiante[0].nombre;
                  resolve();
                } else {
                  reject('Ocurrió un error consultando los datos del estudiante. Intente de nuevo');
                }
              }, error: () => {
                reject('Ocurrió un error consultando los datos del estudiante. Intente de nuevo');
              }
            });
        })
        .catch((err) => reject(err));
    });
  }

}
