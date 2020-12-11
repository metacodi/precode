import { Directive, Input, ElementRef, AfterViewChecked } from '@angular/core';


/** Add or remove 'hidden' class to element. */
@Directive({
  // tslint:disable-next-line: directive-selector
  selector: '[hide]'
})
export class HideDirective implements AfterViewChecked {
  private condition: boolean;

  constructor(
    private el: ElementRef,
  ) { }

  @Input() set hide(condition: boolean) {
    this.condition = condition;
    // console.log('HideDirective', { condition: this.condition, el: this.el });
    const list: DOMTokenList = this.el.nativeElement.classList;
    if (condition) {
      list.add('hidden');
    } else {
      list.remove('hidden');
    }
  }

  ngAfterViewChecked() {
    // console.log('HideDirective', { condition: this.condition, el: this.el });
    const list: DOMTokenList = this.el.nativeElement.classList;
    if (this.condition) {
      list.add('hidden');
    } else {
      list.remove('hidden');
    }
  }

}
