import { TestBed } from '@angular/core/testing';

import { ErrorManager } from './error.service';

describe('ErrorManager', () => {
  let service: ErrorManager;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ErrorManager);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
