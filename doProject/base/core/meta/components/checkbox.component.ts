import { Component, Injector } from '@angular/core';

import { CheckboxComponentType, CheckboxControlType, FieldType } from '../model/meta-types';
import { DynamicFieldComponent } from './dynamic-field.component';


@Component({
  selector: 'dynamic-checkbox',
  template: `
    <ng-container [formGroup]="frm" *ngIf="host.hasPermission(field.component.permission)">
      <ion-item
        *ngIf="visible(field.component.visible)"
        [disabled]="disabled(field.component.disabled)"
        [ngClass]="evalExpr(field.component.ngClass)"
        [class]="field.component.class"
        [ngStyle]="evalExpr(field.component.ngStyle)"
        [style]="field.component.style"
        (click)="evalEvent(field.component.click, $event)"
      >
        <ion-checkbox [formControlName]="field.name"
          [ngClass]="evalExpr(control?.ngClass)"
          [class]="control?.class"
          [ngStyle]="evalExpr(control?.ngStyle)"
          [style]="control?.style"
          [checked]="evalOrExpr(control?.checked)"
          [color]="evalOrExpr(control?.color)"
          [indeterminate]="evalOrExpr(control?.indeterminate)"
          [mode]="control?.mode"
          [name]="control?.name"
          [slot]="control?.slot || 'start'"
          (ionBlur)="evalEvent(control?.ionBlur, $event)"
          (ionFocus)="evalEvent(control?.ionFocus, $event)"
          (ionChange)="evalEvent(control?.ionChange, $event)"
        ></ion-checkbox>
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
      </ion-item>
      <ng-container *ngFor="let err of field.component.errors">
        <p *ngIf="hasError(err)" [class]="err.class || 'error'">{{evalOrExprAndTr(err.text)}}</p>
      </ng-container>
    </ng-container>
  `
})
export class CheckboxComponent extends DynamicFieldComponent {

  field: FieldType;

  constructor(protected injector: Injector) { super(injector); }

  get control(): CheckboxControlType {
    return (this.field.component as CheckboxComponentType).checkbox;
  }
}
