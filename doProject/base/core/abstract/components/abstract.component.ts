import { Injector, OnInit, OnDestroy, ComponentFactoryResolver, Component, ComponentFactory } from '@angular/core';
import { FormGroup, FormControl, FormArray } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { LoadingController } from '@ionic/angular';

import { AbstractBaseClass } from '../abstract-base.class';
import { AppConfig } from 'src/core/app-config';
import { LocalizationService } from 'src/core/localization';
import { isBreakpoint, resolveComponentFactory, resolveTranslate, matchWords } from 'src/core/util';

import { AbstractModelService } from '../abstract-model.service';
import { EntityModel } from '../model/entity-model';
import { EntityName } from '../model/entity-model';
import { EntitySchema } from '../model/entity-schema';
import { Subscriber, Subscription } from 'rxjs';


/**
 * Base class from which the other components of the abstract layer are inherited.
 * <br />
 * ### Requires:
 * Model project file with name `model.ts` in order to import the application model:<br />
 * `import * as AppModel from 'src/app/model';`
 */
@Component({
  selector: 'app-abstract-component',
  template: '',
})
export abstract class AbstractComponent extends AbstractBaseClass implements OnInit, OnDestroy {
  /** @hidden */
  protected debug = AppConfig.debugEnabled;

  /**
   * Reference to the Model associated with the Component and instantiated from the Scheme provided.
   * @category Model
   */
  model: EntityModel;

  /** Referencia al servicio heredado de `AbstractModelService` */
  service: AbstractModelService;

  /**
   * Instance of the loader controller, loading controllers programmatically control the loading component.
   * @category Dependencies
   */
  loadingCtrl: LoadingController;

  /** @hidden Referencia a la instancia del controlador */
  loader: any;

  /** Referencia a la `factory` que resuelve isntancias para este componente.
   * ```typescript
   * this.factory = this.resolver.resolveComponentFactory(this.constructor as any);
   * ```
   */
  factory: ComponentFactory<unknown>;

  /** Subscribers correspondientes a observables que habrá que completar al destruir el componente. */
  subscribers: Subscriber<any>[] = [];
  /** Subscriptores de los que habrá que desubscribirse al destruir el componente. */
  subscriptions: Subscription[] = [];

  // Dependencies
  // ---------------------------------------------------------------------------------------------------

  /**
   * Reference to a _ComponentFactoryResolver_ instance, a registry that maps Components to generated ComponentFactory classes that can be used to create instances of components.
   * @category Dependencies
   */
  resolver: ComponentFactoryResolver;

  /**
   * Instance of the document sanitizer, helps preventing Cross Site Scripting Security bugs (XSS)
   * by sanitizing values to be safe to use in the different DOM contexts.
   * @category Dependencies
   */
   sanitizer: DomSanitizer;

   /** @category Dependencies */ localize: LocalizationService;

  /**
   * @param schema Scheme of the Model associated with the Component.
   */
  constructor(
    /** @hidden */ public injector: Injector,
    /** @hidden */ public schema: EntitySchema,
  ) {
    super(injector);

    // Inject required dependencies.
    this.sanitizer = this.injector.get<DomSanitizer>(DomSanitizer);
    this.resolver = this.injector.get<ComponentFactoryResolver>(ComponentFactoryResolver);
    this.localize = this.injector.get<LocalizationService>(LocalizationService);

    // Obtenemos una instancia del modelo.
    if (this.schema) { this.model = new EntityModel(this.schema, this.translate); }
  }


  // ---------------------------------------------------------------------------------------------------
  //  selector
  // ---------------------------------------------------------------------------------------------------

  /** Devuelve el selector del presente componente declarado en el atributo decorador `@Component({ selector })`.
   *
   * Se puede utilizar para realizar consultaas dirigidas únicamente al DOM del componente. Por ejemplo para
   * referenciar su componente hijo `ion-list`, como se muestra a continuación:
   * ```typescript
   * const list = document.querySelector(`${this.selector} ion-list`);
   * ```
   */
  get selector(): string {
    if (!this.factory) { this.factory = this.resolver.resolveComponentFactory(this.constructor as any); }
    return this.factory?.selector || '';
  }


  // ---------------------------------------------------------------------------------------------------
  //  Angular & Ionic lifecycle
  // ---------------------------------------------------------------------------------------------------

  /** @category Lifecycle */
  ngOnInit(): void {
    if (this.debug) { console.log('AbstractComponent:' + this.constructor.name + '.ngOnInit()'); }
  }

