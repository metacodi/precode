import { Injectable, Injector, OnDestroy } from '@angular/core';
import { NavController } from '@ionic/angular';
import { GoogleMap } from '@angular/google-maps';
import { Observable, Subject, BehaviorSubject, of, timer, Subscription } from 'rxjs';
import { catchError, first } from 'rxjs/operators';

import { AppConfig } from 'src/config';
import { AbstractModelService } from 'src/core/abstract';
import { ApiService, BlobService } from 'src/core/api';
import { resolveComponentFactory, deepAssign, ThemeMode } from 'src/core/util';

import { darkStyle } from './styles/dark-style';
import { RouteType } from './route-map.component';
import { MapMarkerClass } from './map-marker.class';


/** Provee de servicios al componente `PickMapComponent` que se presenta como un modal con un mapa de google-maps como contenido principal. */
@Injectable({
  providedIn: 'root'
})
export class MapsService extends AbstractModelService implements OnDestroy {
  protected debug = true && AppConfig.debugEnabled;

  /** Notifica el valor de inicialización para el componente del mapa. */
  init: BehaviorSubject<any> = new BehaviorSubject<any>(null);
  /** Notifica el último valor seleccionado en el mapa. */
  dismiss: Subject<any> = new Subject<any>();
  /** Opciones iniciales */
  mapsSettings: {
    defaultLocation: google.maps.LatLngLiteral,
    defaultBounds: google.maps.LatLngBoundsLiteral,
    searchDebounce: number,
    options: google.maps.MapOptions,
    themes: { name: string, mode: ThemeMode[], styles: google.maps.MapTypeStyle[] }
  };
  /** Estilos por defecto para el mapa. */
  styles = [ darkStyle ];

  constructor(
    public injector: Injector,
    public api: ApiService,
    public nav: NavController,
    public blob: BlobService,
  ) {
    super(injector, api);

    this.blob.get('mapsSettings').then(behavior => this.subscriptions.push(behavior.subscribe(settings => this.mapsSettings = settings)));
  }

  ngOnDestroy() {
    super.ngOnDestroy();
  }


  // ---------------------------------------------------------------------------------------------------
  //  initialize map
  // ---------------------------------------------------------------------------------------------------

  /** Fuerza el redibujado del mapa. */
  initializeMap(map: GoogleMap, location?: google.maps.LatLng) {
    if (this.debug) { console.log(this.constructor.name + '.initializeMap()'); }
    const container: any = map.googleMap.getDiv();
    if (container) {
      container.style.height = '0%';
      container.style.width = '0%';
      timer().subscribe(() => {
        container.style.height = '100%';
        container.style.width = '100%';
      });
    }
    // Inicializamos las opciones del mapa.
    map.options = deepAssign({}, this.mapsSettings.options);
    // Actualiza las opciones del mapa según la configuración del usuario.
    this.updateMapOptions(map, location || new google.maps.LatLng(this.mapsSettings?.defaultLocation || AppConfig.google.maps.defaultLocation));
  }

  /**
   * Map options:
   * {@link https://developers.google.com/maps/documentation/javascript/reference/map#MapOptions MapOptions}
   *
   * Styles: costumización del mapa.
   * {@link https://developers.google.com/maps/documentation/javascript/style-reference#style-features Style features},
   * {@link https://mapstyle.withgoogle.com/ Map style}
   */
  updateMapOptions(map: GoogleMap, location?: google.maps.LatLng): void {

    if (!map) { return; }

    const options = {
      // mapTypeControl: true,
      // mapTypeId: google.maps.MapTypeId.ROADMAP,
      disableDefaultUI: true,
      styles: this.defaultMapStyles(map),
    };
    deepAssign(options, { center: location || map.getCenter(), zoom: map.getZoom() || 9 });

    map.options = options;
  }

  defaultMapStyles(map: GoogleMap): google.maps.MapTypeStyle[] {
    const styles: google.maps.MapTypeStyle[] = []; this.mapsSettings.options.styles.map(s => styles.push(s));
    if (this.theme.mode === 'dark' && map.getMapTypeId() === google.maps.MapTypeId.ROADMAP) { styles.push(...darkStyle); }
    return styles;
  }


  // ---------------------------------------------------------------------------------------------------
  //  recorrido
  // ---------------------------------------------------------------------------------------------------

