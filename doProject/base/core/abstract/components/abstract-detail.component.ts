import { OnInit, OnDestroy, Injector, Component, ViewChild, Input } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormGroup, AbstractControl, FormArray, FormControl } from '@angular/forms';
import { ModalController, NavController, IonHeader } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { first } from 'rxjs/operators';

import { AppConfig } from 'src/core/app-config';
import { ApiEntity, ApiSearchClauses } from 'src/core/api';
import { ThemeService, deepAssign } from 'src/core/util';

import { EntityDetailSchema, EntitySchema, RowHookFunction } from '../model/entity-schema';
import { EntityName, EntityModel } from '../model/entity-model';
import { AbstractModelService } from '../abstract-model.service';
import { AbstractComponent } from './abstract.component';
import { EntityQuery } from '../model/entity-query';


@Component({
  selector: 'app-abstract-detail-component',
  template: '',
})
export abstract class AbstractDetailComponent extends AbstractComponent implements OnInit, OnDestroy {
  protected debug = true && AppConfig.debugEnabled;
  @ViewChild(IonHeader, { static: false }) header: IonHeader;


  // ---------------------------------------------------------------------------------------------------
  //  Properties
  // ---------------------------------------------------------------------------------------------------

  /** Referencia a la fila de datos. */
  @Input() row: { [key: string]: any } = {};

  /** Referencia al formulario de la ficha */
  frm: FormGroup = new FormGroup({});

  /** Clave que identifica a la consulta de forma inequívoca en el servicio. Si no se establece se utiliza el nombre de la entidad por defecto. */
  queryKey: string;

  /** Consulta asociada con el componente. */
  query: EntityQuery = undefined;

  /** Indica cuando hay una operación de carga de datos en marcha. */
  loading: boolean | string = false;
  /** Indica cuando ha finalizado de cargar la fila */
  loaded = false;

  /**
   * Indica cuando hay una operación en marcha de precarga de datos para otro componente de detalle.
   *
   * **Usage**
   * ```html
   * <ion-spinner *ngIf="preloading"></ion-spinner>
   * ```
   */
  preloading: boolean | string = false;

  /** Indica cuando se ha cargado el componente. */
  initialized = false;

  /** Indica cuando el formulario se ha abierto para crear una nueva fila en el contexto de selección de una fila del componente de lista. */
  isPickRowMode = false;

  // Dependencies
  /** @category Dependencies */ router: Router;
  /** @category Dependencies */ route: ActivatedRoute;
  /** @category Dependencies */ nav: NavController;
  /** @category Dependencies */ modal: ModalController;
  /** @category Dependencies */ theme: ThemeService;

  /** Suscriptor para monitorizar los cambios en el formulario y transmitirlos a la fila. */
  formChangesSubscription: Subscription = undefined;


  // ---------------------------------------------------------------------------------------------------
  //  Exposing model for template
  // ---------------------------------------------------------------------------------------------------

  /** @category Model */ get entity(): EntityName { return this.model ? this.model.name : undefined; }
  /** @category Model */ get friendly(): EntityName { return this.model ? this.model.friendly : undefined; }
  /** @category Model */ get primaryKey(): string { return this.model ? this.model.primaryKey : undefined; }
  /** @category Model */ get detail(): EntityDetailSchema { return this.model ? this.model.detail : undefined; }
  /** @category Model */ get headerText(): string { return this.model ? this.model.detail.headerText : undefined; }


  // ---------------------------------------------------------------------------------------------------
  //  constructor
  // ---------------------------------------------------------------------------------------------------

  service: AbstractModelService;

  /** constructor function */
  constructor(
    public injector: Injector,
    public schema: EntitySchema,
  ) {
    super(injector, schema);
    if (this.debug) { console.log('AbstractDetailComponent:' + this.constructor.name + '.constructor()'); }

    // Inject required dependencies.
    this.route = this.injector.get<ActivatedRoute>(ActivatedRoute);
    this.router = this.injector.get<Router>(Router);
    this.nav = this.injector.get<NavController>(NavController);
    this.modal = this.injector.get<ModalController>(ModalController);
    this.theme = this.injector.get<ThemeService>(ThemeService);

    if (this.route.snapshot.data.schema) {
      this.schema = this.route.snapshot.data.schema;
      this.model = new EntityModel(this.schema, this.translate);
    }
  }


