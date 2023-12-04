import { Component } from '@angular/core';

@Component({
  selector: 'app-revisar-documento',
  templateUrl: './revisar-documento.component.html',
  styleUrls: ['./revisar-documento.component.scss']
})
export class RevisarDocumentoComponent {

  correcciones: any[] = [
    { Observacion: '' }
  ];
}
