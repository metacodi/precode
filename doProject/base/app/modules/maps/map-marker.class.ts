import { GoogleMap, MapMarker } from '@angular/google-maps';

import { deepAssign } from 'src/core/util';


export class MapMarkerClass {
  /** Referencia a la instancia del componente de angular que encapsula el mapa. */
  map: GoogleMap;
  /** Referencia a la instancia del componente de angular que encapsula la marca. */
  marker: MapMarker;
  /** Opciones actuales de la marca. NOTA: Se necesitan para el componente de angular, ya que la marca no devuelve la configuración actual. */
  markerOptions: google.maps.MarkerOptions;
  /** La posición de la marca actual y anterior. */
  location: { current: google.maps.LatLng, previous: google.maps.LatLng };
  /** Fuente de la selección de la ubicación: 'Mis direccioens', infraestructuras, etc.  */
  seleccion: { current: number, previous: number, idMiDireccion: number };
  /** Indica si se está editando el texto de la dirección. Se establece en `true` cuando el input obtiene el foco. */
  edit: boolean;
  /** Nombre asignado a la marca. */
  name: string;
  /** Inidica si al establecer la posición, el mapa se centra sobre la marca automáticamente. @default `true` */
  autoPan = true;


  constructor(name: string, map: GoogleMap, marker: MapMarker, options?: google.maps.MarkerOptions, init?: google.maps.LatLng) {
    // Le asignamos un nombre a la marca.
    this.name = name;
    // Refrenciamos la instancia del componente del mapa.
    this.map = map;
    // Refrenciamos la instancia de la marca.
    this.marker = marker;

    // Inicializamos las variables de estado.
    this.seleccion = { current: undefined, previous: undefined, idMiDireccion: undefined };
    this.location = { current: init || undefined, previous: init || undefined };
    this.edit = false;

    // Opciones de la marca.
    if (!options) { options = {}; }

    // Referencia al la instancia del mapa.
    options.map = this.map.googleMap;

    // Icono de la marca.
    if (options.icon) {
      options.icon = this.setIcon(options.icon);
      options.optimized = false;
    }

    // Establecemos las opciones de la marca.
    this.marker.options = options;
    // Recordamos las opciones para el componente de angular en el template.
    this.markerOptions = options;
  }

  protected setIcon(data: string | google.maps.Icon | google.maps.Symbol): string | google.maps.Icon | google.maps.Symbol {
    if (typeof data === 'string') {
      const icon: google.maps.Icon = {
        url: data,
        scaledSize: new google.maps.Size(32, 32),
        origin: new google.maps.Point(0, 0),
        anchor: new google.maps.Point(16, 32),
      };
      return icon;

    } else if (data?.hasOwnProperty('url')) {
      const icon = data as google.maps.Icon;
      icon.scaledSize = icon.scaledSize || new google.maps.Size(32, 32);
      icon.origin = icon.origin || new google.maps.Point(0, 0);
      icon.anchor = icon.anchor || new google.maps.Point(16, 32);
      return icon;

    } else if (data?.hasOwnProperty('path')) {
      const icon = data as google.maps.Symbol;
      icon.anchor = icon.anchor || new google.maps.Point(16, 32);
      return icon;
    }
  }

  /**
   * If `true`, the marker is visible. @default `true`
   * @see {@link https://developers.google.com/maps/documentation/javascript/reference/marker#MarkerOptions.visible Maps JavaScript API}
   */
  get visible(): boolean { return this.marker.getVisible(); }
  set visible(value: boolean) { this.options = { visible: value }; }

  /** Obtiene o establece le icono de la marca. */
  get icon(): string | google.maps.Icon | google.maps.Symbol { return this.markerOptions.icon; }
  set icon(icon: string | google.maps.Icon | google.maps.Symbol) { this.marker.options = deepAssign(this.markerOptions, { icon: this.setIcon(icon) }); }

  /** Obtiene o establece las opciones actuales de la marca. */
  get options(): google.maps.MarkerOptions { return this.markerOptions; }
  set options(options: google.maps.MarkerOptions) { this.marker.options = deepAssign(this.markerOptions, options); }

  /** Obtiene la posición actual de la marca. */
  get position(): google.maps.LatLng { return this.location.current; }
  /** Establece la posición actual de la marca. */
  set position(position: google.maps.LatLng) { this.location.current = position; this.refresh(); }
  /** Acepta la posición actual como definitiva. */
  accept() { this.location.previous = this.location.current; }
  /** Revierte la posición actual a su estado anterior. */
  cancel() { this.location.current = this.location.previous; this.refresh(); }
  /** Refresca la marca en el mapa. */
  refresh() {
    const position = this.location.current;
    if (position) {
      this.marker.position = position;
      this.visible = true;
      if (this.autoPan) { this.map.panTo(position); }
    } else {
      this.visible = false;
    }
  }
  /** Establece los valores iniciales. */
  reset(position: google.maps.LatLng, seleccion?: number) {
    // Establecemos la posición inicial.
    this.location.current = position; this.location.previous = position;
    // Establecemos la selección inicial.
    this.seleccion.current = seleccion || undefined; this.seleccion.previous = seleccion || undefined;
  }
}