  // ---------------------------------------------------------------------------------------------------
  //  Angular lifecycle : ngOnInit . ngOnDestroy
  // ---------------------------------------------------------------------------------------------------

  /** @category Lifecycle */
  ngOnInit(): void {
    super.ngOnInit();

    if (this.debug) { console.log('AbstractDetailComponent:' + this.constructor.name + '.ngOnInit()'); }
    // Inyectamos las dependencias adicionales.
    if (this.model.detail.dependencies) { this.injectDependencies(this.model.detail.dependencies, this, this.service); }
    // Clonamos el formulario de datos del modelo.
    if (this.model.detail.frm instanceof FormGroup) { this.frm = this.cloneForm(this.model.detail.frm); }
    // Creamos los getters para hacer accesibles los controles del formulario en el template.
    if (this.frm instanceof FormGroup) { this.createFormControlGetters(this.frm); }
    // Establecemos una clave por defecto.
    if (!this.queryKey) { this.queryKey = this.model.name.plural; }
    // Nos suscribimos para recibir órdenes externas.
    this.subscriptions.push(this.service.refreshDetail.subscribe(idreg => this.refreshRow(idreg)));
    // Nos aseguramos de que existe una consulta administrada en el servicio para la entidad del modelo.
    this.query = this.service.registerQuery(this.model, this.queryKey);

    // Cargamos la fila.
    this.getRow().catch(error => this.showAlert({ message: error.message }).finally(() => this.nav.pop()));
  }

  /** @category Lifecycle */
  ngOnDestroy(): void {
    if (this.debug) { console.log('AbstractDetailComponent:' + this.constructor.name + '.ngOnDestroy()'); }
    // Eliminamos las suscripciones.
    if (this.formChangesSubscription) { this.formChangesSubscription.unsubscribe(); }
    // Desactivamos el modo y notificamos que no se ha creado la fila.
    if (this.isPickRowMode) { this.isPickRowMode = false; AbstractModelService.pickRowNotify.next(); }
    super.ngOnDestroy();
  }


  /**
   * Deep clones the given AbstractControl, preserving values, validators, async validators, and disabled status.
   * @param control AbstractControl
   * @returns AbstractControl
   */
  protected cloneForm<T extends AbstractControl>(control: T): T {
    let newControl: T;

    if (control instanceof FormGroup) {
      const formGroup = new FormGroup({}, control.validator, control.asyncValidator);
      const controls = control.controls;

      Object.keys(controls).forEach(key => {
        formGroup.addControl(key, this.cloneForm(controls[key]));
      });
      newControl = formGroup as any;

    } else if (control instanceof FormArray) {
      const formArray = new FormArray([], control.validator, control.asyncValidator);
      control.controls.forEach(formControl => formArray.push(this.cloneForm(formControl)));
      newControl = formArray as any;

    } else if (control instanceof FormControl) {
      newControl = new FormControl(control.value, { validators: control.validator, updateOn: control.updateOn }, control.asyncValidator) as any;

    } else {
      throw new Error('Error: unexpected control value');
    }

    if (control.disabled) { newControl.disable({ emitEvent: false }); }

    return newControl;
  }


  // ---------------------------------------------------------------------------------------------------
  //  getRow
  // ---------------------------------------------------------------------------------------------------

  protected refreshRow(idreg: number): void {
    if (!this.row || !idreg) { return; }
    // Comprobamos que la orden de refresco es para esta fila.
    if (this.row[this.primaryKey] === idreg) {
      this.getRow().catch(error => this.showAlert({ message: error.message }));
    }
  }

