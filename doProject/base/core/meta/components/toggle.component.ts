import { Component, Injector } from '@angular/core';

import { ToggleControlType, FieldType, ToggleComponentType } from '../model/meta-types';
import { DynamicFieldComponent } from './dynamic-field.component';


@Component({
  selector: 'dynamic-toggle',
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
            (click)="frm.controls[field.name].setValue(!frm.controls[field.name].value)"
            [ngClass]="evalExpr(label?.ngClass)"
            [class]="label?.class"
            [ngStyle]="evalExpr(label?.ngStyle)"
            [style]="label?.style"
            [color]="evalOrExpr(label?.color)"
            [position]="label?.position"
            [mode]="icon?.mode"
          >{{labelText}}</ion-label>
        </ng-container>
        <ion-toggle [formControlName]="field.name"
          [ngClass]="evalExpr(control?.ngClass)"
          [class]="control?.class"
          [ngStyle]="evalExpr(control?.ngStyle)"
          [style]="control?.style"
          [checked]="evalOrExpr(control?.checked)"
          [color]="evalOrExpr(control?.color)"
          [mode]="control?.mode"
          [name]="control?.name"
          [slot]="control?.slot || 'end'"
          (ionBlur)="evalEvent(control?.ionBlur, $event)"
          (ionFocus)="evalEvent(control?.ionFocus, $event)"
          (ionChange)="evalEvent(control?.ionChange, $event)"
        ></ion-toggle>
      </ion-item>
      <ng-container *ngFor="let err of field.component.errors">
        <p *ngIf="hasError(err)" [class]="err.class || 'error'">{{evalOrExprAndTr(err.text)}}</p>
      </ng-container>
    </ng-container>
  `
})
export class ToggleComponent extends DynamicFieldComponent {

  field: FieldType;

  constructor(protected injector: Injector) { super(injector); }

  get control(): ToggleControlType {
    return (this.field.component as ToggleComponentType).toggle;
  }
}
