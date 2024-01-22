import { Parametro } from "./parametro.model";
import { TrabajoGrado } from "./trabajoGrado.model";

export class AsignaturaTrabajoGrado {
	Id!: number;
	CodigoAsignatura!: number;
	Periodo!: number;
	Anio!: number;
	Aprobacion!: string;
	Calificacion!: number;
	TrabajoGrado!: TrabajoGrado;
	EstadoAsignaturaTrabajoGrado!: number | Parametro | undefined;
	Activo!: boolean;
	FechaCreacion!: string;
	FechaModificacion!: string;
}

export class AsignaturaTrabajoGradoDetalle extends AsignaturaTrabajoGrado {
	override EstadoAsignaturaTrabajoGrado!: Parametro;
}
