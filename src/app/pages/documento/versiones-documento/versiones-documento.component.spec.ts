import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VersionesDocumentoComponent } from './versiones-documento.component';

describe('VersionesDocumentoComponent', () => {
  let component: VersionesDocumentoComponent;
  let fixture: ComponentFixture<VersionesDocumentoComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [VersionesDocumentoComponent]
    });
    fixture = TestBed.createComponent(VersionesDocumentoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
