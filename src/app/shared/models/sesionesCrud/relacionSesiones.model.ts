import { Sesion } from "./sesion.model";

export class RelacionSesiones {
    Id!: number;
    SesionPadre!: Sesion;
    SesionHijo!: Sesion;
}
