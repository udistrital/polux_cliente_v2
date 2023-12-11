import { TrabajoGrado } from "./trabajoGrado.model";

export class EstudianteTrabajoGrado {
	Id!: number;
	Estudiante!: string;
	TrabajoGrado!: TrabajoGrado;
	EstadoEstudianteTrabajoGrado!: number;
}
