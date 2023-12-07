import { Correccion } from "./correccion.model";

export class Comentario {
	Id!: number;
	Comentario!: string;
	Fecha!: Date;
	Autor!: string;
	Correccion!: Correccion;
}