  /** @category Lifecycle */
  ngOnDestroy(): void {
    if (this.debug) { console.log('AbstractComponent:' + this.constructor.name + '.ngOnDestroy()'); }
    // Completamos y cancelamos las suscripciones.
    if (this.subscribers?.length) { this.subscribers.map(sub => sub.complete()); }
    if (this.subscriptions?.length) { this.subscriptions.map(sub => sub.unsubscribe()); }
  }

  /** @category Lifecycle */
  ionViewWillLeave(): void {
    if (this.debug) { console.log('AbstractComponent:' + this.constructor.name + '.ionViewWillLeave()'); }
  }

  /** @category Lifecycle */
  ionViewDidLeave(): void {
    if (this.debug) { console.log('AbstractComponent:' + this.constructor.name + '.ionViewDidLeave()'); }
  }

  /** @category Lifecycle */
  ionViewWillEnter(): void {
    if (this.debug) { console.log('AbstractComponent:' + this.constructor.name + '.ionViewWillEnter()'); }
  }

  /** @category Lifecycle */
  ionViewDidEnter(): void {
    if (this.debug) { console.log('AbstractComponent:' + this.constructor.name + '.ionViewDidEnter()'); }
  }


  // ---------------------------------------------------------------------------------------------------
  //  Resolvers
  // ---------------------------------------------------------------------------------------------------

  /**
   * Gets the model scheme by its name.
   * @category Resolvers
   * @deprecated
   */
  protected resolveSchemaByName(schema: string, Model: any): EntitySchema {
    for (const prop in Model) {
      if (prop === schema) {
        // Devolvemos el schema encontrado.
        return Model[prop];
      }
    }
    for (const propName in Model) {
      if (Model[propName]) {
        const prop = Model[propName];
        if (typeof prop === 'object' && prop.hasOwnProperty('name')) {
          // console.log({ propName, prop, schema, equals: EntityName.equals(name, schema) });
          if (EntityName.equals(prop.name, schema)) {
            return prop;
          }
        }
      }
    }
    return null;
  }

  /**
   * Returns the definition of the component so that the injector can instantiate it.
   * @param component: the selector of the component.
   * @category Resolvers
   */
  protected resolveFactory(component: any, options?: { componentName?: string }): Promise<any> { return resolveComponentFactory(component, options); }


  // ---------------------------------------------------------------------------------------------------
  //  Dependencies
  // ---------------------------------------------------------------------------------------------------


  protected createFormControlGetters(frm: FormGroup, parent?: string): void {
    // console.log('createFormControlGetters -> frm => ', frm);
    if (frm instanceof FormGroup) {
      for (const ctrl in frm.controls) {
        if (frm.controls.hasOwnProperty(ctrl)) {
          // Comprobamos que tiene validadores declarados o es un booleano (necesitamos el getter para hacer que el ion-label que acompaña al checkbox sea clickable).
          if (frm.controls[ctrl] instanceof FormControl && (frm.controls[ctrl].validator || typeof frm.controls[ctrl].value === 'boolean')) {
            if (this.debug) { console.log('AbstractComponent:' + this.constructor.name + '.createFormControlGetters() => ', { ctrl:  (parent ? parent + '.' : '') + ctrl, control: frm.controls[ctrl] }); }
            this.createFormControlGetter(frm, ctrl);
          }
          if (frm.controls[ctrl] instanceof FormGroup) {
            // Creamos un getter para el grupo.
            if (this.debug) { console.log('AbstractComponent:' + this.constructor.name + '.createFormControlGetters() => ', { ctrl:  (parent ? parent + '.' : '') + ctrl, control: frm.controls[ctrl] }); }
            Object.defineProperty(this, ctrl, {
              get: () => frm.controls[ctrl] as FormGroup,
              enumerable: true,
              configurable: true,
            } as PropertyDescriptor);
            // Llamada recursiva.
            this.createFormControlGetters(frm.controls[ctrl] as FormGroup, (parent ? parent + '.' : '') + ctrl);
          }
          if (frm.controls[ctrl] instanceof FormArray) {
            // Creamos un getter para el array de controles.
            if (this.debug) { console.log('AbstractComponent:' + this.constructor.name + '.createFormControlGetters() => ', { ctrl:  (parent ? parent + '.' : '') + ctrl, control: frm.controls[ctrl] }); }
            Object.defineProperty(this, ctrl, {
              get: () => frm.controls[ctrl] as FormArray,
              enumerable: true,
              configurable: true,
            } as PropertyDescriptor);
          }
        }
      }
    }
  }

