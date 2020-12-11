import { Directive, Input, ElementRef, HostListener, AfterViewChecked } from '@angular/core';
import { timer } from 'rxjs';


/**
 * Establece la altura del componente a partir de la suma de sus hijos indicados.
 *
 * El valor de la propiedad autosize permite diferentes modos de selección:
 * - Usando un nombre de clase.
 * - Usando un nombre de elemento (tag).
 * - Dejando el valor en blanco se seleccionan todos los elementos hijos.
 *
 * ```html
 * <ion-content autosize="ion-list" [scrollY]="!embedded">
 *   <ion-list></ion-list>
 * </ion-content>
 * ```
 */
@Directive({
  // tslint:disable-next-line: directive-selector
  selector: '[autosize]'
})
export class AutosizeContentDirective implements AfterViewChecked {

  @Input() autosize: any;

  constructor(
    public el: ElementRef,
  ) { }

  ngAfterViewChecked(): void {
    this.contentHeight(this.el.nativeElement, this.autosize);
  }

  @HostListener('window:resize') onResize(): void {
    this.contentHeight(this.el.nativeElement, this.autosize);
  }

  contentHeight(parent: HTMLElement, selector: any): void {
    // parent = parent.closest('ion-content');
    if (!parent) { return; }

    if (typeof selector === 'function') { selector(parent); return; }
    if (typeof selector !== 'string') { return; }

    // Obtenemos los hijos de los que hay que calcular su altura.
    let children: HTMLCollectionOf<Element>;
    if (!!selector && selector.startsWith('.')) {
      // Selector de clase. Ej: 'card'
      children = parent.getElementsByClassName(selector.substring(1));

    } else if (selector) {
      // Selector por nombre de elemento. Ej: 'ion-list'
      children = parent.getElementsByTagName(selector);

    } else {
      // Si no se ha indicado ningún selector accedemos a todos los hijos.
      children = parent.children;
    }
    // if (!children) { return; }

    // Sumamos la altura de todos los hijos.
    let height = 0;
    if (children) { Array.from(children).forEach((el: HTMLElement) => {
      height += el.offsetHeight;
    }); }
    // Sumamos también la altura del borde del contenedor.
    height += +parent.style.borderTopWidth.replace('px', '') + +parent.style.borderBottomWidth.replace('px', '');
    // Establecemos la altura de forma asíncrona para dar tiempo a que se actualice el DOM.
    timer().subscribe(() => parent.style.height = `${height}px`);

  }

}