  protected getRow(): Promise<any> {
    if (this.debug) { console.log('AbstractDetailComponent:' + this.constructor.name + '.getRow()'); }
    // Encapsulamos en un observable por si queremos implementar des de la clase heredada: super.getRow().subscribe()
    return new Promise<any>((resolve, reject) => {
      // Obtenemos la fila para llenar el formulario.
      this.resolveRow().then((row: any) => {
        // Inicializamos la fila con los valores del formulario del modelo.
        if (row[this.primaryKey] === 'new' && this.frm instanceof FormGroup) {
          row = Object.assign(this.clone(this.frm.value), { [this.primaryKey]: 'new' });
          if (this.detail.flatRow) { row = this.unGroupRowByForm(row, this.frm); }
        }
        if (this.debug) { console.log('AbstractDetailComponent:' + this.constructor.name + '.getRow() -> row => ', { row, 'this.frm': this.frm }); }
        // adding | opening
        this.resolveGetRowHook(row).pipe(first()).subscribe(resolved => {
          if (this.debug) { console.log('AbstractDetailComponent:' + this.constructor.name + '.resolveRowHook() -> resolved =>', resolved); }
          // mapping
          EntityModel.resolveRowHook(this.model.detail.mapping || this.mapping, resolved, this).pipe(first()).subscribe(mapped => {
            if (this.debug) { console.log('AbstractDetailComponent:' + this.constructor.name + '.resolveRowHook() -> mapped =>', mapped); }
            // Referenciamos la fila.
            this.row = mapped;
            // Establecemos la info en el formulario.
            if (this.frm instanceof FormGroup) { this.frm.reset(this.detail.flatRow ? this.groupRowByForm(this.row, this.frm) : this.row, { emitEvent: false }); }
            if (this.debug) { console.log('AbstractDetailComponent:' + this.constructor.name + '.getRow() -> this.frm => ', this.frm); }
            // Si todavía no existe un suscriptor...
            if (!this.formChangesSubscription) {
              // Monitorizamos los cambios para sincronizar los datos.
              this.formChangesSubscription = this.frm.valueChanges.subscribe(value => {
                if (this.debug) { console.log('AbstractDetailComponent:' + this.constructor.name + ' -> this.frm.valueChanges.subscribe() -> value => ', value); }
                // Desagrupamos el valor.
                if (this.frm instanceof FormGroup) { value = this.detail.flatRow ? this.unGroupRowByForm(value, this.frm) : value; }
                // Sincronizamos los valores con la fila.
                deepAssign(this.row, value);
                if (this.debug) { console.log('AbstractDetailComponent:' + this.constructor.name + ' -> this.frm.valueChanges.subscribe(value) => ', { 'this.frm': this.frm, 'this.row': this.row, value }); }
                // Informamos a la clase heredada de los cambios en el formulario.
                this.formChanged(value);
              });
            }
            // Establecemos el indicador de estado.
            this.loaded = true;
            if (this.frm instanceof FormGroup) {
              this.frm.markAsPristine();
              if (this.debug) { console.log('AbstractDetailComponent:' + this.constructor.name + '.getRow() -> this.frm.markAsPristine();'); }
            }
            // Notificamos la fila de detalle que ha sido cargada.
            this.service.detail.next(this.row);
            resolve(this.row);

          }, (error: any) => reject(error));
        }, (error: any) => reject(error));
      }, (error: any) => reject(error));
    });
  }