  /** Presenta el modal con un mapa trazando la ruta indicada */
  recorrido(routeComponent: any, data: google.maps.DirectionsRequest | RouteType): Promise<any> {
    if (!data) { throw new Error('Missing argument "route"'); }

    if (this.debug) { console.log('MapsService.route(data) => ', data); }
    return new Promise<any>((resolve, reject) => {
      // this.resolveFactory('app/maps/route-map.component').then(component => {
      this.resolveFactory(routeComponent).then(component => {
        this.modal.create({
          component,
          componentProps: { initializeRoute: data },
        }).then(modal => {
          modal.onDidDismiss().then(() => resolve(true)).catch(error => reject(error));
          modal.present();
        }).catch(error => reject(error));
      }).catch(error => reject(error));
    });
  }

  renderRoute(map: GoogleMap, recogida: MapMarkerClass, destino: MapMarkerClass, route: RouteType, options?: { strokeColor?: string, strokeOpacity?: number, strokeWeight?: number }): void {
    const bounds = this.getBounds(route.bounds);
    const path = google.maps.geometry.encoding.decodePath(route.path);
    if (!options) { options = {}; }
    map.idle.pipe(first()).subscribe(() => {
      // Establecemos la posición sin centrar el punto en el mapa.
      recogida.location.current = path[0];
      destino.location.current = path[path.length - 1];
      // Dibujamos la ruta.
      const line = new google.maps.Polyline({
        map: map.googleMap,
        path,
        editable: false, draggable: false, clickable: false,
        strokeColor: options.strokeColor || '#0066ff',
        strokeOpacity: options.strokeOpacity || 0.5,
        strokeWeight: options.strokeWeight || 5,
      });
      map.fitBounds(bounds);
    });
  }

  getLatLng(location: google.maps.LatLng | google.maps.LatLngLiteral): google.maps.LatLng {
    if (location instanceof google.maps.LatLng) { return location; }
    const lat = typeof location.lat === 'function' ? (location as any).lat() : +location.lat;
    const lng = typeof location.lng === 'function' ? (location as any).lng() : +location.lng;
    return new google.maps.LatLng(lat, lng);
  }

  getBounds(bounds: google.maps.LatLngBounds | google.maps.LatLngBoundsLiteral): google.maps.LatLngBounds {
    return bounds instanceof google.maps.LatLngBounds ? bounds
      : new google.maps.LatLngBounds(new google.maps.LatLng(bounds.south, bounds.west), new google.maps.LatLng(bounds.north, bounds.east));
  }

  requestDistance(origin: string | google.maps.LatLng | google.maps.LatLngLiteral | google.maps.Place | google.maps.LatLngLiteral, destination: string | google.maps.LatLng | google.maps.LatLngLiteral | google.maps.Place): Promise<{ duration: number, distance: number }> {
    return new Promise<{ duration: number, distance: number }>((resolve: any, reject: any) => {
      // Obtenemos la info estimada de tiempo.
      this.distanceMatrix(this.pointToString(origin), this.pointToString(destination)).subscribe(results => {
        if (this.debug) { console.log('distanceMatrix -> results => ', results); }
        // { distance: 4.2 [km], duration: 904 [s] }
        const value = this.parseDistanceMatrixResults(results);
        if (value) { resolve({ duration: +value.duration, distance: +value.distance / 1000.0 }); } else { resolve(); }
      });
    });
  }

  pointToString(point: string | google.maps.LatLng | google.maps.LatLngLiteral | google.maps.Place): string {
    if (!point) { return ''; }
    if (typeof point === 'string') { return point; }
    if (point.hasOwnProperty('location')) { point = (point as google.maps.Place).location; }
    const location = point.hasOwnProperty('location') ? (point as google.maps.Place).location : point as google.maps.LatLng | google.maps.LatLngLiteral;
    const lat = typeof location.lat === 'function' ? location.lat() : location.lat;
    const lng = typeof location.lng === 'function' ? location.lng() : location.lng;
    return `${lat},${lng}`;
  }

  pointToLatLngLiteral(point: string | google.maps.LatLng | google.maps.LatLngLiteral | google.maps.Place): google.maps.LatLngLiteral {
    if (!point) { return undefined; }
    if (typeof point === 'string') { return { lat: +point.split(',')[0], lng: +point.split(',')[1] }; }
    if (typeof (point as any).lat === 'number') { return point as google.maps.LatLngLiteral; }
    if (point.hasOwnProperty('location')) { point = (point as google.maps.Place).location; }
    const location = point.hasOwnProperty('location') ? (point as google.maps.Place).location : point as google.maps.LatLng | google.maps.LatLngLiteral;
    const lat = typeof location.lat === 'function' ? location.lat() : location.lat;
    const lng = typeof location.lng === 'function' ? location.lng() : location.lng;
    return { lat, lng };
  }

