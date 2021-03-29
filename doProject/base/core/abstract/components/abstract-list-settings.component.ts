import { AfterViewChecked, Component, ElementRef, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { MenuController } from '@ionic/angular';
import { timer } from 'rxjs';

import { AppConfig } from 'src/core/app-config';
import { booleanOrExpr, numberOrExpr, stringOrExpr } from 'src/core/meta';
import { deepAssign } from 'src/core/util';
import { AbstractModelService } from '../abstract-model.service';

import { AbstractListSettings, AbstractListSettingsFilterPipeValue } from './abstract-list-settings';


export type ListSettingsChangedEvent = 'toggleView' | 'toggleViewOption' | 'toggleGroupBy' | 'toggleFilterPipe' | 'toggleFilterOption' | 'advancedSearch';

@Component({
  selector: 'list-settings',
  templateUrl: 'abstract-list-settings.component.html',
  styleUrls: ['abstract-list-settings.component.scss'],
})
export class ListSettingsComponent implements OnInit, AfterViewChecked {
  /** @hidden */
  protected debug = AppConfig.debugEnabled;

  @Input() expanded = true;

  /** Configuración de las búsquedas predefinidas. */
  @Input() settings: AbstractListSettings;
  /** Función que permite establecer el color relativo al estado. */
  @Input() estadoColor: (estado: number) => string;
  /** Referencia al servicio del componente. */
  @Input() service: AbstractModelService;
  /** Indicador de estado de carga de filas. */
  @Input() loading: boolean;


  /** Notifica la búsqueda seleccionada por el usuario. */
  @Output() listSettingsChanged = new EventEmitter<{ event: ListSettingsChangedEvent, data?: any }>();

  /** Estado de la interfaz relativa a los settings. */
  settingsUI = { expand: { search: true, splitWords: false, fields: false, itemsPerPage: false }};
  settingsOn = { search: false };

  constructor(
    public el: ElementRef,
    public menu: MenuController,
  ) {}

  ngOnInit() {
    // this.el.nativeElement.parentElement.style.setProperty('--inner-padding-end', '0px');
  }

  ngAfterViewChecked() {
  }

  /** Indica si el item de la sección (area) está seleccionado actualmente. */
  checked(area: any, item: any): boolean {
    // Ej: area = this.settings.view
    if (!area.current) { return false; }
    return item.name === area.current;
  }

  /** Toggle current view. */
  toggleView(item: any) {
    this.menu.close().finally(() => {
      this.settings.view.current = item.name;
      this.listSettingsChanged.emit({ event: 'toggleView', data: { item }});
    });
  }

  /** Toggle current view options. */
  toggleViewOption(item: any, option: any) {
    this.menu.close().finally(() => {
      item.options[option].value = !item.options[option].value;
      this.listSettingsChanged.emit({ event: 'toggleViewOption', data: { item, option }});
    });
  }

  /** Toggle current group. */
  toggleGroupBy(item: any) {
    this.menu.close().finally(() => {
      const group = this.settings.group.current ? this.settings.group.values.find(g => g.name === this.settings.group.current) : undefined;
      this.settings.group.current = group?.fields === item.fields ? '' : item.name;
      this.listSettingsChanged.emit({ event: 'toggleGroupBy', data: { item, group: this.settings.group.current ? group : undefined } });
      timer(100).subscribe(() => this.service.listSettingsAction.next({ action: 'groupBy', data: this.settings.group.current }));
    });
  }

  /** Toggle filter pipe columns. */
  toggleFilterPipe(item: any) {
    this.menu.close().finally(() => {
      item.value = !item.value;
      this.listSettingsChanged.emit({ event: 'toggleFilterPipe', data: item});
    });
  }

  /** Toggle filter pipe options. */
  toggleFilterOption(data: object) {
    this.menu.close().finally(() => {
      deepAssign(this.settings.search?.filter, data);
      this.listSettingsChanged.emit({ event: 'toggleFilterOption', data: { data } });
    });
  }

  /** Mostrar el filtro. */
  showAdvancedSearch() {
    this.menu.close().finally(() => {
      if (this.settings.search.current !== 'avanzada') {
        // this.settings.search.current = 'avanzada';
        this.service.listSettingsAction.next({ action: 'advancedSearch', data: true });
      } else {
        this.settings.search.current = 'cache';
        this.listSettingsChanged.emit({ event: 'advancedSearch', data: undefined });
        this.service.listSettingsAction.next({ action: 'find', data: 'cache' });
      }
    });
  }

  /** Ejecutar la búsqueda. */
  find(data: any) {
    this.menu.close().finally(() => {
      if (this.settings.search.current !== data.name) {
        this.settings.search.current = data.name;
        this.loading = true;
        this.service.listSettingsAction.next({ action: 'find', data });
      } else {
        this.settings.search.current = 'cache';
        this.service.listSettingsAction.next({ action: 'find', data: 'cache' });
      }
    });
  }

  /** Restaura la configuración a su valor por defecto. */
  restartSettings() {
    this.service.listSettingsAction.next({ action: 'restartSettings' });
  }

  /** Ejecuta la orden de impresión seleccionada. */
  imprimir(item: any) {
    this.service.listSettingsAction.next({ action: 'print', data: item });
  }

  collapseAllGroups() {
    this.menu.close().finally(() => {
      this.service.listSettingsAction.next({ action: 'groupBy', data: 'collapse' });
    });
  }


  // ---------------------------------------------------------------------------------------------------
  //  template
  // ---------------------------------------------------------------------------------------------------

  viewOptions(item: any): string[] {
    if (!item.options) { return []; }
    return Object.keys(item.options);
  }

  evalOrExpr(value: stringOrExpr | booleanOrExpr | numberOrExpr): string | boolean | number { return this.service?.evalOrExpr(value); }

}
