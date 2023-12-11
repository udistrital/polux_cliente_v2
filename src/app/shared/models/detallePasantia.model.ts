import { TrabajoGrado } from "./trabajoGrado.model";

export class DetallePasantia {
	Id!: number;
	Empresa!: number;
	Horas!: number;
	ObjetoContrato!: string;
	Observaciones!: string;
	TrabajoGrado!: TrabajoGrado;
}
