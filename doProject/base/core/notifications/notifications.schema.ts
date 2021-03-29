import { ApiSearchClauses } from 'src/core/api';

import { EntitySchema } from '../abstract/model/entity-schema';


export const NotificationsSchema: EntitySchema = {
  name: { singular: 'notifiedUser', plural: 'notifiedUsers' },
  list: {
    map: (row: any, host: any) => {
      const notification = row.notified.notification;
      try {
        if (!!notification.data && typeof notification.data !== 'object') {
          notification.data = JSON.parse(notification.data);
        }
      } catch (ex) {
        console.log(notification.data);
      }
      row.notified.header = {
        key: Object.values(notification.notificationType.localize).join('.'),
        interpolateParams: notification.data
      };
      row.notified.alert = host.resolveTranslate({
        key: Object.values(notification.notificationType.localize).join('.'),
        interpolateParams: notification.data
      });
      // Creamos un indicador interno de procesado para las notificaciones no recibidas.
      row.processed = !!row.notified.silent;
      return row;
    },
    paginate: true,
    // itemsPerPage: 100,
    search: (host: any): ApiSearchClauses => ['idUser', '=', host.user.instant?.idreg],
    fields: 'idreg,idUser,idNotified',
    foreign: {
      idNotified: {
        notified: 'idNotification,action,silent,mandatory,needToSolve,attended',
        notification: 'idNotificationType,data,created', notificationType: 'idLocalize,description', localize: 'path,key',
      },
    },
    orderBy: 'notified.notification.created-',
  }
};
