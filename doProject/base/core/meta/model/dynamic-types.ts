import { FormGroup } from '@angular/forms';

import { BaseControlType, stringOrExpr, FieldType } from '../model/meta-types';


export interface DynamicFieldsRow {
  fields: FieldType[];
  frm: FormGroup;
  host: any;
}

export interface DynamicRowType {
  title?: stringOrExpr;
  row?: BaseControlType;
  fields: FieldType[];
  permission?: string | boolean;
}

export interface DynamicFieldsGrid {
  grid?: BaseControlType;
  rows: DynamicRowType[];
  frm: FormGroup;
  host: any;
}
