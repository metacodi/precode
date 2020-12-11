import { AfterViewChecked, Component, ElementRef, Input, OnInit } from '@angular/core';

import { AppConfig } from 'src/core/app-config';

import { isBreakpoint } from '../functions';


@Component({
  selector: 'expand-button',
  template: `<ion-icon [name]="open ? 'chevron-up' : 'chevron-down'" size="small" slot="end" style="cursor: pointer;"></ion-icon>`,
})
export class ExpandButtonComponent implements OnInit, AfterViewChecked {
  /** @hidden */
  protected debug = AppConfig.debugEnabled;
  private breakpoint: 'sm' | 'md' | 'lg' | 'xl' = undefined;

  @Input() open = true;

  @Input() set openSm(condition: boolean) {
    this.open = condition;
    this.breakpoint = 'sm';
    this.checkBreakpoint();
  }

  @Input() set openMd(condition: boolean) {
    this.open = condition;
    this.breakpoint = 'md';
    this.checkBreakpoint();
  }

  @Input() set openLg(condition: boolean) {
    this.open = condition;
    this.breakpoint = 'lg';
    this.checkBreakpoint();
  }

  @Input() set openXl(condition: boolean) {
    this.open = condition;
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
    const list: DOMTokenList = this.el.nativeElement.classList;
    if (!!this.breakpoint) {
      if (isBreakpoint(this.breakpoint)) {
        list.add(`ion-hide-${this.breakpoint}-up`);
      } else {
        list.remove(`ion-hide-${this.breakpoint}-up`);
      }
    }
  }


}
