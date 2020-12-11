// ---------------------------------------------------------------------------------------------------
//  Roles abstractos
// ---------------------------------------------------------------------------------------------------

export const ROLE_ADMIN = 1;
export const ROLE_CLIENTE = 2;
export const ROLE_CONDUCTOR = 3;

// ---------------------------------------------------------------------------------------------------
//  Tipos empresa
// ---------------------------------------------------------------------------------------------------

export const ENTIDAD_FISICA = 1;
export const ENTIDAD_JURIDICA = 2;

// ---------------------------------------------------------------------------------------------------
//  Estado disponibilidad conductor
// ---------------------------------------------------------------------------------------------------

export const CONDUCTOR_FUERA_SERVICIO = 1;
export const CONDUCTOR_ACTIVO = 0;

export const CONDUCTOR_FUERA_TURNO = 1;
export const CONDUCTOR_EN_TURNO = 0;

export const CONDUCTOR_DISPONIBLE = 1;
export const CONDUCTOR_PENDIENTE = 2;
export const CONDUCTOR_OCUPADO = 3;


// ---------------------------------------------------------------------------------------------------
//  Estado servicio
// ---------------------------------------------------------------------------------------------------

export const SERVICIO_PENDIENTE = 0;
export const SERVICIO_CONFIRMADO = 1;
export const SERVICIO_ASIGNADO = 2;
export const SERVICIO_ACEPTADO = 3;
export const SERVICIO_EN_CAMINO = 4;
export const SERVICIO_LLEGANDO = 5;
export const SERVICIO_ESPERANDO = 6;
export const SERVICIO_INICIADO = 7;
export const SERVICIO_REALIZADO = 8;
export const SERVICIO_CANCELADO_USUARIO = 9;
export const SERVICIO_CANCELADO_ADMIN = 10;

export const estadosServicio = [
  // Booking
  { value: SERVICIO_PENDIENTE, display: 'Pendiente' },
  // Dispatching
  { value: SERVICIO_CONFIRMADO, display: 'Confirmado' },
  { value: SERVICIO_ASIGNADO, display: 'Asignado' },
  { value: SERVICIO_ACEPTADO, display: 'Aceptado' },
  // Tracking
  { value: SERVICIO_EN_CAMINO, display: 'En camino' },
  { value: SERVICIO_LLEGANDO, display: 'Llegando' },
  { value: SERVICIO_ESPERANDO, display: 'Esperando' },
  { value: SERVICIO_INICIADO, display: 'En curso' },
  // Finalizado
  { value: SERVICIO_REALIZADO, display: 'Realizado' },
  { value: SERVICIO_CANCELADO_USUARIO, display: 'Cancelado usuario' },
  { value: SERVICIO_CANCELADO_ADMIN, display: 'Cancelado admin' },
];


// ---------------------------------------------------------------------------------------------------
//  Estado prestación
// ---------------------------------------------------------------------------------------------------

export const PRESTACION_PENDIENTE = 0;
export const PRESTACION_ASIGNADA = 1;
export const PRESTACION_ACEPTADA = 2;
export const PRESTACION_EN_CAMINO = 3;
export const PRESTACION_LLEGANDO = 4;
export const PRESTACION_ESPERANDO = 5;
export const PRESTACION_INICIADA = 6;
export const PRESTACION_FINALIZADA = 7;
export const PRESTACION_CANCELADA = 8;

export const estadosPrestacion = [
  // Booking
  { value: PRESTACION_PENDIENTE, display: 'Pendiente' },
  // Dispatching
  { value: PRESTACION_ASIGNADA, display: 'Asignada' },
  { value: PRESTACION_ACEPTADA, display: 'Aceptada' },
  // Tracking
  { value: PRESTACION_EN_CAMINO, display: 'En camino' },
  { value: PRESTACION_LLEGANDO, display: 'Llegando' },
  { value: PRESTACION_ESPERANDO, display: 'Esperando' },
  { value: PRESTACION_INICIADA, display: 'En curso' },
  // Finalizado
  { value: PRESTACION_FINALIZADA, display: 'Finalizada' },
  // Cancelada
  { value: PRESTACION_CANCELADA, display: 'Cancelado' },
];


// ---------------------------------------------------------------------------------------------------
//  Tipo notificationes servicio
// ---------------------------------------------------------------------------------------------------

