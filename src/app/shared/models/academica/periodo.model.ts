export class responsePeriodo {
    periodoAcademicoCollection: {
        periodoAcademico: periodo[];
    } | undefined
}

export class periodo {
    anio = '';
    periodo = '';
}

export class responseCoordinadorCarrera {
    coordinadorCollection: {
        coordinador: coordinador[];
    } | undefined
}

export class coordinador {
    codigo_proyecto_curricular = '';
    nombre_coordinador = '';
    nombre_proyecto_curricular = '';
}

export class responsePensums {
    pensums: {
        pensum: pensum[];
    } | undefined
}

export class pensum {
    pensum = '';
}

export class responseAsignatura {
    asignaturaCollection: {
        asignatura: asignatura[];
    } | undefined
}

export class asignatura {
    codigo = '';
    creditos = '';
    nombre = '';
    semestre = '';
}