  protected createFormControlGetter(frm: FormGroup, ctrl: string): void {
    Object.defineProperty(this, ctrl, {
      get: () => frm.controls[ctrl] as FormControl,
      enumerable: true,
      configurable: true,
    } as PropertyDescriptor);
  }

  getter(formControlName: string): any {
    const descriptor = Object.getOwnPropertyDescriptor(this, formControlName);
    if (typeof descriptor?.get !== 'function') {
      const proto = Object.getPrototypeOf(this);
      const descriptorProto = Object.getOwnPropertyDescriptor(proto, formControlName);
      // console.log('descriptor => ', { descriptor, proto });
      if (typeof descriptorProto?.get !== 'function') { throw new Error(`No se ha encontrado del descriptor de la propiedad '${formControlName}' para mapear el getter.`); }
    }
    return this[formControlName];
  }

  // ---------------------------------------------------------------------------------------------------
  //  Dependencies
  // ---------------------------------------------------------------------------------------------------

  /**
   * Injects the requested dependencies on the indicated hosts.
   * @category Dependencies
   * @param dependencies Example: { auth: AuthService, api: ApiService }
   */
  protected injectDependencies(dependencies: any, ...hosts: any): void {
    if (dependencies) {
      for (const host of hosts) {
        for (const dep in dependencies) {
          if (dependencies.hasOwnProperty(dep)) {
            if (!this.hasDependency(host, { [dep]: dependencies[dep] })) {
              console.log(`AbstractClass.injectDependencies() -> inject ${dep} => `, { [dep]: dependencies[dep] });
              host[dep] = this.injector.get<any>(dependencies[dep]);
              console.log(`AbstractClass.injectDependencies() -> injected ${dep} => `, { host, dependency: host[dep] });
            }
          }
        }
      }
    }
  }

  /**
   * Checks if the object already has another property with the same name as the dependency you want to add.
   * @category Dependencies
   * @param dependency Example: { auth: AuthService }
   */
  protected hasDependency(host: any, dependency: any): boolean {
    for (const dep in dependency) {
      if (dependency.hasOwnProperty(dep)) {
        for (const prop in host) {
          if (prop === dep) { return true; }
        }
        return false;
      }
    }
    return false;
  }


  // ---------------------------------------------------------------------------------------------------
  //  colorMatch
  // ---------------------------------------------------------------------------------------------------