  toLatLngLiteral(point: string | google.maps.LatLng | google.maps.LatLngLiteral | google.maps.Place): google.maps.LatLngLiteral {
    if (!point) { return undefined; }
    if (typeof point === 'string') { return { lat: +point.split(',')[0], lng: +point.split(',')[1] }; }
    if (typeof (point as any).lat === 'number') { return { lat: (point as any).lat, lng: (point as any).lng }; }
    if (typeof (point as any).lat === 'function') { return { lat: (point as any).lat(), lng: (point as any).lng() }; }
    if (point.hasOwnProperty('location')) { point = (point as google.maps.Place).location; }
    const location = point.hasOwnProperty('location') ? (point as google.maps.Place).location : point as google.maps.LatLng | google.maps.LatLngLiteral;
    const lat = typeof location.lat === 'function' ? location.lat() : location.lat;
    const lng = typeof location.lng === 'function' ? location.lng() : location.lng;
    return { lat, lng };
  }

  parseDistanceMatrixResults(results: any): any {
    // Ejemplo de resultado
    const example = {
      destination_addresses: ['Passeig de la Reina Elisenda de Montcada, 13, 08034 Barcelona, Espanya'],
      origin_addresses: ['Pl dels Països Catalans - Estació de Sants, 08014 Barcelona, Espanya'],
      rows: [{
        elements: [{
          distance: {
            text: '4,8 km',
            value: 4792
          },
          duration: {
            text: '15 minuts',
            value: 907
          },
          status: 'OK'
        }]
      }],
      status: 'OK'
    };
    // Extraemos la distancia y la duración.
    if (!!results && results.rows && results.rows.length) {
      const result = results.rows[0];
      if (result.elements && result.elements.length) {
        const element = result.elements[0];
        if (element.status === 'OK' && element.distance && element.duration) {
          return {
            distance: element.distance.value,
            duration: element.duration.value,
          };
        }
      }
    }
    return undefined;
  }

  computeTotalDistance(route: any): number {
    let total = 0;
    if (route.legs && route.legs.length) {
      for (const leg of route.legs) { total += leg.distance.value; }
      total = total / 1000;
    }
    return total;
  }


  // ---------------------------------------------------------------------------------------------------
  //  pick
  // ---------------------------------------------------------------------------------------------------

  /** Navega hacia el componente PickMapComponent y devuelve la dirección seleccionada. */
  async pick(options?: { current?: any, readOnly?: boolean, title?: string }): Promise<any> {
    if (!options) { options = {}; }
    // if (options.current === undefined) { options.current = {}; }
    if (options.readOnly === undefined) { options.readOnly = false; }
    if (this.debug) { console.log(this.constructor.name + '.pick() => ', options); }

    return new Promise<any>((resolve, reject) => {
      // Establecemos las opciones de inicialización.
      this.init.next(options);
      // Nos suscribimos al Subject para recibir el valor seleccionado en el mapa una única vez.
      this.dismiss.asObservable().pipe(first()).subscribe(detail => {
        // Recuperamos el valor seleccionado en el mapa.
        if (detail && detail.data) {
          resolve(detail.data);
        } else {
          reject(false);
        }
      });
      // Navegamos hacia el mapa.
      this.router.navigate(['pick-map']);
    });
  }


  // ---------------------------------------------------------------------------------------------------
  //  sanitize . prefix . parse
  // ---------------------------------------------------------------------------------------------------

  /** Filtra las propiedades que son exclusivas de la dirección. Elimina propiedades como 'distancia' que puedan llegar de backend o estar presentes en la fila. */
  parseDireccion(row: any): any {
    const properties: string[] = ['descripcion', 'direccion', 'idUbicacion', 'idDireccion', 'observaciones', 'ubicacion'];
    row = Object.keys(row).filter(prop => properties.indexOf(prop) > -1).reduce((o, prop) => (o[prop] = row[prop], o), {});
    const propertiesUbicacion: string[] = ['descripcion', 'direccion', 'codigoPostal', 'idPoblacion', 'lat', 'lng', 'poblacion', 'infraestructura', 'parada'];
    row.ubicacion = Object.keys(row.ubicacion).filter(prop => propertiesUbicacion.indexOf(prop) > -1).reduce((o, prop) => (o[prop] = row.ubicacion[prop], o), {});
    return row;
  }

