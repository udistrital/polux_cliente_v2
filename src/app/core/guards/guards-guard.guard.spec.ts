import { TestBed } from '@angular/core/testing';
import { CanActivateFn } from '@angular/router';

import { guardsGuardGuard } from './guards-guard.guard';

describe('guardsGuardGuard', () => {
  const executeGuard: CanActivateFn = (...guardParameters) => 
      TestBed.runInInjectionContext(() => guardsGuardGuard(...guardParameters));

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    expect(executeGuard).toBeTruthy();
  });
});