  /**
   * Devuelve un contenido html con las ocurrencias del texto coloreadas.
   *
   * **Usage**
   * ```html
   * <text-colorized [value]="row.nombre" [match]="match"></text-colorized>
   * ```
   */
  colorMatch(text: string, match: string, options?: { splitWords?: boolean, ignoreCase?: boolean, ignoreAccents?: boolean, distinguishWords?: boolean, maxDistinctions?: number }): SafeHtml {
    if (!match || !text) { return text; }
    if (!options) { options = {}; }
    if (options.splitWords === undefined) { options.splitWords = true; }
    if (options.ignoreCase === undefined) { options.ignoreCase = true; }
    if (options.ignoreAccents === undefined) { options.ignoreAccents = true; }
    if (options.distinguishWords === undefined) { options.distinguishWords = true; }
    if (options.maxDistinctions === undefined) { options.maxDistinctions = 3; }
    if (typeof text !== 'string') { text = String(text); }
    const flags = options.ignoreCase ? 'ig' : 'g';

    if (!options.distinguishWords && !options.ignoreAccents) {
      // Separamos las palabras escritas y eliminamos los signos de puntuación.
      match = options.splitWords ? matchWords(match).join('|') : match;
      text = text.replace(new RegExp('(' + match + ')(?![^<]*>|[^<>]*</)', flags), '<span class="filtered">$1</span>');
      return this.sanitizer.bypassSecurityTrustHtml(text);

    } else {
      // Separamos las palabras escritas y eliminamos los signos de puntuación.
      const words = options.splitWords ? matchWords(match) : [match];
      // Si hay que ignorar acentos...
      if (options.ignoreAccents) {
        const matches: string[][] = [];
        // Normalizamos la cadena.
        const normalized = String(text).normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        // Marcamos las palabras buscadas.
        const mark = '<~#~>'; words.map(word => {
          // Buscamos las posiciones de todas las ocurrencias en la cadena normalizada.
          let replaced = normalized.replace(new RegExp('(' + word + ')(?![^<]*>|[^<>]*</)', flags), `${mark}$1`);
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
            text = text.replace(new RegExp('(' + variant + ')(?![^<]*>|[^<>]*</)', flags), `<span class="${css.join(' ')}">$1</span>`);
          });
        }

      } else {
        // Encapsulamos las palabras originales con un tag <span> y las clases 'filtered'.
        for (let i = 0; i < words.length; i++) {
          const css = ['filtered']; if (options.distinguishWords) { css.push(`filtered-word-${i % options.maxDistinctions + 1}`); }
          text = text.replace(new RegExp('(' + words[i] + ')(?![^<]*>|[^<>]*</)', flags), `<span class="${css.join(' ')}">$1</span>`);
        }
      }
      return this.sanitizer.bypassSecurityTrustHtml(text);
    }
  }


  // ---------------------------------------------------------------------------------------------------
  //  breakpoints
  // ---------------------------------------------------------------------------------------------------

  /** Realiza un media query para conocer cuando se ha producido un punto de ruptura en el tamaño del dispositivo.  */
  isBreakpoint(size: string, direction?: 'up' | 'down' | 'min-width' | 'max-width') {
    return isBreakpoint(size, direction);
  }


  // ---------------------------------------------------------------------------------------------------
  //  Loader
  // ---------------------------------------------------------------------------------------------------

  presentLoader(message?: string): Promise<any> {
    return new Promise((resolve, reject) => {
      // Comprobamos si el loader está compartido.
      if (!this.loader) {
        // Creamos un nuevo loader.
        this.loadingCtrl.create({
          message: this.translate.instant(message || 'api.updating') + '...',
          spinner: 'circles',
          // translucent: true,

        }).then(loader => {
          // Mostramos el loader.
          loader.present();
          // Devolvemos una referencia al loader.
          resolve(loader);

        }).catch(error => reject(error));
      }
    });
  }

  dismissLoader(loader: any): void {
    if (this.debug) { console.log('AbstractComponent:' + this.constructor.name + '.dismissLoader(loader) => ', loader); }
    // Ocultamos el loader actual.
    if (loader) { loader.dismiss(); }
  }


  // ---------------------------------------------------------------------------------------------------
  //  translate
  // ---------------------------------------------------------------------------------------------------

  /**
   * Devuelve una cadena de texto con la traducción resultante.
   *
   * Cuando se pasan múltiples claves de traducción al servicio `TranslateService` éste devuelve un objeto con el nombre de la clave y
   * el texto resultante interpolado. Con una llamada a esta función se obtiene un texto resultado de concatenarlas todas.
   *
   * **Usage**
   * Ejemplo de una llamada simple donde únicamente se indica una clave de traducción.
   * ```typescript
   * const str = this.resolveTranslate('user.name_required');
   * // returns 'Se requiere un nombre para el usuario'
   * ```
   *
   * Ejemplo con una traducción parametrizada donde 'notify.nueva_reserva' tiene por valor 'Nueva reserva nº {{id}}':
   * ```typescript
   * const str = this.resolveTranslate({ key: 'notify.nueva_reserva', interpolateParams: { id: 123 });
   * // returns 'Nueva reserva nº 123'
   * ```
   *
   * Ejemplo con múltiples traducciones concadenadas:
   * ```typescript
   * const str = this.resolveTranslate({ key: ['notify.nueva_reserva', 'reserva.multiples_vehiculos'], interpolateParams: { id: 123 });
   * // returns 'Nueva reserva nº 123 con múltiples vehículos'
   * ```
   *
   * Llamada equivalente:
   * ```typescript
   * const str = this.resolveTranslate(this.translate({ key: ['notify.nueva_reserva', 'reserva.multiples_vehiculos'], interpolateParams: { id: 123 }));
   * // returns 'Nueva reserva nº 123 con múltiples vehículos'
   * ```
   * @param str: clave de la traducción u objeto válido para una llamada al servicio `TranslateService`.
   * @param concat: texto que se utilizará para unir múltiples cadenas de traducción.
   * @category Resolvers
   */
  protected resolveTranslate(str: string | object, concat?: string): string {
    if (typeof str === 'object' && str.hasOwnProperty('key')) {
      str = this.translate.instant((str as any).key, (str as any).interpolateParams);
    }
    return resolveTranslate(str, concat);
  }

}
