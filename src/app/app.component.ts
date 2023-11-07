import { Component, OnInit } from '@angular/core';
import { environment } from 'src/environments/environment';
import { Router, NavigationEnd } from '@angular/router';
import { UserService } from './pages/services/userService';
declare let gtag: (config: string, code: string, path: any) => void;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  loadRouting = false;
  environment = environment;
  loadingRouter = false;
  title = 'polux_cliente_v2';
  constructor(
    private router: Router,
    private userService: UserService,
  ) {
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        gtag('config', 'G-RBY2GQV40M',
          {
            page_path: event.urlAfterRedirects
          }
        );
      }
    }
    );
  }

  ngOnInit(): void {
    const oas = document.querySelector('ng-uui-oas');

    oas?.addEventListener('user', (event: Event) => {
      const userData = (event as CustomEvent).detail;
      if (userData) {
        this.loadRouting = true;
        this.userService.updateUser(userData);
      }
    });

    oas?.addEventListener('option', (event: Event) => {
      const option = (event as CustomEvent).detail;
      if (option) {
        setTimeout(() => (this.router.navigate(['pages/' + option.Url])), 50);
      }
    });

    oas?.addEventListener('logout', (event: Event) => {
      const detail = (event as CustomEvent).detail;
      if (detail) {
        console.log(detail);
      }
    });

    oas?.addEventListener('menu', (event: Event) => {
      const menu = (event as CustomEvent).detail;
      if (menu && Array.isArray(menu)) {
        this.userService.updatePermisos(menu);
      }
    });

  }
}
