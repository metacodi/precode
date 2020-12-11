import { Component, Injector } from '@angular/core';
import { FormGroup } from '@angular/forms';

import { BaseControlType } from '../model/meta-types';
import { DynamicFieldsGrid  } from '../model/dynamic-types';
import { DynamicAbstractComponent } from '../components/dynamic-abstract.component';


@Component({
  selector: 'dynamic-fields-grid',
  template: `
    <ion-grid
      [class]="grid?.class"
      [ngClass]="evalExpr(grid?.ngClass)"
    >
      <ng-container *ngFor="let group of rows">
        <ion-row
          *ngIf="host.hasPermission(group.permission)"
          [class]="group.row?.class"
          [ngClass]="evalExpr(group.row?.ngClass)"
        >
          <ion-col *ngIf="group.title" size="12"><h3 class="center">{{evalOrExprAndTr(group.title)}}</h3></ion-col>
          <ng-container *ngFor="let field of group.fields">
            <ng-container *ngIf="host.hasPermission(field.component.permission)">
              <ion-col *ngIf="visible(field.component.visible)"
                [size]="size(field, 'xs')"
                [sizeSm]="size(field, 'sm')"
                [sizeMd]="size(field, 'md')"
                [sizeLg]="size(field, 'lg')"
                [sizeXl]="size(field, 'xl')"
              >
                <ng-container dynamicField [frm]="frm" [field]="field" [host]="host"></ng-container>
              </ion-col>
            </ng-container>
          </ng-container>
        </ion-row>
      </ng-container>
    </ion-grid>
  `
})
export class DynamicFieldsGridComponent extends DynamicAbstractComponent implements DynamicFieldsGrid {

  grid: BaseControlType;
  rows: DynamicFieldsGrid['rows'];
  frm: FormGroup;
  host: any;

  constructor(protected injector: Injector) { super(injector); }

}
