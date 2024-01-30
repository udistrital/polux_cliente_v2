import { Injectable } from '@angular/core';
import Swal from 'sweetalert2';

@Injectable({
    providedIn: 'root',
})
export class AlertService {

    input(titulo: string, etiqueta: string): Promise<any> {
        return Swal.fire({
            title: titulo,
            input: 'text',
            inputLabel: etiqueta,
            inputValue: '',
            showCancelButton: true,
            inputValidator: (value) => {
                if (!value) {
                    value = 'Ingrese un valor válido';
                }

                return value;
            }
        });
    }

    confirm(titulo: string, texto: string, option: string): Promise<any> {
        return Swal.fire({
            title: titulo,
            text: texto,
            icon: 'question',
            showCancelButton: true,
            cancelButtonText: 'Cancelar',
            confirmButtonText: `${option === 'update' ? 'Actualizar' : option === 'create' ? 'Crear' : 'Eliminar'}`,
        });
    }

    success(text: string, title = 'Éxito'): Promise<any> {
        return Swal.fire({
            title,
            text,
            icon: 'success',
        });
    }

    error(texto: string): Promise<any> {
        return Swal.fire({
            title: 'Error',
            text: texto,
            icon: 'error',
        });
    }

    warning(texto: string): Promise<any> {
        return Swal.fire({
            title: 'Atención',
            text: texto,
            icon: 'warning',
        });
    }

    loading(): void {
        Swal.fire({
            title: 'Cargando...',
            allowOutsideClick: false,
            allowEscapeKey: false,
            showConfirmButton: false,
        });
        Swal.showLoading();
    }

    close(): void {
        Swal.close();
    }

    submitAlert({ option, type, fn, data, info, fnReturn }: any): void {
        Swal.fire({
            title: `Se ${option === 'update' ? 'actualizará' : 'creará'} ${type}`,
            text: info,
            icon: 'warning',
            showCancelButton: true,
            cancelButtonText: 'Cancelar',
            confirmButtonText: `${option === 'update' ? 'Actualizar' : 'Crear'} ${type}`
        })
            .then((result) => {
                if (result.value) {
                    Swal.fire({
                        title: 'Por favor espere!',
                        html: `${option === 'update' ? 'Actualizando' : 'Creando'} ${type}`,
                        allowOutsideClick: false,
                        willOpen: () => {
                            Swal.showLoading();
                        },
                    });
                    fn(data)
                        .then((response: any) => {
                            Swal.close();
                            Swal.fire(
                                `${option === 'update' ? 'Actualizado' : 'Creado'}`,
                                `Se ha ${option === 'update' ? 'actualizado' : 'Creado'}  ${type} ${response} de forma exitosa`,
                                'success'
                            ).then(() => {
                                fnReturn();
                            });
                        })
                        .catch((err: any) => {
                            Swal.close();
                            Swal.fire(
                                `No se ha podido ${option === 'update' ? 'Actualizar' : 'Crear'}  ${type}`,
                                `error: ${err}`,
                                'error'
                            );
                        });
                }
            });
    }

}

