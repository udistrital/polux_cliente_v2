import { ModalidadTipoSolicitud } from "./modalidadTipoSolicitud.model"
import { Detalle } from "./detalle.model"

export class DetalleTipoSolicitud {
	Id!: number;
	Detalle!: Detalle;
	ModalidadTipoSolicitud!: ModalidadTipoSolicitud;
	Activo!: boolean;
	Requerido!: boolean;
	NumeroOrden!: number;
}

export class DetalleTipoSolicitudForm extends DetalleTipoSolicitud {
	label!: string;
	opciones!: any[];
	respuesta!: string;
	respuestaNumerica!: number;
	fileModel: any;
	bool!: boolean;
}
