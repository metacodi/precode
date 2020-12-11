
export type dateTime = string | null;

export interface Localize {
  idreg?: number;
  path?: string;
  key: string;
}

export interface NotificationType {
  idreg?: number;
  idLocalize?: number | null;
  localize?: Localize;
  interpolateParams?: { [key: string]: string };
  description?: string;
  showAlert?: boolean;
  showYesNo?: boolean;
  needToSolve?: boolean;
}

export interface Notification {
  idreg?: number;
  idNotificationType?: number;
  notificationType?: NotificationType;
  data?: any;
  created?: dateTime;
  sent?: dateTime;
  solved?: dateTime;
}

export interface NotificationAction {
  idreg?: number;
  code: string;
  isShared?: boolean;
}

export interface Notified {
  idreg?: number;
  notification?: Notification;
  idNotification?: number;
  idAttendedAction?: number | null;
  AttendedActions?: NotificationAction;
  idSolvedAction?: number | null;
  SolvedActions?: NotificationAction;
  idUser?: number;
  sent?: dateTime;
  received?: dateTime;
  attended?: dateTime;
  solved?: dateTime;
  deleted?: dateTime;
  failed?: boolean;
  // Se añaden durante el mapeado.
  header?: { key: string; interpolateParams: { [key: string]: any } };
  alert?: string;
}
