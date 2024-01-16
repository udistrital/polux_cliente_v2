import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root',
})
export class SmartTableService {

    public getSettingsObject(key: string) {
        return {
            valuePrepareFunction: (value: any) => {
                return this.prepareFunctionObject(key, value);
            },
            filterFunction: (cell?: any, search?: string): boolean => {
                return this.filterFunctionObject(key, cell, search);
            },
            compareFunction: (direction: any, a: any, b: any): number => {
                return this.compareFunctionObject(direction, a, b, key);
            },
        };
    }

    private prepareFunctionObject(key: string, value?: any): string {
        if (!value || !value[key]) {
            return '';
        }

        return value[key];
    }

    private filterFunctionObject(key: string, cell?: any, search?: string): boolean {
        if (key && cell && search?.length) {
            if (cell[key]) {
                if ((cell[key].toUpperCase()).indexOf(search.toUpperCase()) > -1) {
                    return true;
                }
            }
        }
        return false;
    }

    private compareFunctionObject(direction: any, a: any, b: any, key: string) {
        const first = a[key] ? a[key].toLowerCase() : '';
        const second = b[key] ? b[key].toLowerCase() : '';
        return this.getOrder(first, second, direction);
    }

    private getOrder(first: any, second: string, direction: any): number {
        if (first < second) {
            return -1 * direction;
        }
        if (first > second) {
            return direction;
        }
        return 0;
    }

    public getSettingsDate() {
        return {
            valuePrepareFunction: (value: any) => {
                return this.prepareFunctionDate(value);
            },
            // filterFunction: (cell?: any, search?: string): boolean => {
            //   return this.filterFunctionDate(cell, search);
            // },
        };
    }

    private prepareFunctionDate(value?: string): string {
        if (!value) {
            return '';
        }

        return value.substring(0, 10);
    }

    private getValueByNestedKey(obj: any, key: string): any {
        const keys = key.split('.');
        let value = obj;

        for (const k of keys) {
            if (value && typeof value === 'object' && k in value) {
                value = value[k];
            } else {
                return '';
            }
        }

        return value;
    }

}
