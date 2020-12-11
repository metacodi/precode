import { Directive, Input, ElementRef, AfterViewChecked } from '@angular/core';


/** Add or remove 'hidden' class to element. */
@Directive({
  // tslint:disable-next-line: directive-selector
  selector: '[show]'
})
export class ShowDirective implements AfterViewChecked {
  private condition: boolean;

  constructor(
    private el: ElementRef,
  ) { }

  @Input() set show(condition: boolean) {
    this.condition = condition;
    // console.log('ShowDirective', { condition: this.condition, el: this.el });
    const list: DOMTokenList = this.el.nativeElement.classList;
    if (condition) {
      list.remove('hidden');
      // console.log('ShowDirective => remove "hidden" css', list);
    } else {
      list.add('hidden');
      // console.log('ShowDirective => add "hidden" css', list);
    }
  }

  ngAfterViewChecked() {
    // console.log('ShowDirective', { condition: this.condition, el: this.el });
    const list: DOMTokenList = this.el.nativeElement.classList;
    if (this.condition) {
      list.remove('hidden');
      // console.log('ShowDirective.ngAfterViewChecked => remove "hidden" css', list);
    } else {
      list.add('hidden');
      // console.log('ShowDirective.ngAfterViewChecked => add "hidden" css', list);
    }
  }

}
