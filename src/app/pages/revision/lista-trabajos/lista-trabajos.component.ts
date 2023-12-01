import { Component, OnInit } from '@angular/core';
import { RequestManager } from 'src/app/core/manager/request.service';
import { VinculacionTrabajoGrado } from 'src/app/shared/models/vinculacionTrabajoGrado.model';
import { environment } from 'src/environments/environment';
import { UserService } from '../../services/userService';
import { TrabajoGrado } from 'src/app/shared/models/trabajoGrado.model';

@Component({
  selector: 'app-lista-trabajos',
  templateUrl: './lista-trabajos.component.html',
  styleUrls: ['./lista-trabajos.component.scss']
})
export class ListaTrabajosComponent implements OnInit {
  trabajosDirigidos: VinculacionTrabajoGrado[] = [];
  documento = '';
  trabajoSeleccionadoId = 0;

  constructor(
    private request: RequestManager,
    private userService: UserService,
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

}
