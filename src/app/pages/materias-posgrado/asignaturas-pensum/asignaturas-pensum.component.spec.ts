import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AsignaturasPensumComponent } from './asignaturas-pensum.component';

describe('AsignaturasPensumComponent', () => {
  let component: AsignaturasPensumComponent;
  let fixture: ComponentFixture<AsignaturasPensumComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [AsignaturasPensumComponent]
    });
    fixture = TestBed.createComponent(AsignaturasPensumComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
