import { ComponentFactoryResolver, ComponentRef, Directive, Input, OnChanges, OnInit, Type, ViewContainerRef } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';

import { evalExpr } from 'src/core/util';

import { FieldType } from '../model/meta-types';
import { DynamicFieldComponent } from './dynamic-field.component';
import { ButtonComponent } from './button.component';
import { CheckboxComponent } from './checkbox.component';
import { DatetimeComponent } from './datetime.component';
import { InputComponent } from './input.component';
import { ToggleComponent } from './toggle.component';


export const SupportedDynamicComponents: {[type: string]: Type<DynamicFieldComponent>} = {
  button: ButtonComponent,
  checkbox: CheckboxComponent,
  datetime: DatetimeComponent,
  input: InputComponent,
  toggle: ToggleComponent,
};

@Directive({
  // tslint:disable-next-line: directive-selector
  selector: '[dynamicField]'
})
export class DynamicFieldDirective implements OnChanges, OnInit {

  @Input() field: FieldType;
  @Input() frm: FormGroup;
  @Input() host: any;

  component: ComponentRef<DynamicFieldComponent>;

  constructor(
    private resolver: ComponentFactoryResolver,
    private container: ViewContainerRef
  ) {}

  ngOnChanges(): void {
    if (this.component) {
      this.component.instance.field = this.field;
      this.component.instance.frm = this.frm;
      this.component.instance.host = this.host;
    }
  }

  ngOnInit(): void {
    if (!SupportedDynamicComponents[this.field.component.type]) {
      console.log({ field: this.field, frm: this.frm });
      const supportedTypes = Object.keys(SupportedDynamicComponents).join(', ');
      throw new Error(
        `No se ha implementado el uso de este componente metadático: (${this.field.component.type}).
        Componentes válidos: ${supportedTypes}`
      );
    }
    const component = this.resolver.resolveComponentFactory<DynamicFieldComponent>(SupportedDynamicComponents[this.field.component.type]);
    this.component = this.container.createComponent(component);
    this.component.instance.field = this.field;
    this.component.instance.frm = this.frm;
    this.component.instance.host = this.host;

    if (this.field.component.type !== 'button') {
      if (!this.frm.controls[this.field.name]) {
        console.log(this.constructor.name + '.ngOnInit() -> Create control', { field: this.field, frm: this.frm });
        const control = new FormControl(this.field.value.hasOwnProperty('default') ? (this.field.value as any).default : null);
        if (this.field.component.validators) { control.setValidators(this.evalExpr(this.field.component.validators, { Validators })); }
        this.frm.addControl(this.field.name, control);
      } else {
        // console.log(this.constructor.name + '.ngOnInit() -> Perfecto, el control ya existe !!!!!!', { field: this.field, frm: this.frm });
      }
    }
  }

  // ---------------------------------------------------------------------------------------------------
  //  evalExpr
  // ---------------------------------------------------------------------------------------------------

  evalExpr(expr: string, args?: { [key: string]: any }): any {
    // Evaluamos el código de la expresión.
    return evalExpr(expr, { args, host: this.host });
  }

}

