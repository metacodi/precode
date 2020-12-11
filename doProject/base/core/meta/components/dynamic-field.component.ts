import { Injector } from '@angular/core';
import { FormGroup, FormControl } from '@angular/forms';
import { UpperCasePipe, LowerCasePipe, TitleCasePipe } from '@angular/common';

import { FieldType, IconControlType, LabelControlType } from '../model/meta-types';
import { DynamicAbstractComponent } from './dynamic-abstract.component';


/**
 * Componente base del que se heredan todos los componentes de campo.
 */
export abstract class DynamicFieldComponent extends DynamicAbstractComponent {

  field: FieldType;
  frm: FormGroup;
  host: any;

  constructor(protected injector: Injector) { super(injector); }


  // ---------------------------------------------------------------------------------------------------
  //  label
  // ---------------------------------------------------------------------------------------------------

  get label(): LabelControlType {
    return this.field.component.label as LabelControlType;
  }

  get labelText(): string {
    let text: string =  typeof this.label === 'string' ? this.label : this.evalOrExpr(this.label.text) as string;
    if (this.label.pipes && this.label.pipes.length) {
      this.label.pipes.map(pipe => {
        switch (pipe) {
          case 'lowercase': text = (new LowerCasePipe()).transform(text); break;
          case 'uppercase': text = (new UpperCasePipe()).transform(text); break;
          case 'titlecase': text = (new TitleCasePipe()).transform(text); break;
          case 'translate': text = this.translate.instant(text); break;
        }
      });
    } else {
      text = this.translate.instant(text);
    }
    return text;
  }


  // ---------------------------------------------------------------------------------------------------
  //  icon
  // ---------------------------------------------------------------------------------------------------

  get icon(): IconControlType {
    return typeof this.field.component.icon === 'object' ? this.field.component.icon as IconControlType : undefined;
  }

  get showIcon(): boolean {
    return !!this.field.component.icon;
  }

  get iconName(): string | undefined {
    const icon: any = this.field.component.icon;
    return typeof icon === 'string' && !icon.includes('assets') ? icon : this.evalOrExpr(icon.name) as string || undefined;
  }

  get iconSrc(): string | undefined {
    const icon: any = this.field.component.icon;
    return typeof icon === 'string' && icon.includes('assets') ? icon : this.evalOrExpr(icon.src) as string || undefined;
  }

  get iconSlot(): 'start' | 'end' | undefined {
    const icon: any = this.field.component.icon;
    return icon === undefined || icon.slot === undefined ? 'start' : icon.slot;
  }


  // ---------------------------------------------------------------------------------------------------
  //  errors
  // ---------------------------------------------------------------------------------------------------

  /**
   * Comprueba si hay que mostrar un error al usuario.
   *
   * ```html
   * <p *ngIf="initialized && (!isNew || isNew && (getter('descripcion').touched || getter('descripcion').dirty)) && getter('descripcion').errors?.required">{{'misdirecciones.descripcion_required' | translate}}</p>
   * ```
   *
   * ```html
   * <p *ngIf="(getter('email').touched || getter('email').dirty) && getter('email').errors?.required">{{'login.email_required' | translate}}</p>
   * ```
   */
  hasError(err: any): boolean {
    // Si no se ha definido un comportamiento, lo establecemos por defecto.
    if (!err.behavior) { err.behavior = ['touched', 'dirty']; }
    console.log('hasError => ', { field: this.field.name,
      1: (!this.host.hasOwnProperty('initialized') || !!this.host.initialized),
      2: (
        !err.behavior.includes('isNew') && this.evalBehavior(err.behavior) ||
        (!this.host.isNew || !!this.host.isNew && this.evalBehavior(err.behavior))
      ),
      3: !!this.frmControl.errors && !!this.frmControl.errors[err.validator],
      err, formControl: this.frmControl, initialized: this.host.initialized, isNew: !!this.host.isNew
    });
    return (
      // Comprobamos que se haya inicializado el formulario
      (!this.host.hasOwnProperty('initialized') || !!this.host.initialized)
      // Comprobamos el comportamiento definido.
      && (
        !err.behavior.includes('isNew') && this.evalBehavior(err.behavior) ||
        (!this.host.isNew || !!this.host.isNew && this.evalBehavior(err.behavior))
      )
      // Comprobamos que exista el error en el control del formulario.
      && !!this.frmControl.errors && !!this.frmControl.errors[err.validator]
      // // Comprobamos que existe un texto para mostrar.
      // && !!this.evalOrExpr(err.text) as any
    );
  }

  evalBehavior(behavior): boolean {
    return (
      !behavior.includes('touched') || !!this.frmControl.touched ||
      !behavior.includes('dirty') || !!this.frmControl.dirty
    );
  }

  get frmControl(): FormControl {
    return this.frm.controls[this.field.name] as FormControl;
  }


}