  protected resolveRow(): Promise<any> {
    return new Promise<any>((resolve: any, reject: any) => {
      // Si está habilitada la precarga y existe una fila precargada en el servicio.
      if (this.model.preload && !!this.service.preloadedRow) {
        // Obtenemos la fila y limpiamos el servicio.
        const row = this.service.preloadedRow;
        this.service.preloadedRow = undefined;
        if (this.debug) { console.log('AbstractDetailComponent:' + this.constructor.name + '.resolveRow() -> preloaded => ', row); }
        resolve(row);

      } else {
        // Obtenemos el identificador de la fila.
        EntityModel.resolveAsyncValue(this.model.detail.id, this).pipe(first()).subscribe((id: 'new' | number) => {
          if (this.debug) { console.log('AbstractDetailComponent:' + this.constructor.name + '.resolveRow() -> EntityModel.resolveAsyncValue(this.model, id) => ', id); }
          // Obtenemos la fila para llenar el formulario.
          this.service.getRow(this.query, id, { host: this }).pipe(first()).subscribe((row: any) => {
            if (this.debug) { console.log('AbstractDetailComponent:' + this.constructor.name + '.resolveRow() -> row => ', row); }
            resolve(row);

          }, (error: any) => reject(error));
        }, (error: any) => reject(error));
      }
    });
  }

  private resolveGetRowHook(row: any): any {
    // Comprobamos si la fila es nueva.
    if (row[this.primaryKey] === 'new') {
      // Resolvemos la función de fila.
      // const adding = this.model.detail.adding || this.adding;
      if (this.debug) { console.log('AbstractDetailComponent:' + this.constructor.name + '.resolveRowHook(adding)'); }
      return EntityModel.resolveRowHook(this.model.detail.adding || this.adding, row, this);

    } else {
      // Resolvemos la función de fila.
      if (this.debug) { console.log('AbstractDetailComponent:' + this.constructor.name + '.resolveRowHook(opening)'); }
      return EntityModel.resolveRowHook(this.model.detail.opening || this.opening, row, this);
    }
  }

  protected groupRowByForm(original: any, frm: FormGroup): any {
    // Clonamos la fila, que es más rápido que hacer JSON.parse(JSON.stringify(original));
    const row: any = this.clone(original);

    for (const prop in frm.controls) {
      if (frm.controls[prop] instanceof FormGroup) {
        const group: FormGroup = frm.controls[prop] as FormGroup;
        row[prop] = {};
        for (const field in group.controls) {
          if (group.controls[field] instanceof FormControl) {
            row[prop][field] = row[field];
            delete row[field];
          }
        }
      }
    }
    return row;
  }

  protected unGroupRowByForm(value: any, frm: FormGroup, level = 1): any {
    // Clonamos la fila, que es más rápido que hacer JSON.parse(JSON.stringify(original));
    const row: any = this.clone(value);

    for (const prop in frm.controls) {
      if (frm.controls[prop] instanceof FormGroup) {
        const group: FormGroup = frm.controls[prop] as FormGroup;
        let curLevel = 1; let curGroup: any = frm; while (curGroup.parent) { curLevel += 1; curGroup = curGroup.parent; }
        for (const field in group.controls) {
          if (group.controls[field] instanceof FormControl) {
            row[field] = row[prop][field];
            delete row[prop][field];
          } else if (group.controls[field] instanceof FormGroup) {
            if (curLevel < level) {
              deepAssign(row, this.unGroupRowByForm(row[prop][field], group.controls[field] as FormGroup, level));
            } else {
              row[field] = row[prop][field];
            }
            delete row[prop][field];
          }
        }
        delete row[prop];
      }
    }
    return row;
  }


  // ---------------------------------------------------------------------------------------------------
  //  edit
  // ---------------------------------------------------------------------------------------------------

  /** RowHook para sobreescribir en la clase heredada y recibir información cada vez que cambia el formulario. */
  formChanged(value: any): void { }


  // ---------------------------------------------------------------------------------------------------
  //  save . delete
  // ---------------------------------------------------------------------------------------------------

