import { Component, Input, OnInit } from '@angular/core';
import { Correccion } from 'src/app/shared/models/correccion.model';
import { RevisionTrabajoGradoDetalle } from 'src/app/shared/models/revisionTrabajoGrado.model';
import { PoluxCrudService } from '../../services/poluxCrudService';
import { Comentario } from 'src/app/shared/models/comentario.model';
import { GestorDocumentalService } from '../../services/gestorDocumentalService';
import { AlertService } from '../../services/alertService';

type ComentariosCorreccion = {
  Comentarios: Comentario[];
  Correccion: Correccion;
  NuevoComentario: string;
};

@Component({
  selector: 'app-ver-revision',
  templateUrl: './ver-revision.component.html',
  styleUrls: ['./ver-revision.component.scss']
})

export class VerRevisionComponent implements OnInit {
  @Input() revision: RevisionTrabajoGradoDetalle = new RevisionTrabajoGradoDetalle;
  @Input() autor = '';

  correcciones: Correccion[] = [];
  comentariosCorreccion: ComentariosCorreccion[] = [];
  nuevoComentario: string = '';

  constructor(
    private polux: PoluxCrudService,
    private gestorDocumental: GestorDocumentalService,
    private alert: AlertService,
  ) { }

  ngOnInit(): void {
    this.cargarComentarios();
  }

  private cargarComentarios(): void {
    this.polux.get('comentario', `query=Correccion.RevisionTrabajoGrado.Id:${this.revision.Id}&sortby=Id&order=asc`)
      .subscribe((responseComentarios: Comentario[]) => {
        this.comentariosCorreccion = this.agruparComentarios(responseComentarios);
      });
  }

  private agruparComentarios(array: Comentario[]): ComentariosCorreccion[] {
    const agrupados: ComentariosCorreccion[] = [];
    array.forEach((currentValue) => {
      const existingGroup = agrupados.find(group => group.Correccion.Id === currentValue.Correccion.Id);

      if (!existingGroup) {
        agrupados.push({
          Correccion: currentValue.Correccion,
          Comentarios: [currentValue],
          NuevoComentario: '',
        });
      } else {
        existingGroup.Comentarios.push(currentValue);
      }
    });

    return agrupados;
  }

  public postComentario(correccion: ComentariosCorreccion): void {

    if (!correccion.NuevoComentario.length) {
      return
    }

    const nuevoComentario = <Comentario>{
      Id: 0,
      Comentario: correccion.NuevoComentario,
      Fecha: new Date(),
      Autor: this.autor,
      Correccion: <Correccion>{ Id: correccion.Correccion.Id },
    }

    correccion.NuevoComentario = '';
    this.polux.post('comentario', nuevoComentario)
      .subscribe({
        next: (responseNuevoComentario: Comentario) => {
          if (responseNuevoComentario && responseNuevoComentario.Id > 0) {
            correccion.Comentarios.push(nuevoComentario);
          } else {
            this.alert.error('Ocurrió un error al registrar el comentario. Intente de nuevo.');
          }
        }, error: () => {
          this.alert.error('Ocurrió un error al registrar el comentario. Intente de nuevo.');
        },
      });
  }

  public descargarArchivo(uuid: string): void {
    if (!uuid.length) {
      return;
    }

    this.gestorDocumental.getByEnlace(uuid)
      .subscribe(async (responseDocumento) => {
        const url = await this.gestorDocumental.getUrlFile(responseDocumento.file, responseDocumento['file:content']['mime-type']);
        if (url) {
          window.open(url, '_blank');
        }
      });
  }

}
