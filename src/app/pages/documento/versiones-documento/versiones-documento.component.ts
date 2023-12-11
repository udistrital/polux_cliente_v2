import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { RequestManager } from 'src/app/core/manager/request.service';
import { environment } from 'src/environments/environment';
import { MatTreeFlatDataSource, MatTreeFlattener } from '@angular/material/tree';
import { FlatTreeControl } from '@angular/cdk/tree';
import { TipoDocumento } from 'src/app/shared/models/tipoDocumento.model';

interface ExampleFlatNode {
  expandable: boolean;
  name: string;
  level: number;
}

@Component({
  selector: 'app-versiones-documento',
  templateUrl: './versiones-documento.component.html',
  styleUrls: ['./versiones-documento.component.scss']
})
export class VersionesDocumentoComponent implements OnInit, OnChanges {
  @Input() tiposDocumento: TipoDocumento[] = [];
  @Input() trabajoGradoId = 0;

  private _transformer = (node: any, level: number) => {
    return {
      expandable: !!node.children && node.children.length > 0,
      name: node.name,
      level: level,
    };
  };

  treeControl = new FlatTreeControl<ExampleFlatNode>(
    node => node.level,
    node => node.expandable,
  );

  treeFlattener = new MatTreeFlattener(
    this._transformer,
    node => node.level,
    node => node.expandable,
    node => node.children,
  );

  sourceArbol = new MatTreeFlatDataSource(this.treeControl, this.treeFlattener);

  hasChild = (_: number, node: ExampleFlatNode) => node.expandable;

  constructor(
    private request: RequestManager,
  ) {
    this.sourceArbol.data = [];
  }

  ngOnInit(): void {
    this.cargarDocumentos();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes['trabajoGradoId'].firstChange) {
      this.cargarDocumentos();
    }
  }

  private cargarDocumentos() {
    for (const tipoDocumento of this.tiposDocumento) {
      const uri = `query=TrabajoGrado.Id:${this.trabajoGradoId},DocumentoEscrito.TipoDocumentoEscrito:${tipoDocumento.Id}&limit=-1`;
      this.request.get(environment.POLUX_SERVICE, `documento_trabajo_grado?${uri}`)
        .subscribe((respuestaDocumentos: any[]) => {
          if (respuestaDocumentos.length) {
            const node: any = {};
            if (tipoDocumento.CodigoAbreviacion === 'DTR_PLX') {
              node.name = 'Trabajo de Grado';
            } else if (tipoDocumento.CodigoAbreviacion === 'DGRREV_PLX') {
              node.name = 'Trabajo de Grado para Revisión';
            }

            respuestaDocumentos.forEach(doc => doc.name = doc.DocumentoEscrito.Titulo);
            node.children = respuestaDocumentos;
            this.sourceArbol.data = [node];
          }
        });
    }
  }
}
