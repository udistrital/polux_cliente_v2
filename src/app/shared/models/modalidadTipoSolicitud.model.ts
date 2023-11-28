import { Modalidad } from "./modalidad.model"
import { TipoSolicitud } from "./tipoSolicitud.model"

export class ModalidadTipoSolicitud {
	Id!: number;
	TipoSolicitud!: TipoSolicitud;
	Modalidad!: Modalidad;
}
