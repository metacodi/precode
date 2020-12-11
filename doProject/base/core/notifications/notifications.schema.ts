import { ApiSearchClauses } from 'src/core/api';

import { EntitySchema } from '../abstract/model/entity-schema';


export const NotificationsSchema: EntitySchema = {
  name: 'notified',
  list: {
    map: (row: any, host: any) => {
      row.notification.data = JSON.parse(row.notification.data);
      row.header = {
        key: Object.values(row.notification.notificationType.localize).join('.'),
        interpolateParams: row.notification.data
      };
      row.alert = host.resolveTranslate({
        key: Object.values(row.notification.notificationType.localize).join('.'),
        interpolateParams: row.notification.data
      });
      return row;
    },
    search: (host: any): ApiSearchClauses => ({ AND: [['idUser', '=', host.user.idreg], ['deleted', 'is', null]] }),
    fields: 'idreg,idUser,idNotification,received,attended,solved,failed,notification(idNotificationType,data,created,sent,solved),idAttendedAction,idSolvedAction',
    foreign: {
      idNotification: { notification: 'idNotificationType,data,created,sent', notificationTypes: 'idLocalize,description,showAlert,showYesNo,needToSolve', localize: 'path,key' },
      idAttendedAction: { 'notificationActions->AttendedActions(idAttendedAction)': 'code' },
      idSolvedAction: { 'notificationActions->SolvedActions(idSolvedAction)': 'code' }
    },
    orderBy: 'notification.created-',
  }
};
