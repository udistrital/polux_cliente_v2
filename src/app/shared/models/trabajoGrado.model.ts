import { DistincionTrabajoGrado } from "./distincionTrabajoGrado.model";
import { Parametro } from "./parametro.model";

export class TrabajoGrado {
	Id!: number;
	Titulo!: string;
	Modalidad!: number | Parametro;
	EstadoTrabajoGrado!: number | Parametro;
	DistincionTrabajoGrado!: DistincionTrabajoGrado;
	PeriodoAcademico!: string;
	Objetivo!: string;
}

export class TrabajoGradoDetalle extends TrabajoGrado {
	override EstadoTrabajoGrado!: Parametro;
	override Modalidad!: Parametro;
}
