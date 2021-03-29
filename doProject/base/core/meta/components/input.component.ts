import { Component, Injector } from '@angular/core';

import { InputControlType, FieldType, InputComponentType } from '../model/meta-types';
import { DynamicFieldComponent } from './dynamic-field.component';


@Component({
  selector: 'dynamic-input',
  template: `
    <ng-container [formGroup]="frm" *ngIf="host.hasPermission(field.component.permission)">
      <ion-item
        *ngIf="visible(field.component.visible)"
        [ngClass]="evalExpr(field.component.ngClass)"
        [class]="field.component.class"
        [ngStyle]="evalExpr(field.component.ngStyle)"
        [style]="field.component.style"
        [disabled]="disabled(field.component.disabled)"
        (click)="evalEvent(field.component.click, $event)"
      >
        <ng-container *ngIf="showIcon">
          <ion-icon [name]="iconName" [src]="iconSrc" [slot]="iconSlot"
            [ngClass]="evalExpr(icon?.ngClass)"
            [class]="icon?.class"
            [ngStyle]="evalExpr(icon?.ngStyle)"
            [style]="icon?.style"
            [color]="evalOrExpr(icon?.color)"
            [ios]="evalExpr(icon?.ios)"
            [md]="evalExpr(icon?.md)"
            [mode]="icon?.mode"
            [size]="icon?.size"
          ></ion-icon>
        </ng-container>
        <ng-container *ngIf="field.component.label">
          <ion-label
            [ngClass]="evalExpr(label?.ngClass)"
            [class]="label?.class"
            [ngStyle]="evalExpr(label?.ngStyle)"
            [style]="label?.style"
            [color]="evalOrExpr(label?.color)"
            [position]="label?.position"
            [mode]="icon?.mode"
          >{{labelText}}</ion-label>
        </ng-container>
        <ion-input [formControlName]="field.name"
          [ngClass]="evalExpr(control?.ngClass)"
          [class]="control?.class"
          [ngStyle]="evalExpr(control?.ngStyle)"
          [style]="control?.style"
          [accept]="control?.accept"
          [autocapitalize]="control?.autocapitalize ||'off'"
          [autocomplete]="control?.autocomplete ||'off'"
          [autocorrect]="control?.autocorrect ||'off'"
          [autofocus]="evalOrExpr(control?.autofocus) || false"
          [clearInput]="evalOrExpr(control?.clearInput) || false"
          [clearOnEdit]="evalOrExpr(control?.clearOnEdit)"
          [color]="evalOrExpr(control?.color)"
          [debounce]="control?.debounce || 0"
          [inputmode]="control?.inputmode"
          [max]="control?.max"
          [maxlength]="control?.maxlength"
          [min]="control?.min"
          [minlength]="control?.minlength"
          [mode]="control?.mode"
          [multiple]="control?.multiple"
          [name]="control?.name"
          [pattern]="control?.pattern"
          [placeholder]="evalOrExprAndTr(control?.placeholder)"
          [readonly]="evalOrExpr(control?.readonly) || false"
          [required]="evalOrExpr(control?.required) || false"
          [size]="control?.size"
          [spellcheck]="control?.spellcheck || false"
          [step]="control?.step"
          [type]="control?.type || 'text'"
          (ionBlur)="evalEvent(control?.ionBlur, $event)"
          (ionFocus)="evalEvent(control?.ionFocus, $event)"
          (ionChange)="evalEvent(control?.ionChange, $event)"
          (ionInput)="evalEvent(control?.ionInput, $event)"
        ></ion-input>
      </ion-item>
      <ng-container *ngFor="let err of field.component.errors">
        <p *ngIf="hasError(err)" [class]="err.class || 'error'">{{evalOrExprAndTr(err.text)}}</p>
      </ng-container>
    </ng-container>
  `
})
export class InputComponent extends DynamicFieldComponent {

  field: FieldType;

  constructor(protected injector: Injector) { super(injector); }

  get control(): InputControlType {
    return (this.field.component as InputComponentType).input;
  }

}
