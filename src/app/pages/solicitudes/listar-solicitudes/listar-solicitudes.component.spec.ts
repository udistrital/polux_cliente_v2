import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListarSolicitudesComponent } from './listar-solicitudes.component';

describe('ListarSolicitudesComponent', () => {
  let component: ListarSolicitudesComponent;
  let fixture: ComponentFixture<ListarSolicitudesComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ListarSolicitudesComponent]
    });
    fixture = TestBed.createComponent(ListarSolicitudesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
