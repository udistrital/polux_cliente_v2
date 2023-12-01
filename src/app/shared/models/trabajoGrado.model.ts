import { DistincionTrabajoGrado } from "./distincionTrabajoGrado.model";
import { EstadoTrabajoGrado } from "./estadoTrabajoGrado.model";
import { Modalidad } from "./modalidad.model";

export class TrabajoGrado {
	Id!: number;
	Titulo!: string;
	Modalidad!: Modalidad;
	EstadoTrabajoGrado!: EstadoTrabajoGrado;
	DistincionTrabajoGrado!: DistincionTrabajoGrado;
	PeriodoAcademico!: string;
	Objetivo!: string;
}
