import { Component, OnInit } from '@angular/core';
import { RequestManager } from 'src/app/core/manager/request.service';
import { VinculacionTrabajoGrado, VinculacionTrabajoGradoDetalle } from 'src/app/shared/models/vinculacionTrabajoGrado.model';
import { environment } from 'src/environments/environment';
import { UserService } from '../../services/userService';
import { DocumentoTrabajoGrado } from 'src/app/shared/models/documentoTrabajoGrado.model';
import { GestorDocumentalService } from '../../services/gestorDocumentalService';
import { DomSanitizer } from '@angular/platform-browser';
import { ParametrosService } from '../../services/parametrosService';
import { Parametro } from 'src/app/shared/models/parametro.model';
import { firstValueFrom } from 'rxjs';
import { RevisionTrabajoGrado, RevisionTrabajoGradoDetalle } from 'src/app/shared/models/revisionTrabajoGrado.model';

@Component({
  selector: 'app-lista-trabajos',
  templateUrl: './lista-trabajos.component.html',
  styleUrls: ['./lista-trabajos.component.scss']
})
export class ListaTrabajosComponent implements OnInit {
  trabajosDirigidos: VinculacionTrabajoGradoDetalle[] = [];
  estadosTrabajoGrado: Parametro[] = [];
  rolesTrabajoGrado: Parametro[] = [];
  modalidades: Parametro[] = [];
  estadosRevision: Parametro[] = [];

  documento = '';
  trabajoSeleccionadoId = 0;
  revisionesTrabajoGrado: RevisionTrabajoGradoDetalle[] = [];
  doc: any;

  constructor(
    private request: RequestManager,
    private userService: UserService,
    private gestorDocumental: GestorDocumentalService,
    private parametros: ParametrosService,
    private sanitization: DomSanitizer,
  ) {
    this.documento = this.userService.user.userService?.documento;
  }

  ngOnInit(): void {
    this.getParametros();
  }

  private async getParametros() {
    await Promise.all([this.getEstadosTrabajoGrado(), this.getRolesTrabajoGrado(), this.getModalidades(), this.getEstadosRevision()]);
    this.consultarVinculacionTrabajoGrado();
  }

  private getEstadosTrabajoGrado(): Promise<void> {
    return new Promise(async (resolve, reject) => {
      this.estadosTrabajoGrado = await firstValueFrom(this.parametros.getEstadosTrabajoGrado());
      resolve();
    });
  }

  private getRolesTrabajoGrado(): Promise<void> {
    return new Promise(async (resolve, reject) => {
      this.rolesTrabajoGrado = await firstValueFrom(this.parametros.getRolesTrabajoGrado());
      resolve();
    });
  }

  private getModalidades(): Promise<void> {
    return new Promise(async (resolve, reject) => {
      this.modalidades = await firstValueFrom(this.parametros.getEstadosRevisionTrabajoGrado());
      resolve();
    });
  }

  private getEstadosRevision(): Promise<void> {
    return new Promise(async (resolve, reject) => {
      this.estadosRevision = await firstValueFrom(this.parametros.getEstadosRevisionTrabajoGrado());
      resolve();
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

    const uri = "limit=0&TrabajoGrado.EstadoTrabajoGrado.in:" + idsEstados.join('|')
      + ',RolTrabajoGrado.in:' + idsRoles.join('|')
      + ',Activo:true,Usuario:' + this.documento;

    this.request.get(environment.POLUX_SERVICE, `vinculacion_trabajo_grado?${uri}`)
      .subscribe((respuestaVinculaciones: VinculacionTrabajoGrado[]) => {
        this.trabajosDirigidos = respuestaVinculaciones
          .map((rev) => this.parametros.fillPropiedad(rev, 'RolTrabajoGrado', this.rolesTrabajoGrado))
          .map((rev) => this.parametros.fillPropiedad(rev, 'TrabajoGrado.EstadoTrabajoGrado', this.rolesTrabajoGrado))
          .map((rev) => this.parametros.fillPropiedad(rev, 'TrabajoGrado.Modalidad', this.modalidades));
      });
  }

  public consultarDocumentoTrabajoGrado() {
    this.doc = '';
    this.revisionesTrabajoGrado = [];
    if (this.trabajoSeleccionadoId === 0) {
      return;
    }

    const uri = `query=DocumentoEscrito.TipoDocumentoEscrito:4,TrabajoGrado.Id:${this.trabajoSeleccionadoId}&limit=0`;
    this.request.get(environment.POLUX_SERVICE, `documento_trabajo_grado?${uri}`)
      .subscribe((respuestaDocumentoTrabajoGrado: DocumentoTrabajoGrado[]) => {
        if (respuestaDocumentoTrabajoGrado.length && respuestaDocumentoTrabajoGrado[0].Id) {
          this.consultarRevisionesTrabajoGrado(respuestaDocumentoTrabajoGrado[0].Id);
        }
      });
  }

  private consultarRevisionesTrabajoGrado(documentoTrabajoGradoId: number) {
    const uri = `query=DocumentoTrabajoGrado.TrabajoGrado.Id:${this.trabajoSeleccionadoId}&limit=0`;
    this.request.get(environment.POLUX_SERVICE, `revision_trabajo_grado?${uri}`)
      .subscribe((respuestaRevisionesTrabajoGrado: RevisionTrabajoGrado[]) => {
        if (respuestaRevisionesTrabajoGrado.length) {
          this.revisionesTrabajoGrado = respuestaRevisionesTrabajoGrado
            .map((rev) => this.parametros.fillPropiedad(rev, 'EstadoRevisionTrabajoGrado', this.estadosRevision));

          this.gestorDocumental.getByEnlace(respuestaRevisionesTrabajoGrado[0].DocumentoTrabajoGrado.DocumentoEscrito.Enlace)
            .subscribe(async (ss) => {
              const url = await this.gestorDocumental.getUrlFile(ss.file, ss['file:content']['mime-type']);
              if (url) {
                this.doc = this.sanitization.bypassSecurityTrustResourceUrl(url.toString());
              }
            });
        }
      });
  }

}
