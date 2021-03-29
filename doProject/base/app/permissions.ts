import { PermissionNode } from 'src/modules/roles';


export const permissions: (PermissionNode | string)[] = [
  {
    isFolder: true,
    name: 'menu',
    icon: 'menu',
    children: [
      'menu.gestion',
      'menu.administracion',
      'menu.configuracion',
    ],
  },
  {
    isFolder: true,
    name: 'home',
    icon: 'home',
    children: [
      'servicios.reservar',
      'servicios.taxiYa',
      'servicios.parada',
      'servicios.calle',
      'servicios.misServicios',
      'servicios.gestion',
    ],
  },
  {
    isFolder: true,
    name: 'menu.gestion',
    icon: 'document-text',
    children: [
      {
        isFolder: true,
        name: 'servicios.gestion',
        icon: 'document-text',
        children: [
          'servicios.get',
          'servicios.post',
          'servicios.put',
          'servicios.delete',
          'servicios.enviarOfertas',
          'servicios.aceptarOferta',
          'servicios.confirmar',
          'servicios.asignar',
          'servicios.desasignar',
          'servicios.aceptar',
          'servicios.rechazar',
          'servicios.cancelar',
          'servicios.esperando',
          'servicios.iniciar',
          'servicios.finalizar',
          'servicios.valorar',
          'servicios.cobrar',
          {
            name: 'servicios.pagar',
            children: [
              'payments.servicio.efectivo',
              'payments.servicio.tpv',
              'payments.servicio.stripe',
              'payments.servicio.visa',
              'payments.servicio.bizum',
              'payments.servicio.paypal',
            ],
          }
        ],
      },
      {
        isFolder: true,
        name: 'facturacion',
        icon: 'assets/icons/invoice.svg',
        children: [
          {
            isFolder: true,
            name: 'menu.facturacion',
            icon: 'assets/icons/invoice.svg',
            children: [
              'menu.facturasCliente',
              'menu.facturasProveedor',
              'menu.facturasConductor',
            ]
          },
          {
            isFolder: true,
            name: 'facturas',
            icon: 'assets/icons/invoice.svg',
            children: [
              'facturas.get',
              'facturas.post',
              'facturas.put',
              'facturas.delete',
              {
                name: 'facturas.print',
                icon: 'print',
                children: [
                  'facturas.print.facturaExcel',
                  'facturas.print.facturaPdf',
                  'facturas.print.list',
                  'facturas.print.ivaTrimestral',
                  'facturas.print.ivaAnual',
                  'facturas.print.irpf',
                ],
              },
              'facturas.generar',
              {
                name: 'facturas.edit',
                children: [
                  'facturas.edit.emision',
                  'facturas.edit.vencimiento',
                  'facturas.edit.iva',
                  'facturas.edit.irpf',
                  'facturas.edit.formaPago',
                ]
              }
            ],
          },
        ]
      },
      {
        isFolder: true,
        name: 'users',
        icon: 'assets/icons/avatar.svg',
        children: [
          'users.get',
          'users.post',
          'users.put',
          'users.delete',
        ],
      },
      {
        isFolder: true,
        name: 'abonados',
        icon: 'people',
        children: [
          'abonados.get',
          'abonados.post',
          'abonados.put',
          'abonados.delete',
        ],
      },
      {
        isFolder: true,
        name: 'conductores',
        icon: 'assets/icons/conductores.svg',
        children: [
          'conductores.get',
          'conductores.post',
          'conductores.put',
          'conductores.delete',
        ],
      },
      {
        isFolder: true,
        name: 'turnos',
        icon: 'time',
        children: [
          'turnos.get',
          'turnos.post',
          'turnos.put',
          'turnos.delete',
        ],
      },
      {
        isFolder: true,
        name: 'revisiones',
        icon: 'calendar',
        children: [
          'revisiones.get',
          'revisiones.post',
          'revisiones.put',
          'revisiones.delete',
        ],
      },
      {
        isFolder: true,
        name: 'callCenter',
        icon: 'call',
        children: [
          'callCenter.incoming',
          'callCenter.outgoing',
        ],
      },
    ],
  },
  {
    isFolder: true,
    name: 'menu.administracion',
    icon: 'assets/icons/administracion.svg',
    children: [
      {
        name: 'menu.clientes',
        icon: 'people',
        children: [
          'clientes.get',
          'clientes.post',
          'clientes.put',
          'clientes.delete',
        ],
      },
      {
        name: 'menu.proveedores',
        icon: 'assets/icons/conductores.svg',
        children: [
          'proveedores.get',
          'proveedores.post',
          'proveedores.put',
          'proveedores.delete',
        ],
      },
      {
        isFolder: true,
        name: 'vehiculos',
        icon: 'car-sport',
        children: [
          'vehiculos.get',
          'vehiculos.post',
          'vehiculos.put',
          'vehiculos.delete',
        ],
      },
      {
        isFolder: true,
        name: 'talonesPagares',
        icon: 'assets/icons/pagare.svg',
        children: [
          'talonesPagares.get',
          'talonesPagares.post',
          'talonesPagares.put',
          'talonesPagares.delete',
        ],
      }, {
        isFolder: true,
        name: 'cajaEfectivo',
        icon: 'assets/icons/caja.svg',
        children: [
          'cajaEfectivo.get',
          'cajaEfectivo.post',
          'cajaEfectivo.put',
          'cajaEfectivo.delete',
        ],
      }, {
        isFolder: true,
        name: 'bancos',
        icon: 'assets/icons/bank.svg',
        children: [
          'bancos.get',
          'bancos.post',
          'bancos.put',
          'bancos.delete',
        ],
      },
    ],
  },
  {
    isFolder: true,
    name: 'menu.configuracion',
    icon: 'settings',
    children: [
      {
        isFolder: true,
        name: 'roles',
        icon: 'people-circle',
        children: [
          'roles.get',
          'roles.post',
          'roles.put',
          'roles.delete',
        ],
      },
      {
        isFolder: true,
        name: 'festivos',
        icon: 'calendar-outline',
        children: [
          'festivos.get',
          'festivos.post',
          'festivos.put',
          'festivos.delete',
        ],
      },
      {
        isFolder: true,
        name: 'tarifasPrecios',
        icon: 'assets/icons/tarifas.svg',
        children: [
          'tarifasPrecios.get',
          'tarifasPrecios.post',
          'tarifasPrecios.put',
          'tarifasPrecios.delete',
        ],
      },
      {
        isFolder: true,
        name: 'bloqueoServicios',
        icon: 'assets/icons/bloqueos.svg',
        children: [
          'bloqueoServicios.get',
          'bloqueoServicios.put',
        ],
      },
      {
        name: 'callCenterConfig',
        icon: 'call'
      },
      {
        isFolder: true,
        name: 'poblaciones',
        icon: 'location',
        children: [
          'poblaciones.post',
          'poblaciones.put',
          'poblaciones.delete',
        ],
      }, {
        isFolder: true,
        name: 'paradas',
        icon: 'navigate',
        children: [
          'paradas.get',
          'paradas.post',
          'paradas.put',
          'paradas.delete',
        ],
      }, {
        name: 'configGoogleMaps',
        icon: 'earth',
      }, {
        name: 'booking',
        icon: 'assets/icons/booking.svg',
      }, {
        name: 'tracking',
        icon: 'assets/icons/tracking.svg',
      }, {
        isFolder: true,
        name: 'traducciones',
        icon: 'language',
        children: [
          'traducciones.get',
          'traducciones.post',
          'traducciones.put',
          'traducciones.delete',
        ],
      },
    ],
  },
];
