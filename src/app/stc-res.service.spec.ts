import { TestBed } from '@angular/core/testing';

import { StcResService } from './stc-res.service';

describe('StcResService', () => {
  let service: StcResService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(StcResService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
