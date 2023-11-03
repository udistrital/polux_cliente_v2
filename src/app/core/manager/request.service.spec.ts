import { TestBed } from '@angular/core/testing';

import { RequestManager } from './request.service';

describe('RequestManager', () => {
  let service: RequestManager;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RequestManager);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
