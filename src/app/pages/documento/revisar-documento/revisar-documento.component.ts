import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Comentario } from 'src/app/shared/models/comentario.model';
import { Correccion } from 'src/app/shared/models/correccion.model';
import { Parametro } from 'src/app/shared/models/parametro.model';
import { RevisionTrabajoGrado, RevisionTrabajoGradoDetalle } from 'src/app/shared/models/revisionTrabajoGrado.model';
import { PoluxCrudService } from '../../services/poluxCrudService';

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
  @Output() volver = new EventEmitter<void>();
  autor = '';

  comentariosCorreccion: ComentarioCorreccion[] = [];

  constructor(
    private polux: PoluxCrudService,
  ) {
    this.comentariosCorreccion.push(new ComentarioCorreccion());
  }
  ngOnInit(): void {
  }

  public postRevision(): void {
    this.comentariosCorreccion.forEach(comentarioCorreccion => {
      comentarioCorreccion.Comentarios.forEach(comentario => {
        comentario.Autor = this.autor;
        comentario.Fecha = new Date();
      })
    })

    const estado = this.estadosRevisiones.find(estado => estado.CodigoAbreviacion === 'FINALIZADA_PLX');
    if (!estado) {
      // alerta no estado
      return;
    }

    const trRevision = <TrRevision>{
      Correcciones: this.comentariosCorreccion,
      RevisionTrabajoGrado: <RevisionTrabajoGrado>{
        Id: this.revision.Id,
        EstadoRevisionTrabajoGrado: estado.Id,
        FechaRevision: new Date(),
      }
    }

    this.polux.post('tr_registrar_revision_tg', trRevision)
      .subscribe(respuesta => {
        if (Array.isArray(respuesta) && respuesta.length === 1 && respuesta[0] === 'Success') {
          // alerta ok
          this.volver.emit();
        } else {
          // alerta error
        }
      })
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
