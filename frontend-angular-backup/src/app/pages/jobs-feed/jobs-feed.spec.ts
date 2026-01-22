import { ComponentFixture, TestBed } from '@angular/core/testing';

import { JobsFeed } from './jobs-feed';

describe('JobsFeed', () => {
  let component: JobsFeed;
  let fixture: ComponentFixture<JobsFeed>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [JobsFeed]
    })
    .compileComponents();

    fixture = TestBed.createComponent(JobsFeed);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
