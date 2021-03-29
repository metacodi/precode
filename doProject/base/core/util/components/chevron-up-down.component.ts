import { AfterViewChecked, ChangeDetectorRef, Component, ElementRef, Input, OnInit } from '@angular/core';

import { AppConfig } from 'src/core/app-config';


@Component({
  selector: 'chevron-up-down',
  template: `<ion-icon name="chevron-up" [ngClass]="{'chevron-up-down-collapsed': collapsed}" [size]="size" style="cursor: pointer;"></ion-icon>`,
  styles: [
    'ion-icon { transition: transform 250ms ease-out; }',
    '.chevron-up-down-collapsed { transform: rotate(-180deg) !important; }',
  ],
})
export class ChevronUpDownIconComponent implements OnInit, AfterViewChecked {
  /** @hidden */
  protected debug = AppConfig.debugEnabled;

  @Input() collapsed = true;

  @Input() set expanded(value: boolean) {
    this.collapsed = !value;
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
