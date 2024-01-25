export type responsePeriodo = {
    periodoAcademicoCollection: {
        periodoAcademico: periodo[];
    } | undefined
}

export type periodo = {
    anio: string;
    periodo: string;
}

export type responseCoordinadorCarrera = {
    coordinadorCollection: {
        coordinador: coordinador[];
    } | undefined
}

export type coordinador = {
    codigo_proyecto_curricular: string;
    nombre_coordinador: string;
    nombre_proyecto_curricular: string;
}

export type responsePensums = {
    pensums: {
        pensum: pensum[];
    } | undefined
}

export type pensum = {
    pensum: string;
}

export type responseAsignatura = {
    asignaturaCollection: {
        asignatura: asignatura[];
    } | undefined
}

export type asignatura = {
    codigo: string;
    creditos: string;
    nombre: string;
    semestre: string;
}
