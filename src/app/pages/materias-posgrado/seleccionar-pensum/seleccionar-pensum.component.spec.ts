import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SeleccionarPensumComponent } from './seleccionar-pensum.component';

describe('SeleccionarPensumComponent', () => {
  let component: SeleccionarPensumComponent;
  let fixture: ComponentFixture<SeleccionarPensumComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [SeleccionarPensumComponent]
    });
    fixture = TestBed.createComponent(SeleccionarPensumComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
