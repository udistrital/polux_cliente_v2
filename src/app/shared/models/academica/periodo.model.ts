export interface responsePeriodo {
    periodoAcademicoCollection: { periodoAcademico: periodo[] | undefined };
}

export interface periodo {
    anio: string;
    periodo: string;
}

export interface responseCoordinadorCarrera {
    coordinadorCollection: { coordinador: coordinador[] | undefined };
}

export interface coordinador {
    codigo_proyecto_curricular: string;
    nombre_coordinador: string;
    nombre_proyecto_curricular: string;
}

export interface responsePensums {
    pensums: { pensum: pensum[] | undefined }
}

export interface pensum {
    pensum: string;
}

export interface responseAsignatura {
    asignaturaCollection: { asignatura: asignatura[] | undefined };
}

export interface asignatura {
    codigo: string;
    creditos: string;
    nombre: string;
    semestre: string;
}

export interface responseDatosEstudiante {
    datosEstudianteCollection: { datosBasicosEstudiante: datosEstudiante[] | undefined };
}

export interface datosEstudiante {
    carrera: string;
    codigo: string;
    estado: string;
    nombre: string;
    pensum: string;
}
