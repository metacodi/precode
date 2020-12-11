import { OnInit, OnDestroy, Injector, Component } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { ModalController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';

import { AppConfig } from 'src/core/app-config';
import { ApiService } from 'src/core/api';

import { EntitySchema } from '../model/entity-schema';
import { AbstractComponent } from './abstract.component';



// ---------------------------------------------------------------------------------------------------
//  AbstractSearchComponent
// ---------------------------------------------------------------------------------------------------

/**
 * Componente base para realizar una búsqueda avanzada.
 *
 * **Usage**
 * ```typescript
 * ```
 */
@Component({
  selector: 'app-abstract-search-component',
  template: '',
})
export abstract class AbstractSearchComponent extends AbstractComponent implements OnInit, OnDestroy {
  protected debug = true && AppConfig.debugEnabled;

  /** Referencia al formulario del filtro */
  frm: FormGroup = new FormGroup({});

  modal: ModalController;
  api: ApiService;
  translate: TranslateService;

  // ---------------------------------------------------------------------------------------------------
  //  constructor
  // ---------------------------------------------------------------------------------------------------

  constructor(
    public injector: Injector,
    public schema: EntitySchema,
  ) {
    super(injector, schema);
    if (this.debug) { console.log('AbstractSearchComponent:' + this.constructor.name + '.constructor() => ', { component: this.constructor.name }); }

    // Inject required dependencies.
    this.modal = this.injector.get<ModalController>(ModalController);
    this.api = this.injector.get<ApiService>(ApiService);
    this.translate = this.injector.get<TranslateService>(TranslateService);

    // Recogemos la info del filtro del modelo.
    const filter: any = this.model.list.filter;

    // Establecemos el formulario para el filtro.
    if (filter.frm) { this.frm = filter.frm; }

    // Creamos los getters para hacer accesibles los controles del formulario en el template.
    if (this.frm instanceof FormGroup) { this.createFormControlGetters(this.frm); }
  }

  /** Establecemos el valor actual del filtro. */
  set filter(data: any) {
    if (this.debug) { console.log('AbstractSearchComponent:' + this.constructor.name + '.filter() => ', data); }
    // Establecemos el filtro actual.
    if (data === undefined) {
      this.frm.reset();

    } else {
      this.frm.patchValue(data);
    }
  }

  /** Responde al submit del formulario y se encarga de cerrar el modal y devolver el filtro. */
  onSubmit(form: any): void {
    if (this.debug) { console.log('AbstractSearchComponent:' + this.constructor.name + '.onSubmit(form) => ', form.value); }
    this.modal.dismiss(form.value);
  }

  /**
   * **Deprecated** En su lugar usar modal.dismiss() en el template.
   * @category Deprecated
   */
  dismiss(): void {
    this.modal.dismiss();
  }


  // ---------------------------------------------------------------------------------------------------
  //  Angular lifecycle : ngOnInit . ngOnDestroy
  // ---------------------------------------------------------------------------------------------------

  /** @category Lifecycle */
  ngOnInit(): void {
    super.ngOnInit();
    if (this.debug) { console.log('AbstractSearchComponent:' + this.constructor.name + '.ngOnInit()'); }
  }

  /** @category Lifecycle */
  ngOnDestroy(): void {
    super.ngOnDestroy();
    if (this.debug) { console.log('AbstractSearchComponent:' + this.constructor.name + '.ngOnDestroy()'); }
  }

  /** @category Lifecycle */
  ionViewWillLeave(): void {
    super.ionViewWillLeave();
    if (this.debug) { console.log('AbstractSearchComponent:' + this.constructor.name + '.ionViewWillLeave()'); }
  }

  /** @category Lifecycle */
  ionViewDidLeave(): void {
    super.ionViewDidLeave();
    if (this.debug) { console.log('AbstractSearchComponent:' + this.constructor.name + '.ionViewDidLeave()'); }
  }

  /** @category Lifecycle */
  ionViewWillEnter(): void {
    super.ionViewWillEnter();
    if (this.debug) { console.log('AbstractSearchComponent:' + this.constructor.name + '.ionViewWillEnter()'); }
  }

  /** @category Lifecycle */
  ionViewDidEnter(): void {
    super.ionViewDidEnter();
    if (this.debug) { console.log('AbstractSearchComponent:' + this.constructor.name + '.ionViewDidEnter()'); }
  }

}
