import { TipoParametro } from "./tipoParametro.model";

export class Parametro {
	Id!: number;
	Nombre!: string;
	Descripcion!: string;
	CodigoAbreviacion!: string;
	Activo!: boolean;
	NumeroOrden!: number;
	TipoParametroId!: TipoParametro;
	ParametroPadreId!: Parametro;
}
