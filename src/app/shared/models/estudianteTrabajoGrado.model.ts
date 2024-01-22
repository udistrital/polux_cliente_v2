import { TrabajoGrado, TrabajoGradoDetalle } from "./trabajoGrado.model";

export class EstudianteTrabajoGrado {
	Id!: number;
	Estudiante!: string;
	TrabajoGrado!: TrabajoGrado;
	EstadoEstudianteTrabajoGrado!: number;
}

export class EstudianteTrabajoGradoDetalle extends EstudianteTrabajoGrado {
	override TrabajoGrado!: TrabajoGradoDetalle;
}
