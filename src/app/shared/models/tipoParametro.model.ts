import { AreaTipo } from "./areaTipo.model";

export class TipoParametro {
	Id!: number;
	Nombre!: string;
	Descripcion!: string;
	CodigoAbreviacion!: string;
	Activo!: boolean;
	NumeroOrden!: number;
	FechaCreacion!: string;
	FechaModificacion!: string;
	AreaTipoId!: AreaTipo;
}
