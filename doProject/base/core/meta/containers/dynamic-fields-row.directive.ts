import { ComponentFactoryResolver, ComponentRef, Directive, Input, OnChanges, OnInit, ViewContainerRef } from '@angular/core';
import { FormGroup } from '@angular/forms';

import { FieldType } from '../model/meta-types';
import { DynamicFieldsRow } from '../model/dynamic-types';
import { DynamicFieldsRowComponent } from './dynamic-fields-row.component';


@Directive({
  // tslint:disable-next-line: directive-selector
  selector: '[dynamic-fields-row]'
})
export class DynamicFieldsRowDirective implements DynamicFieldsRow, OnChanges, OnInit {

  @Input() fields: FieldType[];
  @Input() frm: FormGroup;
  @Input() host: any;

  component: ComponentRef<DynamicFieldsRow>;

  constructor(
    private resolver: ComponentFactoryResolver,
    private container: ViewContainerRef
  ) {}

  ngOnChanges(): void {
    if (this.component) {
      this.component.instance.fields = this.fields;
      this.component.instance.frm = this.frm;
      this.component.instance.host = this.host;
    }
  }

  ngOnInit(): void {
    const component = this.resolver.resolveComponentFactory<DynamicFieldsRow>(DynamicFieldsRowComponent);
    this.component = this.container.createComponent(component);
    this.component.instance.fields = this.fields;
    this.component.instance.frm = this.frm;
    this.component.instance.host = this.host;
  }
}
