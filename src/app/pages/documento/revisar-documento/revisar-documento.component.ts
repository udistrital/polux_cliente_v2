import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Comentario } from 'src/app/shared/models/comentario.model';
import { Correccion } from 'src/app/shared/models/correccion.model';
import { Parametro } from 'src/app/shared/models/parametro.model';
import { RevisionTrabajoGrado, RevisionTrabajoGradoDetalle } from 'src/app/shared/models/revisionTrabajoGrado.model';
import { PoluxCrudService } from '../../services/poluxCrudService';
import { AlertService } from '../../services/alertService';
import { GestorDocumentalService } from '../../services/gestorDocumentalService';
import { firstValueFrom } from 'rxjs';

class ComentarioCorreccion {
  Comentarios: Comentario[] = [new Comentario()];
  Correccion: Correccion = new Correccion();
}

type TrRevision = {
  Correcciones: ComentarioCorreccion[];
  RevisionTrabajoGrado: RevisionTrabajoGrado;
}

@Component({
  selector: 'app-revisar-documento',
  templateUrl: './revisar-documento.component.html',
  styleUrls: ['./revisar-documento.component.scss']
})
export class RevisarDocumentoComponent {
  @Input() revision: RevisionTrabajoGradoDetalle = new RevisionTrabajoGradoDetalle();
  @Input() estadosRevisiones: Parametro[] = [];
  @Input() tipoDocumentoId = 0;
  @Input() autor = '';
  @Output() volver = new EventEmitter<void>();

  comentariosCorreccion: ComentarioCorreccion[] = [];

  constructor(
    private polux: PoluxCrudService,
    private alert: AlertService,
    private gestorDocumental: GestorDocumentalService,
  ) {
    this.comentariosCorreccion.push(new ComentarioCorreccion());
  }

  private subirArchivo(adjunto: any, index: number): Promise<void> {
    return new Promise((resolve, reject) => {
      firstValueFrom(this.gestorDocumental.uploadFiles(adjunto))
        .then((response) => {
          if (response && Array.isArray(response) && response.length > 0 && response[0].res) {
            this.comentariosCorreccion[index].Correccion.EnlaceDocumento = response[0].res.Enlace;
            resolve();
          } else {
            reject('Ocurrió un error cargando el archivo adjunto. Intente de nuevo.')
          }
        })
        .catch(() => {
          reject('Ocurrió un error cargando el archivo adjunto. Intente de nuevo.')
        });
    });
  }

  public async postRevision(): Promise<void> {
    const estado = this.estadosRevisiones.find(estado => estado.CodigoAbreviacion === 'FINALIZADA_PLX');
    if (!estado || this.tipoDocumentoId === 0) {
      this.alert.error('No se puede registrar la revisión. Intente de nuevo.');
      return;
    }

    const promesasAdjuntos: Promise<void>[] = []
    this.comentariosCorreccion.forEach((comentarioCorreccion, i) => {
      if (comentarioCorreccion.Correccion.Archivo) {
        const nombre = 'Archivo adjunto corrección de trabajo de grado.';
        const adjunto = [{
          IdTipoDocumento: this.tipoDocumentoId,
          nombre,
          Observaciones: nombre,
          descripcion: nombre,
          file: comentarioCorreccion.Correccion.Archivo,
        }];

        promesasAdjuntos.push(this.subirArchivo(adjunto, i));
      }
      comentarioCorreccion.Comentarios.forEach(comentario => {
        comentario.Autor = this.autor;
        comentario.Fecha = new Date();
      });
    });

    await Promise.all(promesasAdjuntos)
      .catch((err) => this.alert.error(err));

    const trRevision = <TrRevision>{
      Correcciones: this.comentariosCorreccion,
      RevisionTrabajoGrado: <RevisionTrabajoGrado>{
        Id: this.revision.Id,
        EstadoRevisionTrabajoGrado: estado.Id,
        FechaRevision: new Date(),
      }
    }

    this.polux.post('tr_registrar_revision_tg', trRevision)
      .subscribe({
        next: (respuesta: string[]) => {
          if (Array.isArray(respuesta) && respuesta.length === 1 && respuesta[0] === 'Success') {
            this.alert.success('La revisión ha sido registrada exitosamente');
            this.volver.emit();
          } else {
            this.alert.error('Ocurrió un error al intentar registrar la revisión.');
          }
        }, error: () => {
          this.alert.error('Ocurrió un error al intentar registrar la revisión.');
        }
      });
  }

  public agregarCorreccion() {
    this.comentariosCorreccion.push(new ComentarioCorreccion);
  }

  public eliminarCorreccion(index: number) {
    this.comentariosCorreccion.splice(index, 1);
  }

  public agregarComentario(indexCorreccion: number) {
    this.comentariosCorreccion[indexCorreccion].Comentarios.push(new Comentario);
  }

  public eliminarComentario(indexCorreccion: number, indexComentario: number) {
    this.comentariosCorreccion[indexCorreccion].Comentarios.splice(indexComentario, 1);
  }

}