  saveRow(data?: any): Promise<any> {
    return new Promise<any>((resolve, reject) => {
      if (this.debug) { console.log('AbstractDetailComponent:' + this.constructor.name + '.saveRow() -> this.frm.value => ', this.frm.value); }
      if (!data && this.frm instanceof FormGroup) {
        // Actualizamos el valor del formulario. Si existen FormArrays con otros FormGroup hijos, esto actualiza toda la jerarquía.
        this.frm.updateValueAndValidity();
        // Desagrupamos el valor del formulario.
        data = this.detail.flatRow ? this.unGroupRowByForm(this.frm.value, this.frm) : this.frm.value;
      }

      if (this.debug) { console.log('AbstractDetailComponent:' + this.constructor.name + '.saveRow() -> resolveRowHook(saving) => '); }
      EntityModel.resolveRowHook(this.model.detail.saving || this.saving, data, this).pipe(first()).subscribe(row => {

        if (this.debug) { console.log('AbstractDetailComponent:' + this.constructor.name + '.saveRow(entity, row) => ', { entity: this.entity, row }); }
        this.service.saveRow(this.query, row, { host: this }).pipe(first()).subscribe(savedRow => {
          if (this.debug) { console.log('AbstractDetailComponent:' + this.constructor.name + ' -> resolve(savedRow)', savedRow); }
          if (typeof savedRow === 'number') {
            /** @deprecated No se espera que se devuelva el identificador sino la fila entera. */
            // Establecemos el identificador de registro.
            this.row[this.primaryKey] = savedRow;
            if (this.frm instanceof FormGroup) { this.frm.patchValue({ [this.primaryKey]: this.row[this.primaryKey] }, { emitEvent: false }); }
            if (this.frm instanceof FormGroup) { this.frm.markAsPristine(); }
            // Devolvemos la fila y navegamos, si procede.
            resolve(savedRow);
            if (this.isPickRowMode) { this.isPickRowMode = false; AbstractModelService.pickRowNotify.next({ model: this.model, row: savedRow }); }
            if (this.isPickRowMode || this.model.detail.navigateBackOnSave) { this.nav.pop(); }

          } else {
            // mapping
            EntityModel.resolveRowHook(this.model.detail.mapping || this.mapping, savedRow, this).pipe(first()).subscribe(mapped => {
              // Establecemos la fila entera.
              this.row = mapped;
              if (this.frm instanceof FormGroup) { this.frm.patchValue(this.detail.flatRow ? this.groupRowByForm(this.row, this.frm) : this.row, { emitEvent: false }); }
              if (this.frm instanceof FormGroup) { this.frm.markAsPristine(); }
              // Devolvemos la fila y navegamos, si procede.
              resolve(mapped);
              if (this.isPickRowMode) { this.isPickRowMode = false; AbstractModelService.pickRowNotify.next({ model: this.model, row: mapped }); }
              if (this.isPickRowMode || this.model.detail.navigateBackOnSave) { this.nav.pop(); }

            }, (error: any) => reject(error));
          }
        }, (error: any) => reject(error));
      }, (error: any) => reject(error));
    });
  }

  deleteRow(): Promise<boolean> {
    return new Promise<any>((resolve, reject) => {
      if (this.isNew) {
        resolve(true);
        this.nav.pop();

      } else {
        this.service.deleteRow(this.query, this.frm.value, { host: this }).pipe(first()).subscribe((result: boolean) => {
          if (this.debug) { console.log('AbstractDetailComponent:' + this.constructor.name + ' -> this.service.deleteRow() => ', result); }
          resolve(result);
          if (result && this.model.detail.navigateBackOnDelete) { this.nav.pop(); }

        }, (error: any) => reject(error));
      }
    });
  }


  // ---------------------------------------------------------------------------------------------------
  //  Row Hooks
  // ---------------------------------------------------------------------------------------------------

  /** Función de fila para sobrescribir en la clase heredada. Se ignora cuando se establece la función de fila análoga del modelo `detail.adding`. */
  protected adding(row: any, host: any): any { return row; }
  /** Función de fila para sobrescribir en la clase heredada. Se ignora cuando se establece la función de fila análoga del modelo `detail.opening`. */
  protected opening(row: any, host: any): any { return row; }
  /** Función de fila para sobrescribir en la clase heredada. Se ignora cuando se establece la función de fila análoga del modelo `detail.mapping`. */
  protected mapping(row: any, host: any): any { return row; }
  /** Función de fila para sobrescribir en la clase heredada. Se ignora cuando se establece la función de fila análoga del modelo `detail.saving`. */
  protected saving(row: any, host: any): any { return row; }


