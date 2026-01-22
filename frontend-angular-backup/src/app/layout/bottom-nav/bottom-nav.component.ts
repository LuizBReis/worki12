
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
    selector: 'app-bottom-nav',
    standalone: true,
    imports: [CommonModule, RouterModule, MatIconModule, MatButtonModule],
    templateUrl: './bottom-nav.component.html',
    styleUrls: ['./bottom-nav.component.scss']
})
export class BottomNavComponent {
    navItems = [
        { icon: 'home', route: '/dashboard' },
        { icon: 'search', route: '/dashboard' }, // Search/Explore
        { icon: 'add_circle', route: '/jobs/new', isFab: true }, // Central FAB
        { icon: 'chat', route: '/messages/inbox' },
        { icon: 'person', route: '/profile/me' }
    ];
}
