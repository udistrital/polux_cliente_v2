import { DocumentoTrabajoGrado } from "./documentoTrabajoGrado.model";
import { Parametro } from "./parametro.model";
import { VinculacionTrabajoGrado } from "./vinculacionTrabajoGrado.model";

export class RevisionTrabajoGrado {
	Id!: number;
	NumeroRevision!: number;
	FechaRecepcion!: Date;
	FechaRevision!: Date;
	EstadoRevisionTrabajoGrado!: number | Parametro;
	DocumentoTrabajoGrado!: DocumentoTrabajoGrado;
	VinculacionTrabajoGrado!: VinculacionTrabajoGrado;
}

export class RevisionTrabajoGradoDetalle extends RevisionTrabajoGrado {
	override EstadoRevisionTrabajoGrado!: Parametro;
}
