import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CrudSolicitudesComponent } from './crud-solicitudes.component';

describe('CrudSolicitudesComponent', () => {
  let component: CrudSolicitudesComponent;
  let fixture: ComponentFixture<CrudSolicitudesComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [CrudSolicitudesComponent]
    });
    fixture = TestBed.createComponent(CrudSolicitudesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
