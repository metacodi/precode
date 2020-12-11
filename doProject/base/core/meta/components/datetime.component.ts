import { Component, Injector } from '@angular/core';

import { DatetimeControlType, FieldType } from '../model/meta-types';
import { DynamicFieldComponent } from './dynamic-field.component';


@Component({
  selector: 'dynamic-datetime',
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
        <ion-datetime [formControlName]="field.name"
          [ngClass]="evalExpr(control?.ngClass)"
          [class]="control?.class"
          [ngStyle]="evalExpr(control?.ngStyle)"
          [style]="control?.style"
          [cancelText]="evalOrExprAndTr(control?.cancelText || 'buttons.cancel')"
          [dayNames]="evalOrExprAndTr(control?.dayNames)"
          [dayShortNames]="evalOrExprAndTr(control?.dayShortNames)"
          [dayValues]="control?.dayValues"
          [displayFormat]="evalOrExprAndTr(control?.displayFormat || 'MMM D, YYYY')"
          [displayTimezone]="evalOrExprAndTr(control?.displayTimezone)"
          [doneText]="evalOrExprAndTr(control?.doneText || 'buttons.accept')"
          [hourValues]="control?.hourValues"
          [max]="evalOrExpr(control?.max)"
          [min]="evalOrExpr(control?.min)"
          [minuteValues]="control?.minuteValues"
          [mode]="control?.mode"
          [monthNames]="evalOrExprAndTr(control?.monthNames)"
          [monthShortNames]="evalOrExprAndTr(control?.monthShortNames)"
          [monthValues]="control?.monthValues"
          [name]="control?.name"
          [pickerFormat]="control?.pickerFormat"
          [pickerOptions]="control?.pickerOptions"
          [placeholder]="evalOrExprAndTr(control?.placeholder)"
          [readonly]="evalOrExpr(control?.readonly) || false"
          [yearValues]="control?.yearValues"
          (ionBlur)="evalEvent(control?.ionBlur, $event)"
          (ionFocus)="evalEvent(control?.ionFocus, $event)"
          (ionChange)="evalEvent(control?.ionChange, $event)"
          (ionCancel)="evalEvent(control?.ionCancel, $event)"
          style="padding-left: 0; padding-right: 0;"
        ></ion-datetime>
      </ion-item>
      <ng-container *ngFor="let err of field.component.errors">
        <p *ngIf="hasError(err)" [class]="err.class || 'error'">{{evalOrExprAndTr(err.text)}}</p>
      </ng-container>
    </ng-container>
  `
})
export class DatetimeComponent extends DynamicFieldComponent {

  field: FieldType;

  constructor(protected injector: Injector) { super(injector); }

  get control(): DatetimeControlType {
    return (this.field.component as any).datetime;
  }

}
