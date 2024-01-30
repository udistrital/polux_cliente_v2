import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { MatTreeFlatDataSource, MatTreeFlattener } from '@angular/material/tree';
import { FlatTreeControl } from '@angular/cdk/tree';
import { TipoDocumento } from 'src/app/shared/models/tipoDocumento.model';
import { PoluxCrudService } from '../../services/poluxCrudService';
import { DocumentoTrabajoGrado } from 'src/app/shared/models/documentoTrabajoGrado.model';

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
export class VersionesDocumentoComponent implements OnChanges {
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
    private polux: PoluxCrudService,
  ) {
    this.sourceArbol.data = [];
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.tiposDocumento.length > 0 && this.trabajoGradoId > 0) {
      this.cargarDocumentos();
    }
  }

  private cargarDocumentos() {
    const tiposDocumento = this.tiposDocumento
      .filter(tipo => ['DTR_PLX', 'DGRREV_PLX'].includes(tipo.CodigoAbreviacion));

    const uri = `limit=-1&query=TrabajoGrado.Id:${this.trabajoGradoId},` +
      `DocumentoEscrito.TipoDocumentoEscrito.in:` +
      `${tiposDocumento.map(tipo => tipo.Id).join('|')}`;
    this.polux.get('documento_trabajo_grado', uri)
      .subscribe({
        next: (respuestaDocumentos: DocumentoTrabajoGrado[]) => {
          if (respuestaDocumentos.length) {
            respuestaDocumentos.forEach((doc: any) => doc.name = doc.DocumentoEscrito.Titulo);
            const nodes = [];
            for (const tipoDocumento of tiposDocumento) {
              const node: any = {};
              if (tipoDocumento.CodigoAbreviacion === 'DTR_PLX') {
                node.name = 'Trabajo de Grado';
              } else if (tipoDocumento.CodigoAbreviacion === 'DGRREV_PLX') {
                node.name = 'Trabajo de Grado para Revisión';
              }

              node.children = respuestaDocumentos
                .filter((doc) => doc.DocumentoEscrito.TipoDocumentoEscrito === tipoDocumento.Id);
              nodes.push(node);
            }
            this.sourceArbol.data = nodes;
          }
        }, error: () => {

        }
      });
  }
}
