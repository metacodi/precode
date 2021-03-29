
export type dateTime = string | null;

export interface Localize {
  idreg?: number;
  path: string;
  key: string;
}

export interface NotificationType {
  idreg?: number;
  idLocalize?: number | null;
  localize: Localize;
  interpolateParams?: { [key: string]: string };
  // description?: string;
}

export interface Notification {
  idreg?: number;
  idNotificationType: number;
  notificationType: NotificationType;
  data: any;
  created: dateTime;
}

export interface Notified {
  idreg?: number;
  notification: Notification;
  idNotification: number;
  action: number | null;
  notificationAction: NotificationAction;
  silent: boolean;
  mandatory: boolean;
  needToSolve: boolean;
  attended: dateTime;
  // Se añaden durante el mapeado.
  header?: { key: string; interpolateParams: { [key: string]: any } };
  alert?: string;
}

export interface NotifiedUser {
  idreg: number;
  idNotified: number;
  idUser: number;
  notified: Notified;
  processed?: boolean;
}
