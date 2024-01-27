import { Formato } from "./formato.model";

export interface FormatoEvaluacionCarrera {
	Id: number;
	Activo: boolean;
	CodigoProyecto: number;
	FechaInicio: Date
	FechaFin: Date
	Modalidad: number;
	Formato: Formato;
}
