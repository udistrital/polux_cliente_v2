import { DocumentoEscrito } from "./documentoEscrito.model";
import { TrabajoGrado } from "./trabajoGrado.model"

export class DocumentoTrabajoGrado {
	Id!: number;
	TrabajoGrado!: TrabajoGrado;
	DocumentoEscrito!: DocumentoEscrito;
}