  /** Mapea la dirección indicada añadiendo el prefijo. */
  prefixDireccion(direccion: any, prefix?: string): any {
    const result: any = {};
    Object.keys(direccion).map((sanitized: string) => {
      result[this.prefixedProperty(sanitized, prefix)] = direccion[sanitized];
    });
    return result;
  }

  /** Quita prefijos de la dirección indicada. */
  sanitizeDireccion(direccion: any, prefix?: string): any {
    const result: any = {};
    Object.keys(direccion).map((prefixed: string) => {
      result[this.sanitizedProperty(prefixed, prefix)] = direccion[prefixed];
    });
    return result;
  }

  /** Devuelve la propiedad con el prefijo. */
  prefixedProperty(prop: string, prefix?: string): string {
    return prefix ? prefix + prop.charAt(0).toUpperCase() + prop.slice(1) : prop;
  }

  /** Devuelve la propiedad sin el prefijo. */
  sanitizedProperty(prop: string, prefix?: string): string {
    if (prefix && prop.startsWith(prefix)) { prop = prop.slice(prefix.length); }
    return prefix ? prop.charAt(0).toLowerCase() + prop.slice(1) : prop;
  }


  // ---------------------------------------------------------------------------------------------------
  //  geocode services
  // ---------------------------------------------------------------------------------------------------

  /** Obtenemos las direcciones propuestas al hacer click sobre el mapa. */
  geocodeCoordinates(location: any): Observable<any> {
    return this.api.post('maps.geocodeCoordinates', { location }, { showLoader: false }).pipe(
      catchError(error => this.alertError({ error }))
    );
  }

  /** Obtenemos las direcciones propuestas al escribir un texto en el cuadro de búsqueda. */
  geocodeAddress(query: any): Observable<any> {
    return this.api.post('maps.geocodeAddress', { query }, { showLoader: false }).pipe(
      catchError(error => this.alertError({ error }))
    );
  }

  /** Obtenemos las direcciones propuestas al escribir un texto en el cuadro de búsqueda. */
  geocodePlace(placeId: string): Observable<any> {
    return this.api.post('maps.geocodePlace', { placeId }, { showLoader: false }).pipe(
      catchError(error => this.alertError({ error }))
    );
  }

  /** Obtenemos las sugerencias a partir del texto escrito. */
  autocomplete(input: string): Observable<any> {
    if (!input) { return of([]); }
    return this.api.post('maps.autocomplete', { input }, { showLoader: false }).pipe(
      catchError(error => this.alertError({ error }))
    );
  }

  /**
   * Proxy para acceder a los servicios de GoogleMaps.
   * Calcula la distancia y el tiempo estimado de la ruta.
   *
   * @param origins Punto de partida de la ruta.
   * @param destinations Punto de llegada de la ruta.
   */
  distanceMatrix(origins: any, destinations: any): Observable<any> {
    return new Observable<any>(observer => {
      // Obtenemos la descripción de la ubicación.
      this.api.post('maps.distanceMatrix', { origins, destinations }, { showLoader: false }).subscribe(results => {
        // Comprobamos si se ha obtenido una dirección válida.
        if (this.debug) { console.log('distanceMatrix => ', results); }
        // if (results && results.length) {
        if (results) {
          observer.next(results);

        } else {
          observer.next(null);
        }
      }, error => {
        observer.next(null);
      });
    });
  }


  // ---------------------------------------------------------------------------------------------------
  //  alertError
  // ---------------------------------------------------------------------------------------------------

  alertError(options?: { header?: string, message?: string, interpolateParams?: any, error?: any, emitError?: boolean, synchronously?: boolean }): Observable<any> {
    if (!options) { options = {}; }
    if (options.message === undefined) { options.message = 'maps.genericError'; }
    return super.alertError(options);
  }


  // ---------------------------------------------------------------------------------------------------
  //  resolvers
  // ---------------------------------------------------------------------------------------------------

  /**
   * Returns the definition of the component so that the injector can instantiate it.
   * @param component: the selector of the component.
   * @category Resolvers
   */
  protected resolveFactory(component: any, options?: { componentName?: string }): Promise<any> { return resolveComponentFactory(component, options); }

}
