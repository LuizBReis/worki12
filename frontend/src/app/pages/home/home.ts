import { Component, AfterViewInit, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../../components/header/header';
import { Job, JobService } from '../../services/job';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [HeaderComponent, RouterModule, CommonModule],
  templateUrl: './home.html',
  styleUrls: ['./home.scss']
})
export class Home implements AfterViewInit, OnInit {

  jobs: Job[] = [];

  constructor(private jobService: JobService) {}

  ngOnInit(): void {
    // Busca vagas cadastradas e exibe as mais recentes
    this.jobService.getJobs({}).subscribe({
      next: (data: Job[]) => {
        this.jobs = Array.isArray(data) ? data : [];
      },
      error: (err: any) => {
        console.error('Erro ao carregar vagas do momento:', err);
      }
    });
  }

  ngAfterViewInit(): void {
    const items = document.querySelectorAll('.carousel-item');
    const prevBtn = document.querySelector('.carousel-control.prev');
    const nextBtn = document.querySelector('.carousel-control.next');

    let current = 0;

    function showSlide(index: number) {
      items.forEach((item, i) => {
        item.classList.remove('active');
        if (i === index) item.classList.add('active');
      });
    }

    nextBtn?.addEventListener('click', () => {
      current = (current + 1) % items.length;
      showSlide(current);
    });

    prevBtn?.addEventListener('click', () => {
      current = (current - 1 + items.length) % items.length;
      showSlide(current);
    });

    // autoplay a cada 5s
    setInterval(() => {
      current = (current + 1) % items.length;
      showSlide(current);
    }, 5000);
  }
}
