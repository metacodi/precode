import { Input, Directive, ElementRef, HostListener, Output, EventEmitter } from '@angular/core';
import { timer } from 'rxjs';
import { first } from 'rxjs/operators';

import { AppConfig } from 'src/core/app-config';


@Directive({
  // tslint:disable-next-line: directive-selector
  selector: 'ion-select',
})
export class IonSelectDirective {
  protected debug = true && AppConfig.debugEnabled;

  constructor(
    public el: ElementRef,
  ) { }

  @Input() behavior = 'auto';   // 'auto' | 'smooth'
  @Input() block = 'center';    // 'center' | 'start' | 'end'
  @Input() autoSelect = true;
  @Input() pattern = '[a-zA-Z0-9-_ ]';

  @HostListener('click', ['$event', '$event.target'])
  onClick(ev: MouseEvent, el: HTMLElement): void {
    // Realizamos la llamada al procedimiento base.
    this.onSelectClicked({
      behavior: this.behavior || 'auto',
      block: this.block || 'center',
      autoSelect: this.autoSelect,
      pattern: this.pattern || '[a-zA-Z0-9-_ ]',
    });
    if (this.debug) { console.log('@HostListener => ', this.el.nativeElement); }
  }


  // ---------------------------------------------------------------------------------------------------
  //  ion-select : show selected value
  // ---------------------------------------------------------------------------------------------------

  async onSelectClicked(options: any = { behavior: 'auto', block: 'center', autoSelect: true, pattern: '[a-zA-Z0-9-_ ]' }, count: number = 1): Promise<void> {
    // if (this.debug) console.log('onSelectClicked().this => ', this)
    // if (this.debug) console.log('onSelectClicked ()')
    timer(100).pipe(first()).subscribe(observer => {
      const elements = document.getElementsByClassName('alert-radio-group');
      if (elements && elements.length) {
        // Referenciamos el contenedor de los elementos.
        const wrapper: any = (elements[0] as HTMLElement);
        // Buscamos el elemento seleccionado.
        const selected: HTMLElement = wrapper.querySelector('[aria-checked="true"]');
        // Si existe un elemento seleccionado...
        if (selected) {
          // Mostramos el elemento seleccionado.
          selected.scrollIntoView({
            block: options.block,   // "start" | "center" | "end"
            behavior: 'auto',  // "auto" | "smooth"
          });
          // Colocamos el foco sobre él para capturar los eventos de teclado.
          selected.focus();

        } else {
          // Colocamos el foco en el primer elemento para capturar los eventos de teclado.
          if (wrapper.firstElementChild) { wrapper.firstElementChild.focus(); }
        }

        // Controlamos las teclas pulsadas.
        let timeout = null;
        let typed = '';
        // if (this.debug) console.log(wrapper)
        wrapper.addEventListener('keydown', (ev: KeyboardEvent) => {
          if (this.debug) { console.log('ev => ', { ev, key: ev.key, code: ev.code, type: ev.type }); }
          // Obtenemos el elemento actualmente seleccionado.
          const element: HTMLElement = wrapper.querySelector('[aria-checked="true"]');

          // Evaluamos la tecla pulsada.
          if (ev.key === 'Enter') {  // Enter = Return | Intro
            // Evitamos la propagación
            ev.preventDefault();
            // Accept if auto-select.
            if (element && options.autoSelect && typed === '') { this.accept(wrapper); }

            // } else if (ev.keyCode === 38 || ev.keyCode === 40 || ev.keyCode === 35 || ev.keyCode === 36) {  // Up, Down, Home, End
          } else if (ev.key === 'ArrowUp' || ev.key === 'ArrowDown' || ev.key === 'Home' || ev.key === 'End') {  // Up, Down, Home, End
            // Limpiamos lo escrito.
            typed = ''; if (options.autoSelect) {
              // Evitamos la propagación.
              ev.preventDefault();
              // Seleccionamos el elemento contiguo.
              this.selectAdjacent(ev.key, wrapper, options);
            }

          } else {
            // Acumulamos la última tecla pulsada si pasa el test.
            if (RegExp(options.pattern).test(ev.key)) { typed += ev.key; }
          }
          // Cancelamos la ejecución prevista del timeout anterior.
          clearTimeout(timeout);
          // Si se han acumulado teclas válidas.
          if (typed) {
            // Creamos un nuevo timeout para procesar las teclas acumuladas.
            timeout = setTimeout(() => {
              // // Buscamos la primera coincidencia.
              // let el: HTMLElement = this.searchElement(wrapper, typed, selected)
              // Buscamos la primera coincidencia.
              const result: any = this.searchElement(wrapper, typed, selected, options);
              // Buscamos la primera coincidencia.
              const el: HTMLElement = result.element;
              // Mostramos el elemento sin seleccionarlo.
              if (el) { el.scrollIntoView({ block: options.block, behavior: result.behavior }); }
              // Seleccionamos el elemento automáticamente.
              if (el && options.autoSelect) { el.click(); }
              // Comprobamos si hay que pulsar el boton 'OK'.
              if (el && options.autoSelect && ev.key === 'Enter') { this.accept(wrapper); }
              // Restablecemos las teclas acumuladas.
              typed = '';

            }, 300);  // Tiempo de espera en ms entre teclas pulsadas.
          }
        });

      } else {
        if (this.debug) { console.log('ionSelectDirective -> no elements, count => ', count); }
        // Comprobamos el número de intentos.
        if (count < 5) {
          // Incrementamos el contador.
          count += 1;
          // Lo intentamos de nuevo.
          return this.onSelectClicked(options, count);

        } else {
          // Desistimos. Notificamos el error.
          if (this.debug) { console.error('ionSelectDirective -> no elements => ', elements); }
        }
      }
    });
    return new Promise<void>(resolve => resolve(null));
  }

