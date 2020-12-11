import { ComponentFactoryResolver, ComponentRef, Directive, Input, OnChanges, OnInit, ViewContainerRef } from '@angular/core';
import { FormGroup } from '@angular/forms';

import { BaseControlType } from '../model/meta-types';
import { DynamicFieldsGrid } from '../model/dynamic-types';
import { DynamicFieldsGridComponent } from './dynamic-fields-grid.component';


/**
 * ```typescript
 * const rows: DynamicRowType[];
 * ```
 * ```html
 * <ng-container dynamic-fields-grid [frm]="frm" [rows]="rows" [host]="Me"></ng-container>
 * ```
 */
@Directive({
  // tslint:disable-next-line: directive-selector
  selector: '[dynamic-fields-grid]'
})
export class DynamicFieldsGridDirective implements DynamicFieldsGrid, OnChanges, OnInit {

  @Input() grid: BaseControlType;
  @Input() rows: DynamicFieldsGrid['rows'];
  @Input() frm: FormGroup;
  @Input() host: any;

  component: ComponentRef<DynamicFieldsGrid>;

  constructor(
    private resolver: ComponentFactoryResolver,
    private container: ViewContainerRef
  ) {}

  ngOnChanges(): void {
    if (this.component) {
      this.component.instance.grid = this.grid;
      this.component.instance.rows = this.rows;
      this.component.instance.frm = this.frm;
      this.component.instance.host = this.host;
    }
  }

  ngOnInit(): void {
    const component = this.resolver.resolveComponentFactory<DynamicFieldsGrid>(DynamicFieldsGridComponent);
    this.component = this.container.createComponent(component);
    this.component.instance.grid = this.grid;
    this.component.instance.rows = this.rows;
    this.component.instance.frm = this.frm;
    this.component.instance.host = this.host;

  }
}
