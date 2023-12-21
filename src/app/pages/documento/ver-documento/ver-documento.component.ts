import { Component, Input, OnInit } from '@angular/core';
import { GestorDocumentalService } from '../../services/gestorDocumentalService';
import { DomSanitizer } from '@angular/platform-browser';

@Component({
  selector: 'app-ver-documento',
  templateUrl: './ver-documento.component.html',
  styleUrls: ['./ver-documento.component.scss']
})
export class VerDocumentoComponent implements OnInit {
  @Input() enlace = '';
  @Input() documentoId = 0;

  doc: any;

  constructor(
    private gestorDocumental: GestorDocumentalService,
    private sanitization: DomSanitizer,
  ) { }

  ngOnInit(): void {
    if (this.enlace) {
      this.gestorDocumental.getByEnlace(this.enlace)
        .subscribe(async (respuestaDocumento) => {
          const url = await this.gestorDocumental.getUrlFile(respuestaDocumento.file, respuestaDocumento['file:content']['mime-type']);
          if (url) {
            this.doc = this.sanitization.bypassSecurityTrustResourceUrl(url.toString());
          }
        });
    }
  }

}
