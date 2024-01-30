import { FormatoEvaluacionCarrera } from "./formatoEvaluacionCarrera.model";
import { Socializacion } from "./socializacion.model";
import { VinculacionTrabajoGrado } from "./vinculacionTrabajoGrado.model";

export interface EvaluacionTrabajoGrado {
	Id: number;
	Nota: number;
	VinculacionTrabajoGrado: VinculacionTrabajoGrado;
	FormatoEvaluacionCarrera: FormatoEvaluacionCarrera;
	Socializacion: Socializacion;
}