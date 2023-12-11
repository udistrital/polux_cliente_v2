import { DominioTipoDocumento } from "./dominioTipoDocumento.model";

export class TipoDocumento {
	Id!: number;
	Nombre!: string;
	Descripcion!: string;
	CodigoAbreviacion!: string;
	Activo!: boolean;
	NumeroOrden!: number;
	Tamano!: number;
	Extension!: string;
	Workspace!: string;
	TipoDocumentoNuxeo!: string;
	FechaCreacion!: string;
	FechaModificacion!: string;
	DominioTipoDocumento!: DominioTipoDocumento;
}
