import { Component } from '@angular/core';

@Component({
  selector: 'app-pages',
  template: `<div *ngIf="loaded" class="main-container">
              <div class="username-info"><br></div>
              <router-outlet></router-outlet>
            </div>`,
})
export class PagesComponent {
  loaded = false;

  ngOnInit(): void {
    this.loaded = true;
  }
}
