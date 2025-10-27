import { Component, AfterViewInit } from '@angular/core';
import { HeaderComponent } from '../../components/header/header';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [HeaderComponent],
  templateUrl: './home.html',
  styleUrls: ['./home.scss']
})
export class Home implements AfterViewInit {

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
