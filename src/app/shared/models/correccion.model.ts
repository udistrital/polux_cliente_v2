import { RevisionTrabajoGrado, RevisionTrabajoGradoDetalle } from "./revisionTrabajoGrado.model";

export class Correccion {
	Id!: number;
	Observacion!: string;
	Pagina!: number;
	RevisionTrabajoGrado!: RevisionTrabajoGrado;
	EnlaceDocumento!: string;
	Archivo!: File;
}

export class CorreccionDetalle extends Correccion {
	override RevisionTrabajoGrado!: RevisionTrabajoGradoDetalle;
}
