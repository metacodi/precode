import { AfterViewChecked, Component, ElementRef, Input, OnInit } from '@angular/core';

import { AppConfig } from 'src/core/app-config';

import { isBreakpoint } from '../functions';


@Component({
  selector: 'expand-button',
  template: `<ion-icon name="chevron-up" class="chevron-up-down" [ngClass]="{'chevron-up-down-collapsed': !expanded}" [size]="size" style="cursor: pointer;"></ion-icon>`,
  styles: [
    'ion-icon { transition: transform 250ms ease-out; }',
    '.chevron-up-down-collapsed { transform: rotate(-180deg) !important; }',
  ]
})
export class ExpandButtonComponent implements OnInit, AfterViewChecked {
  /** @hidden */
  protected debug = AppConfig.debugEnabled;
  private breakpoint: 'sm' | 'md' | 'lg' | 'xl' = undefined;

  @Input() expanded = true;

  @Input() size: 'small' | 'large' | undefined = 'small';

  @Input() set expandedSm(condition: boolean) {
    this.expanded = condition;
    this.breakpoint = 'sm';
    this.checkBreakpoint();
  }

  @Input() set expandedMd(condition: boolean) {
    this.expanded = condition;
    this.breakpoint = 'md';
    this.checkBreakpoint();
  }

  @Input() set expandedLg(condition: boolean) {
    this.expanded = condition;
    this.breakpoint = 'lg';
    this.checkBreakpoint();
  }

  @Input() set expandedXl(condition: boolean) {
    this.expanded = condition;
    this.breakpoint = 'xl';
    this.checkBreakpoint();
  }

  constructor(
    public el: ElementRef,
  ) {}

  ngOnInit() {
    this.el.nativeElement.parentElement.style.setProperty('--inner-padding-end', '0px');
    this.checkBreakpoint();
  }

  ngAfterViewChecked() {
    this.checkBreakpoint();
  }

  protected checkBreakpoint() {
    if (!this.breakpoint || !this.el?.nativeElement?.classList) { return; }
    const list: DOMTokenList = this.el.nativeElement.classList;
    if (isBreakpoint(this.breakpoint)) {
      list.add(`ion-hide-${this.breakpoint}-up`);
    } else {
      list.remove(`ion-hide-${this.breakpoint}-up`);
    }
  }


}