export const ALERTA_NUEVO_SERVICIO = 1;
export const ALERTA_NUEVO_SERVICIO_CON_MAS_VEHICULOS = 2;
export const ALERTA_SERVICIO_CONFIRMADO = 3;
export const ALERTA_CONDUCTOR_ASIGNADO = 4;
export const ALERTA_SERVICIO_ACEPTADO = 5;
export const ALERTA_SERVICIO_MODIFICADO = 6;
export const ALERTA_SERVICIO_VALORADO = 7;
export const ALERTA_SERVICIO_MODIFICADO_CON_MAS_VEHICULOS = 8;
export const ALERTA_OFERTA_REALIZADA = 9;
export const ALERTA_OFERTA_ACEPTADA = 10;
export const ALERTA_OFERTA_RECHAZADA = 11;
export const ALERTA_SERVICIO_CANCELADO = 12;
export const ALERTA_CONDUCTOR_RE_ASIGNADO = 13;
export const ALERTA_CONDUCTOR_DESASIGNADO = 14;
export const ALERTA_SERVICIO_RECHAZADO = 15;
export const ALERTA_SERVICIO_ESPERANDO = 16;
export const ALERTA_SERVICIO_LLEGANDO = 17;
export const ALERTA_SERVICIO_INICIADO = 18;
export const ALERTA_SERVICIO_FINALIZADO = 19;
export const ALERTA_PUEDE_REALIZAR_PAGO = 20;
export const ALERTA_VALORE_SERVICIO = 21;
export const ALERTA_SERVICIO_PAGADO = 22;
export const ALERTA_SERVICIO_ERROR_PAGO = 23;
export const ALERTA_PRESTACION_FINALIZADA = 24;
export const ALERTA_ERROR_PAGO = 25;
export const ALERTA_PRESTACION_PAGADA = 26;
export const ALERTA_UPDATE_BLOBS = 29;
export const ALERTA_UPDATE_PERMISSIONS = 30;


// ---------------------------------------------------------------------------------------------------
//  Acciones de Notificaciones
// ---------------------------------------------------------------------------------------------------

export const ACCION_NAVIGATE_SERVICIO = 1;
export const ACCION_NAVIGATE_OFERTA = 2;
export const ACCION_NAVIGATE_USER = 3;
export const ACCION_PRESTACION_PAGAR = 4;
export const ACCION_UPDATE_BLOBS = 5;
export const ACCION_UPDATE_PERMISSIONS = 6;


// ---------------------------------------------------------------------------------------------------
//  Tipo servicio
// ---------------------------------------------------------------------------------------------------

export const TIPO_SERVICIO_RESERVA = 1;
export const TIPO_SERVICIO_SOLICITUD = 2;
export const TIPO_SERVICIO_PARADA = 3;
export const TIPO_SERVICIO_CALLE = 4;

export const tiposServicio = [
  { value: 1, display: 'Reserva' },
  { value: 2, display: 'Solicitud' },
  { value: 3, display: 'Parada' },
  { value: 4, display: 'Recogida' },
];


// ---------------------------------------------------------------------------------------------------
//  Ubicaciones direcciones
// ---------------------------------------------------------------------------------------------------

export const UBICACION_MAPA = 0;
export const UBICACION_GEOLOCALIZADA = 1;
export const UBICACION_MI_DIRECCION = 2;
export const UBICACION_AEROPUERTO = 3;
export const UBICACION_TREN = 4;
export const UBICACION_PUERTO = 5;
export const UBICACION_BUS = 6;


// ---------------------------------------------------------------------------------------------------
//  Forma de pago
// ---------------------------------------------------------------------------------------------------

export const PAGO_EFECTIVO = 1;
export const PAGO_TRANSFERENCIA = 2;
export const PAGO_TPV = 7;
export const PAGO_PCI = 8;
export const PAGO_PASARELA = 9;

export const formasPago = [
  { value: null, display: 'Indefinido' },
  { value: 1, display: 'Efectivo' },
  { value: 2, display: 'Transferencia' },
  { value: 3, display: 'Recibo domiciliado' },
  { value: 4, display: 'Talón' },
  { value: 5, display: 'Pagaré' },
  { value: 6, display: 'Giro bancario' },
  { value: 7, display: 'TPV' },
  { value: 8, display: 'PCI' },
  { value: 9, display: 'Pasarela' },
];



// ---------------------------------------------------------------------------------------------------
//  Meta
// ---------------------------------------------------------------------------------------------------

/**
 * Prefijo para evitar que los nombres de los campos metadáticos creados por el usuario
 * coincidan con los campos del servicio.
 */
export const metaFieldPrefix = 'meta_';

/** Carácter de separación de campos usado para la definición de campos o al guardar sus valores. */
export const metaFieldSeparator = '#';

/** Constante con las estructuras metadáticas de las entidades. */
export const meta: any = {};

