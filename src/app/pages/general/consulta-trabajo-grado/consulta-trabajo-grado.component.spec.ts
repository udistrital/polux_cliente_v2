import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConsultaTrabajoGradoComponent } from './consulta-trabajo-grado.component';

describe('ConsultaTrabajoGradoComponent', () => {
  let component: ConsultaTrabajoGradoComponent;
  let fixture: ComponentFixture<ConsultaTrabajoGradoComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ConsultaTrabajoGradoComponent]
    });
    fixture = TestBed.createComponent(ConsultaTrabajoGradoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