  private accept(wrapper: HTMLElement): void {
    // Obtenemos el botón 'OK'
    const btn = wrapper.parentElement.getElementsByClassName('alert-button');
    // if (this.debug) console.log('Hay que buscar el botón!!!!!', btn)
    if (btn && btn.length) { (btn[1] as HTMLElement).click(); }
  }

  private selectAdjacent(key: string, wrapper: HTMLElement, options: any): HTMLElement {
    let adjacent: HTMLElement;
    const all: HTMLCollection = wrapper.getElementsByClassName('alert-radio-button');
    let behavior: ScrollBehavior = 'smooth';
    // Obtenemos el elemento actualmente seleccionado.
    const selected: HTMLElement = wrapper.querySelector('[aria-checked="true"]');
    // Si no hay ningún elemento seleccionado actualmente...
    if (!selected) {
      if (all && all.length) {
        // Seleccionamos el primero.
        // adjacent = (all[keyCode === 35 ? all.length - 1 : 0] as HTMLElement)
        adjacent = (all[key === 'End' ? all.length - 1 : 0] as HTMLElement);

      } else {
        // Si no hay elementos...
        return null;
      }
    }

    // Obtenemos el siguiente elemento.
    // if (!adjacent && keyCode === 38) { adjacent = (selected.previousElementSibling as HTMLElement) }
    // if (!adjacent && keyCode === 40) { adjacent = (selected.nextElementSibling as HTMLElement) }
    // if (!adjacent && keyCode === 36) { adjacent = (all[0] as HTMLElement); behavior = 'auto' }
    // if (!adjacent && keyCode === 35) { adjacent = (all[all.length - 1] as HTMLElement); behavior = 'auto' }
    if (!adjacent && key === 'ArrowUp') { adjacent = (selected.previousElementSibling as HTMLElement); }
    if (!adjacent && key === 'ArrowDown') { adjacent = (selected.nextElementSibling as HTMLElement); }
    if (!adjacent && key === 'Home') { adjacent = (all[0] as HTMLElement); behavior = 'auto'; }
    if (!adjacent && key === 'End') { adjacent = (all[all.length - 1] as HTMLElement); behavior = 'auto'; }
    if (!adjacent) { return null; }

    // Seleccionamos el elemento.
    adjacent.click();
    // Posicionamos el elemento según las opciones actuales.
    timer(1).pipe(first()).subscribe(() => adjacent.scrollIntoView({ behavior, block: options.block }));
  }

  private searchElement(wrapper: HTMLElement, typed: string, selected: HTMLElement, options: any): any {
    // Obtenemos todos los elementos.
    const all = wrapper.getElementsByClassName('alert-radio-button');
    // Si hay elementos en la lista...
    if (all && all.length) {
      const candidates = Array.prototype.filter.call(all, (element: any) => {
        // return RegExp('^' + typed.toLowerCase()).test(element.textContent.toLowerCase());
        return RegExp('^' + typed.toLowerCase()).test(element.textContent.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase());
      });

      // if (this.debug) console.log('candidates => ', candidates)
      if (candidates && candidates.length) {
        // Si no hay elemento seleccionado, devolvemos el primero.
        if (!selected) { return { element: candidates[0], behavior: options.behavior }; }
        // Si el seleccionado está entre los candidatos, nos movemos 'suavemente' hacia el siguiente.
        let trobat = false; for (const candidate of candidates) {
          // Comprobamos si el anterior candidato era el actualmente seleccionado.
          if (trobat) { return { element: candidate, behavior: 'smooth' }; }
          // Comprobamos si el candidato actual es el seleccionado actualmente.
          if (candidate.textContent === selected.textContent) { trobat = true; }
        }
        // Si el seleccionado no está entre los candidatos devolvemos el primero.
        return { element: candidates[0], behavior: trobat ? 'smooth' : options.behavior };
      }
    }
    // No hay candidatos por seleccionar.
    return { element: null, behavior: options.behavior };
  }

}
