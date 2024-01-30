export interface Menu {
    Id: number;
    Nombre: string;
    Url: string;
    TipoOpcion: string;
    Opciones: Menu[];
}
