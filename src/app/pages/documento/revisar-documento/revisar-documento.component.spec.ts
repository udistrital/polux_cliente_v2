import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RevisarDocumentoComponent } from './revisar-documento.component';

describe('RevisarDocumentoComponent', () => {
  let component: RevisarDocumentoComponent;
  let fixture: ComponentFixture<RevisarDocumentoComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [RevisarDocumentoComponent]
    });
    fixture = TestBed.createComponent(RevisarDocumentoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
