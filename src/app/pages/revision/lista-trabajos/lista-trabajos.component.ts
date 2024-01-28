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

@Component({
  selector: 'app-lista-trabajos',
  templateUrl: './lista-trabajos.component.html',
  styleUrls: ['./lista-trabajos.component.scss']
})
export class ListaTrabajosComponent implements OnInit {
  modo = 'DOCENTE' || 'ESTUDIANTE';
  trabajosDirigidos: VinculacionTrabajoGradoDetalle[] = [];
  revisionesTrabajoGrado: RevisionTrabajoGradoDetalle[] = [];

  estadosTrabajoGrado: Parametro[] = [];
  rolesTrabajoGrado: Parametro[] = [];
  modalidades: Parametro[] = [];
  estadosRevision: Parametro[] = [];
  estadosEstudiante: Parametro[] = [];
  tiposDocumento: TipoDocumento[] = [];

  codigoEstudiante = '';
  documento = '';
  trabajoId = 0;

  doc: any;
  nuevoDocumento: File = new File([], '');
  revisorId = 0;

  constructor(
    private userService: UserService,
    private poluxCrud: PoluxCrudService,
    private gestorDocumental: GestorDocumentalService,
    private parametros: ParametrosService,
    private academica: AcademicaService,
    private documentosCrud: DocumentoCrudService,
    private route: ActivatedRoute,
    private alert: AlertService,
  ) {
    this.documento = this.userService.getDocumento();
    this.codigoEstudiante = this.userService.getCodigo();
  }

  ngOnInit(): void {
    this.route.data.subscribe((data: any) => {
      if (data && data.modo) {
        this.modo = data.modo;
        if (this.modo === 'DOCENTE') {
          this.getParametrosDocente();
        } else {
          this.getParametrosEstudiante();
        }
      }
    });
    return
    this.trabajoSeleccionadoId = 263;
    this.consultarRevisionesTrabajoGrado()
  }

  private async getParametrosDocente() {
    await Promise.all([
      this.getEstadosTrabajoGrado(),
      this.getRolesTrabajoGrado(),
      this.getModalidades(),
      this.getEstadosRevision(),
      this.getTipoDocumento(),
    ]);
    this.consultarVinculacionTrabajoGrado();
  }

  private getEstadosTrabajoGrado(): Promise<void> {
    return new Promise(async (resolve, reject) => {
      this.estadosTrabajoGrado = await firstValueFrom(this.parametros.getAllParametroByTipo('EST_TRG'));
      resolve();
    });
  }

  private getRolesTrabajoGrado(): Promise<void> {
    return new Promise(async (resolve, reject) => {
      this.rolesTrabajoGrado = await firstValueFrom(this.parametros.getAllParametroByTipo('ROL_TRG'));
      resolve();
    });
  }

  private getModalidades(): Promise<void> {
    return new Promise(async (resolve, reject) => {
      this.modalidades = await firstValueFrom(this.parametros.getAllParametroByTipo('MOD_TRG'));
      resolve();
    });
  }

  private getEstadosRevision(): Promise<void> {
    return new Promise(async (resolve, reject) => {
      this.estadosRevision = await firstValueFrom(this.parametros.getAllParametroByTipo('ESTREV_TRG'));
      resolve();
    });
  }

  private getTipoDocumento(): Promise<void> {
    return new Promise(async (resolve, reject) => {
      const uri = 'query=DominioTipoDocumento__CodigoAbreviacion:DOC_PLX&limit=0';
      this.tiposDocumento = await firstValueFrom(this.documentosCrud.get('tipo_documento', uri));
      resolve();
    });
  }

  private getEstadosEstudiante(): Promise<void> {
    return new Promise(async (resolve, reject) => {
      firstValueFrom(this.parametros.getAllParametroByTipo('EST_ESTU_TRG'))
        .then((estados) => {
          this.estadosEstudiante = estados;
          resolve();
        })
        .catch(() => reject('Error'));
    });
  }

