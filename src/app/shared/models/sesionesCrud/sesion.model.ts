import { TipoSesion } from "./tipoSesion.model";

export class Sesion {
    Id!: number;
    Descripcion!: string;
    FechaCreacion!: string;
    FechaModificacion!: string;
    FechaInicio!: Date;
    FechaFin!: Date;
    Periodo!: number;
    Recurrente!: boolean;
    NumeroRecurrencias!: number;
    TipoSesion!: TipoSesion;
}
