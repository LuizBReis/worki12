import { TestBed } from '@angular/core/testing';
import { JobService } from './job';

describe('JobService', () => {
  let service: JobService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [JobService]
    });
    service = TestBed.inject(JobService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
