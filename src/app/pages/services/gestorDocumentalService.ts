import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { mergeMap } from 'rxjs/operators';
import { RequestManager } from 'src/app/core/manager/request.service';
import { environment } from 'src/environments/environment';
// import { Documento } from '../../@core/data/models/documento';
// import { PopUpManager } from '../../managers/popUpManager';

@Injectable({
  providedIn: 'root',
})

export class GestorDocumentalService {

  constructor(
    private rqManager: RequestManager,
  ) { }

  getByEnlace(enlace: string) {
    return this.rqManager.get(environment.GESTOR_DOCUMENTAL_SERVICE, `document/${enlace}`)
  }

  getUrlFile(base64: any, minetype: any): Promise<string> {
    return new Promise((resolve, reject) => {
      const url = `data:${minetype};base64,${base64}`;
      fetch(url)
        .then(res => res.blob())
        .then(blob => {
          const file = new File([blob], 'File name', { type: minetype });
          const urlF = URL.createObjectURL(file);
          resolve(urlF);
        });
    });
  }

  public fileToBase64(file: any) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        let encoded = reader.result?.toString().replace(/^data:(.*,)?/, '');
        if (encoded && encoded.length % 4 > 0) {
          encoded += '='.repeat(4 - (encoded.length % 4));
        }
        resolve(encoded);
      };
      reader.onerror = error => reject(error);
    });
  }

  public uploadFiles(files: any[]) {
    const documentsSubject = new Subject<any[]>();
    const documents$ = documentsSubject.asObservable();

    const documentos: any = [];

    files.map(async (file) => {
      const sendFileData = [{
        IdTipoDocumento: file.IdDocumento,
        nombre: file.nombre,
        metadatos: {
          NombreArchivo: file.nombre,
          Tipo: 'Archivo',
          Observaciones: file.nombre,
          'dc:title': file.nombre,
        },
        descripcion: file.nombre,
        file: await this.fileToBase64(file.file),
      }];

      return this.rqManager.post(environment.GESTOR_DOCUMENTAL_SERVICE, 'document/upload', sendFileData)
        .subscribe((dataResponse) => {
          documentos.push(dataResponse);
          if (documentos.length === files.length) {
            documentsSubject.next(documentos);
          }
        });
    });

    return documents$;
  }

}
