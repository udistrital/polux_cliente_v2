import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListaTrabajosComponent } from './lista-trabajos.component';

describe('ListaTrabajosComponent', () => {
  let component: ListaTrabajosComponent;
  let fixture: ComponentFixture<ListaTrabajosComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ListaTrabajosComponent]
    });
    fixture = TestBed.createComponent(ListaTrabajosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
