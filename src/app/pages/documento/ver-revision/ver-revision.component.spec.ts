import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VerRevisionComponent } from './ver-revision.component';

describe('VerRevisionComponent', () => {
  let component: VerRevisionComponent;
  let fixture: ComponentFixture<VerRevisionComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [VerRevisionComponent]
    });
    fixture = TestBed.createComponent(VerRevisionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