  private consultarVinculacionTrabajoGrado(): void {
    if (!this.documento.length) {
      // alert no documento
      return;
    }

    const estadosValidos = ['APR_PLX', 'RVS_PLX', 'AVI_PLX', 'AMO_PLX', 'SRV_PLX', 'SRVS_PLX', 'ASVI_PLX', 'ASMO_PLX',
      'ASNV_PLX', 'EC_PLX', 'PR_PLX', 'ER_PLX', 'MOD_PLX', 'LPS_PLX', 'STN_PLX', 'NTF_PLX', 'PAEA_PLX', 'PECSPR_PLX'];
    const rolesValidos = ['DIRECTOR_PLX', 'CODIRECTOR_PLX'];

    const idsEstados: number[] = this.estadosTrabajoGrado
      .filter(estado => estadosValidos.includes(estado.CodigoAbreviacion))
      .map(estadoValido => estadoValido.Id);

    const idsRoles: number[] = this.rolesTrabajoGrado
      .filter(rol => rolesValidos.includes(rol.CodigoAbreviacion))
      .map(rolValido => rolValido.Id);

    const uri = 'limit=0&query=TrabajoGrado.EstadoTrabajoGrado.in:' + idsEstados.join('|')
      + ',RolTrabajoGrado.in:' + idsRoles.join('|')
      + ',Activo:true,Usuario:' + this.documento;

    this.poluxCrud.get('vinculacion_trabajo_grado', uri)
      .subscribe((respuestaVinculaciones: VinculacionTrabajoGrado[]) => {
        this.trabajosDirigidos = respuestaVinculaciones
          .map((rev) => this.parametros.fillPropiedad(rev, 'RolTrabajoGrado', this.rolesTrabajoGrado))
          .map((rev) => this.parametros.fillPropiedad(rev, 'TrabajoGrado.EstadoTrabajoGrado', this.rolesTrabajoGrado))
          .map((rev) => this.parametros.fillPropiedad(rev, 'TrabajoGrado.Modalidad', this.modalidades));
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
    const nombre = `${this.trabajoGrado.Titulo}: ${this.codigoEstudiante}`;
    const documento = {
      descripcion,
      file: this.nuevoDocumento,
      IdTipoDocumento: tipoDocumento.Id,
      nombre,
      Observaciones: 'Nueva version trabajo ' + this.trabajoGrado.Titulo,
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
    this.trabajoGrado.documentoEscrito.Enlace = nuevoEnlace;
    this.poluxCrud.put('documento_escrito', this.trabajoGrado.documentoEscrito.Id, this.trabajoGrado.documentoEscrito)
      .subscribe((respuestaActualizarDocumento) => {
        if (Array.isArray(respuestaActualizarDocumento) &&
          respuestaActualizarDocumento.length === 1 && respuestaActualizarDocumento[0] === 'Success') {
          // alerta ok
        } else {
          // alerta error
        }
      });
  }

  public solicitarRevision() {
    const estadoRevisionTrabajoGrado = this.estadosRevision.find(estado => estado.CodigoAbreviacion == 'PENDIENTE_PLX');
    if (!estadoRevisionTrabajoGrado) {
      // alerta no estado
      // notificacion
      return;
    }

    const nuevaRevision = <RevisionTrabajoGrado>{
      NumeroRevision: this.revisionesTrabajoGrado.length + 1,
      FechaRecepcion: new Date(),
      EstadoRevisionTrabajoGrado: estadoRevisionTrabajoGrado.Id,
      DocumentoTrabajoGrado: {
        Id: this.trabajoGrado.documentoEscrito.Id,
      },
      VinculacionTrabajoGrado: {
        Id: this.revisorId,
      },
    };

    this.poluxCrud.post('revision_trabajo_grado', nuevaRevision)
      .subscribe((respuesta) => {
        if (Array.isArray(respuesta) && respuesta.length === 1 && respuesta[0] === 'Success') {
          // alerta ok
        } else {
          // alerta error
        }
      });
  }

  private consultarDocumentoTrabajoGrado() {
    this.doc = '';
    this.revisionesTrabajoGrado = [];
    if (this.trabajoId === 0) {
      return;
    }

    const tipoDocumento = this.tiposDocumento.find(tipoDoc => tipoDoc.CodigoAbreviacion === 'DTR_PLX');
    if (!tipoDocumento) {
      return;
    }

    const uri = `query=DocumentoEscrito.TipoDocumentoEscrito:${tipoDocumento.Id},TrabajoGrado.Id:${this.trabajoId}&limit=0`;
    this.poluxCrud.get('documento_trabajo_grado', uri)
      .subscribe((respuestaDocumentoTrabajoGrado: DocumentoTrabajoGrado[]) => {
      });
  }

  private consultarRevisionesTrabajoGrado() {
    const uri = `query=DocumentoTrabajoGrado.TrabajoGrado.Id:${this.trabajoId}&limit=0`;
    this.poluxCrud.get('revision_trabajo_grado', uri)
      .subscribe((respuestaRevisionesTrabajoGrado: RevisionTrabajoGrado[]) => {
        if (respuestaRevisionesTrabajoGrado.length) {
          this.doc = respuestaRevisionesTrabajoGrado[0].DocumentoTrabajoGrado.DocumentoEscrito.Enlace;
          this.revisionesTrabajoGrado = respuestaRevisionesTrabajoGrado
            .map((rev) => this.parametros.fillPropiedad(rev, 'EstadoRevisionTrabajoGrado', this.estadosRevision));
        }
      });
  }

  trabajoGrado: any = {};
  vinculados: VinculacionTrabajoGradoNombre[] = [];
  informacionAcademica: any = {};

  private consultarDocumentoTrabajoGradoEst(trabajoGrado: TrabajoGrado): Promise<void> {
    return new Promise((resolve, reject) => {
      const estadoTrabajoGrado = this.estadosTrabajoGrado.find(estado => estado.Id === trabajoGrado.EstadoTrabajoGrado);
      const tipoDocumento = this.tiposDocumento.find(tipoDoc => tipoDoc.CodigoAbreviacion === 'DTR_PLX');
      if (!tipoDocumento || !estadoTrabajoGrado) {
        reject('No tipo documento');
        return;
      }

      const estadoTrabajoGradoAceptada = ['APR_PLX', 'RVS_PLX', 'AVI_PLX', 'AMO_PLX',
        'SRV_PLX', 'SRVS_PLX', 'ASVI_PLX', 'ASMO_PLX', 'PAEA_PLX', 'PECSPR_PLX',
        'EC_PLX', 'PR_PLX', 'ER_PLX', 'MOD_PLX', 'LPS_PLX', 'STN_PLX', 'NTF_PLX'];
      const tipoDocumentoId = estadoTrabajoGradoAceptada.includes(estadoTrabajoGrado.CodigoAbreviacion) ? tipoDocumento.Id : 0;
      if (tipoDocumentoId === 0) {
        reject('No tipo documento');
        return;
      }

      const uri = `limit=1&query=DocumentoEscrito.TipoDocumentoEscrito:${tipoDocumentoId},TrabajoGrado.Id:${trabajoGrado.Id}`;
      this.poluxCrud.get('documento_trabajo_grado', uri)
        .subscribe((respuestaDocumentoTrabajoGrado: DocumentoTrabajoGrado[]) => {
          if (respuestaDocumentoTrabajoGrado.length > 0) {
            this.trabajoGrado.documentoEscrito = respuestaDocumentoTrabajoGrado[0].DocumentoEscrito;
            resolve();
          } else {
            reject('No documento en trabajo de grado');
          }
        });
    });
  }

  private consultarVinculacionTrabajoGradoEst(trabajoGrado: TrabajoGrado): Promise<void> {
    return new Promise((resolve, reject) => {
      const consultasVinculados: any[] = [];
      const uri = `query=Activo:true,TrabajoGrado.Id:${trabajoGrado.Id}&limit=0`;
      this.poluxCrud.get('vinculacion_trabajo_grado', uri)
        .subscribe(async (respuestaVinculaciones: VinculacionTrabajoGradoNombre[]) => {
          if (respuestaVinculaciones.length) {
            respuestaVinculaciones.forEach(vinculacionTrabajoGrado => {
              const rolTrabajoGrado = this.rolesTrabajoGrado.find(rol => rol.Id === vinculacionTrabajoGrado.RolTrabajoGrado);
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
        })
    })
  }

  private consultarDirectorExterno(vinculacionTrabajoGrado: VinculacionTrabajoGradoNombre) {
    this.poluxCrud.get('detalle_pasantia', `query=TrabajoGrado.Id:${vinculacionTrabajoGrado.TrabajoGrado.Id}&limit=1`)
      .subscribe((docenteExterno: DetallePasantia[]) => {
        if (docenteExterno.length > 0) {
          let resultadoDocenteExterno = docenteExterno[0].Observaciones.split(' y dirigida por ');
          resultadoDocenteExterno = resultadoDocenteExterno[1].split(' con número de identificacion ');
          vinculacionTrabajoGrado.Nombre = resultadoDocenteExterno[0];
        }
      });
  }

  private consultarDocenteTrabajoGrado(vinculacionTrabajoGrado: VinculacionTrabajoGradoNombre) {
    this.academica.get('docente_tg', `${vinculacionTrabajoGrado.Usuario}`)
      .subscribe((docenteDirector) => {
        if (docenteDirector.docenteTg.docente) {
          vinculacionTrabajoGrado.Nombre = docenteDirector.docenteTg.docente[0].nombre;
        }
      })
  }

  private consultarInformacionAcademicaDelEstudiante(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.academica.getPeriodoAnterior()
        .then((periodoAcademicoPrevio) => {
          this.academica.get('datos_estudiante', `${this.codigoEstudiante}/${periodoAcademicoPrevio.anio}/${periodoAcademicoPrevio.periodo}`)
            .subscribe((estudianteConsultado) => {
              resolve();
              if (estudianteConsultado.estudianteCollection.datosEstudiante) {
                this.informacionAcademica = estudianteConsultado.estudianteCollection.datosEstudiante[0];
              }
            });
        });
    })
  }

  private async getParametrosEstudiante() {
    await Promise.all([
      this.getEstadosTrabajoGrado(),
      this.getRolesTrabajoGrado(),
      this.getEstadosRevision(),
      this.getTipoDocumento(),
      this.getEstadosEstudiante(),
    ]);

    const estadosValidos = ['APR_PLX', 'RVS_PLX', 'AVI_PLX', 'AMO_PLX', 'SRV_PLX', 'SRVS_PLX', 'ASVI_PLX',
      'ASMO_PLX', 'ASNV_PLX', 'EC_PLX', 'PR_PLX', 'ER_PLX', 'MOD_PLX', 'LPS_PLX', 'STN_PLX', 'NTF_PLX'];

    const idsEstados: number[] = this.estadosTrabajoGrado
      .filter(estado => estadosValidos.includes(estado.CodigoAbreviacion))
      .map(estadoValido => estadoValido.Id);
    const estadoEstudianteTrabajoGrado = this.estadosEstudiante.find(estEstTrGr => estEstTrGr.CodigoAbreviacion === 'EST_ACT_PLX');

    if (!estadoEstudianteTrabajoGrado) {
      // alert no estado estudiante
      return;
    }

    const uri = `limit=0&query=TrabajoGrado.EstadoTrabajoGrado.in:${idsEstados.join('|')}`; +
      `,EstadoEstudianteTrabajoGrado:${estadoEstudianteTrabajoGrado.Id},Estudiante:${this.codigoEstudiante}`;
    this.poluxCrud.get('estudiante_trabajo_grado', uri)
      .subscribe(async (estudiante: EstudianteTrabajoGrado[]) => {
        if (estudiante.length) {
          this.trabajoId = estudiante[0].TrabajoGrado.Id;
          this.consultarRevisionesTrabajoGrado();
          await Promise.all([
            this.consultarInformacionAcademicaDelEstudiante(),
            this.consultarDocumentoTrabajoGradoEst(estudiante[0].TrabajoGrado),
            this.consultarVinculacionTrabajoGradoEst(estudiante[0].TrabajoGrado),
          ]);
        }
      })

  }

}
