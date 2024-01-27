import { TrabajoGrado } from "./trabajoGrado.model";

export interface Socializacion {
	Id: number;
	Fecha: Date;
	Lugar: number;
	TrabajoGrado: TrabajoGrado;
}
