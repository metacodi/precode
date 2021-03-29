# PickRowMode

`entity-schema.ts`
```typescript
export type PickRowOptions = {
  /** Indica la forma como se muestra el componente de lista AbstractListMode. */
  mode?: 'modal' | 'action-sheet' | 'picker' | 'popover' | 'popover-picker' | 'navigation';
  isModal?: boolean,
  isPopover?: boolean,
  /** Referencia a la importación del componente cuando el modo es `modal` */
  component?: any;
  /** Indica una ruta de navegación para el componente de lista cuando el modo es `navigation`. */
  route?: string;
  /** Establece el valor inicialmente seleccionado en el componente de lista. */
  selected?: any,
  /** Transmite un filtro a la consulta realizada por el componente. */
  filter?: ApiSearchClauses,
  /** Parámetros adicionales. Si posteriomente hay que navegar se transmiten a través de queryParams. */
  params?: { [key: string]: any };
  /** Define las propiedades que se inicializarán del componente de listado. */
  initialize?: { [key: string]: any };
  /** Indica si se podrán crear nuevas filas durante el modo picRow. Por defecto es `false`. */
  canCreate?: boolean;
  /** Establece el título de la página o del componente de lista. */
  title?: string;
};
```

<br />

`abstract-model.service.ts`
```typescript
abstract class AbstractModelService {

  static pickRowNotify: Subject<PickRowNotificationType> = new Subject<PickRowNotificationType>();

  pickRow(options: PickRowOptions): Promise<any> {
    return new Promise<any>((resolve: any, reject: any) => {

      if (options.mode === 'modal') {

        const componentProps = {
          initializePickRow: deepAssign({ canCreate: options.canCreate, isModal: true }, options.initialize)
        };
        this.modal.create({ component, componentProps }).then(modal => {
          const sub = AbstractModelService.pickRowNotify.subscribe((data: PickRowNotificationType) => {
            sub.unsubscribe();
            this.resolvePickRow(data, options).then(row => resolve(row)).catch(error => reject(error));
          });
          modal.onDidDismiss().then(() => this.theme.checkStatusBar());
          modal.present();
        }).catch(error => reject(error));

      } else if (options.mode === 'navigation') {

        const route = Array.isArray(options.route) ? options.route : [options.route];
        const queryParams = {
          pickRowNotify: true,
          canCreate: options.canCreate,
          selected: options?.initialize?.selected,
          filter: options?.initialize?.filter
        };
        this.router.navigate(route, { queryParams });
        const sub = AbstractModelService.pickRowNotify.subscribe((data: PickRowNotificationType) => {
          sub.unsubscribe();
          this.resolvePickRow(data, options).then(row => resolve(row)).catch(error => reject(error));
        });

      } else {
        resolve();
      }
    });
  }

  protected resolvePickRow(data: PickRowNotificationType, options: PickRowOptions): Promise<any> {
    return new Promise<any>((resolve: any, reject: any) => {

      if (data?.row[data.model.primaryKey] === 'new') {

        data.model.resolveRoute(data.model.detail.route, data.row, this).subscribe((route: any) => {
          const queryParams = deepAssign({ pickRowNotify: true }, options.params || {});
          this.router.navigate(route, { queryParams });
          const sub = AbstractModelService.pickRowNotify.subscribe((response: PickRowNotificationType) => {
            sub.unsubscribe();
            resolve(response?.row);
          });
        });

    } else {
        resolve(data?.row);
      }
    });
  }
}
```

<br />

`abstract-list.component.ts`
```typescript
abstract class AbstractListComponent {
  isPickRowMode = false;

  set initializePickRow(options: PickRowOptions) {
    this.isPickRowMode = true;
    const { selected, filter, canCreate, isModal, isPopover } = options;
    if (selected !== undefined) { this.selected = !!selected; }
    if (filter !== undefined) { this.initialFilter = filter; }
    if (canCreate !== undefined) { this.canCreate = !!canCreate; }
    if (isModal !== undefined) { this.isModal = !!isModal; }
    if (isPopover !== undefined) { this.isPopover = !!isPopover; }
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      // Respetamos el valor si se ha establecido previamente desde initializePickRow.
      this.isPickRowMode = params.pickRowNotify === undefined ? this.isPickRowMode : params.pickRowNotify === 'true';
      this.canCreate = params.canCreate === undefined ? this.canCreate : params.canCreate === 'true';
      this.selected = params.selected === undefined ? this.selected : +params.selected;
    });
  }

  selectRow(row?: any, options?: { ... }): void {
    if (this.isPickRowMode) {
      this.selected = isNaN(+options.idreg) || options.idreg === null || options.idreg === 'new' ? options.idreg : +options.idreg;
      this.isPickRowMode = false;
      this.closePickRow().then(() => {
        AbstractModelService.pickRowNotify.next({ model: this.model, row });
      });
    }
  }

  ngOnDestroy(): void {
    if (this.isPickRowMode) {
      this.isPickRowMode = false;
      AbstractModelService.pickRowNotify.next();
    }
  }

}
```

<br />

`abstract-detail.component.ts`
```typescript
abstract class AbstractDetailComponent {
  isPickRowMode = false;

  ionViewWillEnter(): void {
    if (!this.initialized) {
      this.route.queryParams.subscribe(params =>
        this.isPickRowMode = params.pickRowNotify === 'true'
      );
    }
  }

  saveRow(data?: any): Promise<any> {
    if (this.isPickRowMode) {
      this.isPickRowMode = false;
      AbstractModelService.pickRowNotify.next({ model: this.model, row: mapped }); }
      this.nav.pop();
    }
  }

  ngOnDestroy(): void {
    if (this.isPickRowMode) {
      this.isPickRowMode = false;
      AbstractModelService.pickRowNotify.next();
    }
  }
}
```

<br />

```typescript
selectPasajero(prestacion: any) {

  this.service.pickRow({
    component: PersonasListComponent,
    selected: this.persona(prestacion)?.idreg,
    params: { idCliente: this.row.cliente?.idreg },
  }).then(persona => {
    ...
  });
}
```

<br />

`personas-list.component.ts`
```typescript
abstract class PersonasListComponent extends AbstractListComponent {

  set initializePickRow(options: PickRowOptions) {
    super.initializePickRow = options;

    const list = this.model.list;
    const filtered = options.params?.idCliente;
    list.filter.pipeToBackend = !filtered;
    list.paginate = !filtered;
  }

}
```

<br />