  // ---------------------------------------------------------------------------------------------------
  //  getters for template
  // ---------------------------------------------------------------------------------------------------

  /** Referencia a la clase para llamadas asíncronas desde el template. */
  get Me(): any { return this; }

  /** Indica si la fila actual es nueva. */
  get isNew(): boolean { return this.row && this.row[this.primaryKey] === 'new'; }

  /** Marca el control como pristine cuando se borra su valor para impedir que se habilite innecesariamente el botón de guardar. */
  markEmptyAsPristine(event: any, name: string): void {
    if (this.debug) { console.log(this.constructor.name + '.markEmptyAsPristine() => ', event); }
    if (!event.detail.value) { (this[name] as FormControl).markAsPristine(); }
  }


  // ---------------------------------------------------------------------------------------------------
  //  select foreign component
  // ---------------------------------------------------------------------------------------------------

  /** Muestra un componente de lista en un modal y lo prepara para la selección de una fila. */
  selectForeign(schema: EntitySchema | EntityModel, listComponent: any, options?: {
    foreignKey?: string,
    foreignProp?: string,
    parentKey?: string,
    parentDisplay?: string | RowHookFunction,
    onDismiss?: (host: AbstractDetailComponent, data: any) => {},
    /** Transmite un filtro a la consulta realizada por el componente. */
    filter?: ApiSearchClauses,
    /** Parámetros adicionales. Si posteriomente hay que navegar se transmiten a queryParams. */
    params?: { [key: string]: any };
    /** Indica si se podrán crear nuevas filas durante el modo picRow. Por defecto es `false`. */
    canCreate?: boolean;
  }): void {
    if (this.debug) { console.log('AbstractDetailComponent:' + this.constructor.name + '.selectForeign(schema, listComponent, options) => ', { schema, options }); }
    // Comprobamos las opciones.
    if (!options) { options = {}; }
    // Obtenemos el modelo.
    const parent: EntityModel = schema instanceof EntityModel ? schema : new EntityModel(schema, this.translate);

    // Obtenemos la info foránea.
    const foreign = EntityModel.resolveForeignKey(this.model.detail.foreign , parent, options.foreignKey);
    if (!foreign) { throw new Error(`No se ha podido obtener la información foránea para la entidad '${parent}'.`); }
    if (this.debug) { console.log('this.resolveForeignInfo(parent) => ', foreign); }

    // Priorizamos la info del argumento 'options' frente a la del modelo.
    const foreignKey = options.foreignKey || foreign.foreignKey;
    const foreignProp = options.foreignProp || foreign.foreignProp;
    const parentKey = options.parentKey || foreign.parentKey;
    const parentDisplay = options.parentDisplay || foreign.parentDisplay;
    if (!this.frm.value.hasOwnProperty(foreignKey)) { throw new Error(`No se encuentra la clave foránea '${foreignKey}' en el formulario del componente hijo.`); }

    // Obtenemos el valor actual del formulario del compomente hijo que ha solicitado la selección.
    const selected: any = this.frm.value[foreignKey];
    if (this.debug) { console.log('AbstractDetailComponent:' + this.constructor.name + ' -> ', { selected, schema, parent }); }

    const component = listComponent || parent.list.componentUrl;
    const filter = options.filter;
    const params = options.params;
    const canCreate = options.canCreate;
    // Abrimos el componente de lista como un modal para seleccionar la fila padre.
    this.service.pickRow({ component, selected, filter, canCreate, params }).then(row => {
      // Comprobamos si se ha suministrado una función para el callback del modal.
      let onDismiss = options.onDismiss;
      if (!onDismiss) {
        // Se requiere el modelo para suministrar una función propia.
        if (!parent) { throw new Error('Se requiere el modelo de la entidad para crear una función propia (onDismiss) que se usará como callback durante la finalización del modal.'); }
        // Si no se ha suministrado ninguna la declaramos ahora.
        onDismiss = (host: AbstractDetailComponent, data: any): any => {
          if (this.debug) { console.log('onDismiss() => ', data); }
          if (!data) { return; }
          // Obtenemos el valor de la descripción para la clave foránea.
          EntityModel.resolveAsyncProperty(data, parentDisplay, this).pipe(first()).subscribe((display: any) => {
            if (this.debug) { console.log('EntityModel.resolveAsyncProperty(data, parentDisplay, this).subscribe((display: any) => ', { foreignProp, parentDisplay, display }); }
            // Tratamos el identificador de fila.
            const id = isNaN(+data[parentKey]) || data[parentKey] === null || data[parentKey] === '' ? data[parentKey] : +data[parentKey];
            // Adjuntamos la clave primaria al objeto (en lugar de devolver el valor de una propiedad foránea, la función ha devuelto varias propiedades con forma de objeto.
            let foreignRow: any = { [parentKey]: id };
            // Comprobamos el tipo de datos devuelto.
            if (typeof display === 'object') {
              // Fusionamos las propiedades devueltas por display para obtener la fila foránea.
              foreignRow = Object.assign(foreignRow, display);
              if (this.debug) { console.log('foreignRow = Object.assign(foreignRow, display) => ', foreignRow); }

            } else {
              // Añadimos la propiedad display.
              const propDisplay = typeof parentDisplay === 'string' ? parentDisplay : foreignProp;
              foreignRow[propDisplay] = display;
              if (this.debug) { console.log(`foreignRow[propDisplay:${propDisplay}] = display => `, foreignRow); }
            }
            // Almacenamos el valor foráneo en el componente hijo.
            this.row[foreignProp] = foreignRow;
            // Establecemos la clave foránea en la fila hija.
            this.frm.patchValue({ [foreignKey]: id });
            // Marcamos el formulario como dirty (ya que solo cambia cuando el usuario acciona la UI y este cambio ha sido programático).
            this.frm.markAsDirty();
            if (this.debug) { console.log('AbstractDetailComponent:' + this.constructor.name + ' => ', { row: this.row, frm: this.frm }); }
          });
        };
      }
      onDismiss(this, row);
    });
  }


