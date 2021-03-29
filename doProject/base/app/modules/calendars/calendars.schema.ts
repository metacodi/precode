import { EntitySchema } from 'src/core/abstract';


export const CalendarsSchema: EntitySchema = {
  name: 'calendars',
  primaryKey: 'name',
  list: {
    orderBy: 'name',
    componentUrl: 'app/calendars/calendars-list.component',
  }
};
