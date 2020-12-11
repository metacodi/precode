import { AfterViewChecked, Component, ElementRef, Input, OnInit } from '@angular/core';

import { AppConfig } from 'src/core/app-config';

import { matchWords } from '../ts-utils';


type TextColorized = { text: string, filtered: boolean, css?: string };
type TextColorizedOptions = { splitWords?: boolean, distinguishWords?: boolean, maxDistinctions?: number, ignoreAccents?: boolean };

/**
 * ```html
 * <text-colorized [value]="myText" [search]="search" [options]="colorizeOptions"></text-colorized>
 * ```
 */
@Component({
  selector: 'text-colorized',
  template: `<div style="background-color: transparent; display:block; position: absolute; top: 0px; left: 0px; width: 100%; height: 100%; z-index: 0;"></div>
  <ng-container *ngFor="let el of elements">
    <ng-container *ngIf="el.filtered"><span [class]="el.css">{{el.text}}</span></ng-container>
    <ng-container *ngIf="!el.filtered">{{el.text}}</ng-container>
  </ng-container>`,
  styles: [],
})
export class TextColorizedComponent implements OnInit, AfterViewChecked {
  /** @hidden */
  protected debug = AppConfig.debugEnabled;

  protected elements: TextColorized[];

  text = '';
  @Input() set value(text: string) {
    if (this.text !== text) {
      // if (this.debug) { console.log(this.constructor.name + '.@input value()'); }
      this.text = text;
      this.elements = this.colorMatch(this.text, this.match, this.colorizeOptions);
    }
  }

  match = '';
  @Input() set search(match: string) {
    if (this.match !== match) {
      // if (this.debug) { console.log(this.constructor.name + '.@input search()'); }
      this.match = match;
      this.elements = this.colorMatch(this.text, this.match, this.colorizeOptions);
    }
  }

  colorizeOptions: TextColorizedOptions = undefined;
  @Input() set options(colorizeOptions: TextColorizedOptions) {
    if (this.colorizeOptions !== colorizeOptions) {
      // if (this.debug) { console.log(this.constructor.name + '.@input options()'); }
      this.colorizeOptions = colorizeOptions;
      this.elements = this.colorMatch(this.text, this.match, this.colorizeOptions);
    }
  }

  constructor(
    public el: ElementRef,
  ) {}

  ngOnInit() {
    // if (this.debug) { console.log(this.constructor.name + '.ngOnInit()'); }
  }

  ngAfterViewChecked() {
    // if (this.debug) { console.log(this.constructor.name + '.ngAfterViewChecked()'); }
  }

  colorMatch(text: string, match: string, options?: TextColorizedOptions): TextColorized[] {
    if (!match || !text) { return [{ text, filtered: false }]; }
    if (!options) { options = {}; }
    if (options.splitWords === undefined) { options.splitWords = true; }
    if (options.ignoreAccents === undefined) { options.ignoreAccents = true; }
    if (options.distinguishWords === undefined) { options.distinguishWords = true; }
    if (options.maxDistinctions === undefined) { options.maxDistinctions = 3; }
    if (typeof text !== 'string') { text = String(text); }

    const mark = '<~#~>';

    if (!options.distinguishWords && !options.ignoreAccents) {
      // Separamos las palabras escritas y eliminamos los signos de puntuación.
      match = options.splitWords ? matchWords(match).join('|') : match;
      // text = text.replace(new RegExp('(' + match + ')(?![^<]*>|[^<>]*</)', 'ig'), '<div class="filtered">$1</div>');
      text = text.replace(new RegExp('(' + match + ')(?![^<]*>|[^<>]*</)', 'ig'), mark + '$1' + mark);
      // Devolvemos las unidades de texto coloreadas.
      return text.split(new RegExp(mark)).filter(s => !!s).map(word => {
        const filtered = match.split('|').includes(word);
        const css = filtered ? 'filtered' : '';
        return { text: word, filtered, css };
      });

    } else {
      // Separamos las palabras escritas y eliminamos los signos de puntuación.
      const words = options.splitWords ? matchWords(match) : [match];
      const wordCss = [];
      // Si hay que ignorar acentos...
      if (options.ignoreAccents) {
        const matches: string[][] = [];
        // Normalizamos la cadena.
        const normalized = String(text).normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        // Marcamos las palabras buscadas.
        words.map(word => {
          // Buscamos las posiciones de todas las ocurrencias en la cadena normalizada.
          let replaced = normalized.replace(new RegExp('(' + word + ')(?![^<]*>|[^<>]*</)', 'ig'), `${mark}$1`);
          // Puede haber más de una variante que coincida con la palabra buscada, por ejemplo: "más" y "mas"
          const variants = []; let i = 0; do {
            // Mientras existan ocurrencias...
            i = replaced.indexOf(mark, i); if (i === -1) { break; }
            // Eliminamos la marca.
            replaced = replaced.replace(mark, '');
            // Recuperamos la palabra real.
            const variant = text.substr(i, word.length);
            // La almacenamos si no está repetida.
            if (!variants.includes(variant)) { variants.push(variant); }
          } while (true);
          // Añadimos las variantes de la misma palabra.
          matches.push(variants);
        });
        // Encapsulamos las palabras originales con un tag <span> y las clases 'filtered'.
        for (let i = 0; i < matches.length; i++) {
          const css = ['filtered']; if (options.distinguishWords) { css.push(`filtered-word-${i % options.maxDistinctions + 1}`); }
          // Para cada palabra buscada...
          matches[i].map(variant => {
            // Remplazamos cada variante.
            wordCss.push({ word: variant, css: css.join(' ') });
            // text = text.replace(new RegExp('(' + variant + ')(?![^<]*>|[^<>]*</)', 'ig'), `<div class="${css.join(' ')}">$1</div>`);
            text = text.replace(new RegExp('(' + variant + ')(?![^<]*>|[^<>]*</)', 'ig'), mark + '$1' + mark);
          });
        }
        // Devolvemos las unidades de texto coloreadas.
        return text.split(new RegExp(mark)).filter(s => !!s).map(word => {
          const filtered = matches.some(variants => variants.includes(word));
          const css = filtered ? wordCss.find(style => style.word === word).css : '';
          return { text: word, filtered, css };
        });

      } else {
        // Encapsulamos las palabras originales con un tag <span> y las clases 'filtered'.
        for (let i = 0; i < words.length; i++) {
          const css = ['filtered']; if (options.distinguishWords) { css.push(`filtered-word-${i % options.maxDistinctions + 1}`); }
          wordCss.push({ word: words[i], css: css.join(' ') });
          // text = text.replace(new RegExp('(' + words[i] + ')(?![^<]*>|[^<>]*</)', 'ig'), `<div class="${css.join(' ')}">$1</div>`);
          text = text.replace(new RegExp('(' + words[i] + ')(?![^<]*>|[^<>]*</)', 'ig'), mark + '$1' + mark);
        }
        // Devolvemos las unidades de texto coloreadas.
        return text.split(new RegExp(mark)).filter(s => !!s).map(word => {
          const filtered = words.includes(word);
          const css = filtered ? wordCss.find(style => style.word === word).css : '';
          return { text: word, filtered, css };
        });
      }
    }
  }

}
