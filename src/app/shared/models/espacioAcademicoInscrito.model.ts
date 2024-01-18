import { EspaciosAcademicosElegibles } from "./espaciosAcademicosElegibles.model";
import { TrabajoGrado } from "./trabajoGrado.model";

export class EspacioAcademicoInscrito {
	Id!: number;
	Nota!: number;
	EspaciosAcademicosElegibles!: EspaciosAcademicosElegibles;
	EstadoEspacioAcademicoInscrito!: number;
	TrabajoGrado!: TrabajoGrado
}

export class EspacioAcademicoInscritoDetalle extends EspacioAcademicoInscrito {
	Nombre = '';
}
