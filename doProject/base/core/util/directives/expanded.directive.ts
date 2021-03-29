import { Directive, Input, ElementRef, AfterViewChecked } from '@angular/core';

import { isBreakpoint } from '../functions';


/** Add or remove 'expanded' and 'collapsed' classes to element. */
@Directive({
  // tslint:disable-next-line: directive-selector
  selector: ':not(chevron-up-down):not(chevron-forward-down):not(expand-button)[expanded], :not(expand-button)[expandedSm], :not(expand-button)[expandedMd], :not(expand-button)[expandedLg], :not(expand-button)[expandedXl], :not(expand-button)[expandedHeight]'
})
export class ExpandedDirective implements AfterViewChecked {
  private condition: boolean;
  private breakpoint: 'sm' | 'md' | 'lg' | 'xl' = undefined;
  private height: number;

  constructor(
    private el: ElementRef,
  ) { }

  @Input() set expanded(condition: boolean) {
    this.condition = condition;
    this.checkBreakpoint();
  }

  @Input() set expandedHeight(height: number) {
    // Eliminamos la clase anterior.
    if (this.height) { this.el.nativeElement.classList.remove(`expanded-${this.height}`); }
    // Normalizamos la altura para que coincida con el de alguna clase `expanded-n`
    this.height = this.normalizeHeight(height);
    this.checkBreakpoint();
  }

  protected normalizeHeight(height: number): number {
    return Math.min(1000, Math.ceil(height / 100) * 100);
  }

  @Input() set expandedSm(condition: boolean) {
    this.condition = condition;
    this.breakpoint = 'sm';
    this.checkBreakpoint();
  }

  @Input() set expandedMd(condition: boolean) {
    this.condition = condition;
    this.breakpoint = 'md';
    this.checkBreakpoint();
  }

  @Input() set expandedLg(condition: boolean) {
    this.condition = condition;
    this.breakpoint = 'lg';
    this.checkBreakpoint();
  }

  @Input() set expandedXl(condition: boolean) {
    this.condition = condition;
    this.breakpoint = 'xl';
    this.checkBreakpoint();
  }

  ngAfterViewChecked() {
    this.checkBreakpoint();
  }

  protected checkBreakpoint() {
    const list: DOMTokenList = this.el.nativeElement.classList;
    const expanded = `expanded${this.height ? '-' + this.height : ''}`;
    if (!!this.breakpoint && isBreakpoint(this.breakpoint)) {
      list.remove(`${expanded}`);
      list.remove('collapsed');
    } else {
      if (this.condition) {
        list.add(`${expanded}`);
        list.remove('collapsed');
      } else {
        list.add('collapsed');
        list.remove(`expanded`);
        list.remove(`${expanded}`);
      }
    }
  }

}
