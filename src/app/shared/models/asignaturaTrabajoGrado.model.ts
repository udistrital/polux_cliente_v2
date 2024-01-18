import { TrabajoGrado } from "./trabajoGrado.model";

export class AsignaturaTrabajoGrado {
	Id!: number;
	CodigoAsignatura!: number;
	Periodo!: number;
	Anio!: number;
	Aprobacion!: string;
	Calificacion!: number;
	TrabajoGrado!: TrabajoGrado;
	EstadoAsignaturaTrabajoGrado!: number;
	Activo!: boolean;
	FechaCreacion!: string;
	FechaModificacion!: string;
}
