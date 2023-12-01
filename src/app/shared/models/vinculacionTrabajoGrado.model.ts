import { RolTrabajoGrado } from "./rolTrabajoGrado.model";
import { TrabajoGrado } from "./trabajoGrado.model";

export class VinculacionTrabajoGrado {
	Id!: number;
	Usuario!: number;
	Activo!: boolean;
	FechaInicio!: Date;
	FechaFin!: Date;
	RolTrabajoGrado!: RolTrabajoGrado;
	TrabajoGrado!: TrabajoGrado;
}