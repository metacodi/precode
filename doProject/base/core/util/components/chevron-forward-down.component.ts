import { AfterViewChecked, ChangeDetectorRef, Component, ElementRef, Input, OnInit } from '@angular/core';

import { AppConfig } from 'src/core/app-config';


@Component({
  selector: 'chevron-forward-down',
  template: `<ion-icon name="chevron-forward" [ngClass]="{'chevron-forward-down-expanded': expanded}" [size]="size" style="cursor: pointer;"></ion-icon>`,
  styles: [
    'ion-icon { transition: transform 250ms ease-out; }',
    '.chevron-forward-down-expanded { transform: rotate(90deg) !important; }',
  ],
})
export class ChevronForwardDownIconComponent implements OnInit, AfterViewChecked {
  /** @hidden */
  protected debug = AppConfig.debugEnabled;

  @Input() expanded = true;

  @Input() set collapsed(value: boolean) {
    this.expanded = !value;
  }

  @Input() size: 'small' | 'normal' | 'large' = 'normal';

  constructor(
    public el: ElementRef,
    // public changeDetector: ChangeDetectorRef,
  ) {}

  ngOnInit() {
  }

  ngAfterViewChecked() {
  }

}
