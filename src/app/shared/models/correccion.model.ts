import { RevisionTrabajoGrado, RevisionTrabajoGradoDetalle } from "./revisionTrabajoGrado.model";

export class Correccion {
	Id!: number;
	Observacion!: string;
	Pagina!: number;
	RevisionTrabajoGrado!: RevisionTrabajoGrado;
	Documento!: boolean;
}

export class CorreccionDetalle extends Correccion {
	override RevisionTrabajoGrado!: RevisionTrabajoGradoDetalle;
}
