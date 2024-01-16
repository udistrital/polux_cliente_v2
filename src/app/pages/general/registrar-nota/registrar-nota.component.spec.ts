import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RegistrarNotaComponent } from './registrar-nota.component';

describe('RegistrarNotaComponent', () => {
  let component: RegistrarNotaComponent;
  let fixture: ComponentFixture<RegistrarNotaComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [RegistrarNotaComponent]
    });
    fixture = TestBed.createComponent(RegistrarNotaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
