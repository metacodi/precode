import { Component, Injector } from '@angular/core';
import { FormGroup } from '@angular/forms';

import { FieldType } from '../model/meta-types';
import { DynamicFieldsRow } from '../model/dynamic-types';
import { DynamicAbstractComponent } from '../components/dynamic-abstract.component';


@Component({
  selector: 'dynamic-fields-row',
  template: `
    <ion-row>
      <ng-container *ngFor="let field of fields">
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
  `
})
export class DynamicFieldsRowComponent extends DynamicAbstractComponent implements DynamicFieldsRow {

  fields: FieldType[];
  frm: FormGroup;
  host: any;

  constructor(protected injector: Injector) { super(injector); }

}
