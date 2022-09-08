import { TestBed } from '@angular/core/testing';

import { RuleGeneratorService } from './rule-generator.service';

describe('RuleGeneratorService', () => {
  let service: RuleGeneratorService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RuleGeneratorService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