  // ---------------------------------------------------------------------------------------------------
  //  Ionic lifecycle
  // ---------------------------------------------------------------------------------------------------

  /** @category Lifecycle */
  ionViewWillLeave(): void {
    super.ionViewWillLeave();
    if (this.debug) { console.log('AbstractDetailComponent:' + this.constructor.name + '.ionViewWillLeave()'); }
  }

  /** @category Lifecycle */
  ionViewDidLeave(): void {
    super.ionViewDidLeave();
    if (this.debug) { console.log('AbstractDetailComponent:' + this.constructor.name + '.ionViewDidLeave()'); }
  }

  /** @category Lifecycle */
  ionViewWillEnter(): void {
    super.ionViewWillEnter();
    this.theme.checkStatusBar(this);

    if (this.debug) { console.log('AbstractDetailComponent:' + this.constructor.name + '.ionViewWillEnter()'); }
    // NOTA: Este evento sucede varias veces a lo largo de la vida del componente. Para comprobar si es la primera vez que se abre el componente usamos la variable initialized.
    if (!this.initialized) {
      // Actualizamos el estado.
      if (this.frm instanceof FormGroup) { this.frm.markAsPristine(); }
      // Comprobamos si requiere notificación.
      this.route.queryParams.pipe(first()).subscribe(params => this.isPickRowMode = params.pickRowNotify === 'true');

    }
  }

  /** @category Lifecycle */
  ionViewDidEnter(): void {
    super.ionViewDidEnter();
    if (this.debug) { console.log('AbstractDetailComponent:' + this.constructor.name + '.ionViewDidEnter()'); }
    // Establecemos el indicador de estado.
    this.initialized = true;
  }

}
