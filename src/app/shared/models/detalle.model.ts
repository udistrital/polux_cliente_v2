import { TipoDetalle } from "./tipoDetalle.model"

export class Detalle {
	Id!: number;
	Nombre!: string;
	Enunciado!: string;
	Descripcion!: string;
	CodigoAbreviacion!: string;
	Activo!: boolean;
	TipoDetalle!: TipoDetalle;
}
