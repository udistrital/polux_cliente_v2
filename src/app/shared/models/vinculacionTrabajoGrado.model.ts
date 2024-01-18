import { Parametro } from "./parametro.model";
import { TrabajoGrado, TrabajoGradoDetalle } from "./trabajoGrado.model";

export class VinculacionTrabajoGrado {
	Id!: number;
	Usuario!: number;
	Activo!: boolean;
	FechaInicio!: Date;
	FechaFin!: Date;
	RolTrabajoGrado!: number | Parametro | undefined;
	TrabajoGrado!: TrabajoGrado;
}

export class VinculacionTrabajoGradoNombre extends VinculacionTrabajoGrado {
	Nombre = '';
	Nota: number | string = 0;
}

export class VinculacionTrabajoGradoDetalle extends VinculacionTrabajoGrado {
	override RolTrabajoGrado!: Parametro;
	override TrabajoGrado!: TrabajoGradoDetalle;
	Nombre = '';
	Nota: number | string = 0;
}
