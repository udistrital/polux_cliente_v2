import { Component, OnInit } from '@angular/core';
import { RequestManager } from 'src/app/core/manager/request.service';
import { VinculacionTrabajoGrado } from 'src/app/shared/models/vinculacionTrabajoGrado.model';
import { environment } from 'src/environments/environment';
import { UserService } from '../../services/userService';
import { TrabajoGrado } from 'src/app/shared/models/trabajoGrado.model';
import { DocumentoTrabajoGrado } from 'src/app/shared/models/documentoTrabajoGrado.model';
import { GestorDocumentalService } from '../../services/gestorDocumentalService';
import { DomSanitizer } from '@angular/platform-browser';

@Component({
  selector: 'app-lista-trabajos',
  templateUrl: './lista-trabajos.component.html',
  styleUrls: ['./lista-trabajos.component.scss']
})
export class ListaTrabajosComponent implements OnInit {
  trabajosDirigidos: VinculacionTrabajoGrado[] = [];
  documento = '';
  trabajoSeleccionadoId = 0;
  doc: any;

  constructor(
    private request: RequestManager,
    private userService: UserService,
    private gestorDocumental: GestorDocumentalService,
    private sanitization: DomSanitizer,
  ) {
    this.documento = this.userService.user.userService?.documento;
  }

  ngOnInit(): void {
    this.consultarVinculacionesDirector();
  }

  private consultarVinculacionesDirector(): void {
    if (!this.documento.length) {
      // alert no documento
      return;
    }

    const uri = 'query=TrabajoGrado.EstadoTrabajoGrado.Id.in:1|4|5|6|8|9|10|11|12|13|14|15|16|17|18|19|21|22,' +
      `RolTrabajoGrado.Id.in:1|4,Activo:true,Usuario:${this.documento}&limit=0`
    this.request.get(environment.POLUX_SERVICE, `vinculacion_trabajo_grado?${uri}`)
      .subscribe((respuestaVinculaciones: VinculacionTrabajoGrado[]) => {
        this.trabajosDirigidos = respuestaVinculaciones;
      });
  }

  public consultarDocumentoTrabajoGrado() {
    if (this.trabajoSeleccionadoId === 0) {
      this.doc = '';
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

  private consultarRevisionesTrabajoGrado(documentoSeleccionadoId: number) {
    const uri = `query=DocumentoTrabajoGrado.TrabajoGrado.Id:${documentoSeleccionadoId}&limit=0`;
    this.request.get(environment.POLUX_SERVICE, `revision_trabajo_grado?${uri}`)
      .subscribe((respuestaRevisionesTrabajoGrado) => {
        if (respuestaRevisionesTrabajoGrado.length) {
          this.gestorDocumental.getByEnlace(respuestaRevisionesTrabajoGrado[0].DocumentoTrabajoGrado.DocumentoEscrito.Enlace)
            .subscribe(async (ss) => {
              const url = await this.gestorDocumental.getUrlFile(ss.file, ss['file:content']['mime-type']);
              if (url) {
                this.doc = this.sanitization.bypassSecurityTrustResourceUrl(url.toString());
              }

            })
        }
      });
  }

}
