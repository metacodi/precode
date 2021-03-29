import { Component, ViewChild, NgZone, OnInit, Injector, AfterViewInit, ElementRef, OnDestroy, ViewChildren, QueryList } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { GoogleMap, MapInfoWindow, MapMarker } from '@angular/google-maps';
import { IonContent, ModalController, NavController } from '@ionic/angular';
import { Observable, of, Subscription, timer } from 'rxjs';
import { catchError, first, map, tap } from 'rxjs/operators';
import * as moment from 'moment';

import { AppConfig } from 'src/config';
import { AbstractComponent } from 'src/core/abstract';
import { AuthService } from 'src/core/auth';
import { ThemeService } from 'src/core/util';

import { UserService } from 'src/app/user';

import { MapsService } from './maps.service';
import { MapMarkerClass } from './map-marker.class';



export interface RouteType {
  /** Marco para encuadrar la ruta en el mapa. */
  bounds: google.maps.LatLngBounds | google.maps.LatLngBoundsLiteral;
  /** Sucesión de puntos del recorrido codificados a través de `google.maps.geometry.encoding`. */
  path: string;
  /** Duración en segundos. */
  duration?: number;
  /** Distancia en km */
  distance?: number;
}

@Component({
  selector: 'app-route-map',
  templateUrl: 'route-map.component.html',
  styleUrls: ['route-map.component.scss'],
})
export class RouteMapComponent extends AbstractComponent implements OnInit, OnDestroy, AfterViewInit {
  protected debug = true && AppConfig.debugEnabled;
  @ViewChild(IonContent, { static: false }) content: IonContent;
  /** Referencia a la instancia del mapa. */
  @ViewChild(GoogleMap, { static: false }) map: GoogleMap;
  /** Referencia a los marcadores que indican la recogida y el detino actual en el mapa. */
  @ViewChildren(MapMarker) markers: QueryList<MapMarker>;
  /** Wrappers de los marcadores de recogida y destino. */
  recogida: MapMarkerClass;
  destino: MapMarkerClass;
  /** Instancia del objeto encargado de dibujar la ruta en el mapa. */
  directionsRenderer: google.maps.DirectionsRenderer;
  /** Valor actual del componente. @see {@link https://developers.google.com/maps/documentation/javascript/directions Maps JavaScript API} */
  current: google.maps.DirectionsRequest | RouteType;
  /** Distancia en kilómetros de la ruta actual. */
  distance: number;
  /** Duración estimada en minutos de la ruta actual. */
  duration: number;
  /** Indicador de estado de carga de resultados */
  loading = false;
  /** Indicador de estado */
  initialized = false;
  /** Referencia a la libreira momentjs para el template */
  moment = moment;

  /** @hidden */
  maptypeidChangedSubscription: Subscription;
  /** @hidden */
  themeChangedSubscription: Subscription;

  constructor(
    public injector: Injector,
    public modal: ModalController,
    public user: UserService,
    public auth: AuthService,
    public zone: NgZone,
    public maps: MapsService,
    public theme: ThemeService,
    public nav: NavController,
    public http: HttpClient,
  ) {
    super(injector, undefined);
    if (this.debug) { console.log(this.constructor.name + '.constructor()'); }
    // Establecemos el idioma por defecto.
    moment.locale(this.translate.defaultLang);
    // moment.locale(this.user.language);
    // Nos suscribimos al notificador del servicio para recibir el valor de incialización del componente una única vez.
    this.maps.init.subscribe(data => {
      if (this.debug) { console.log(this.constructor.name + '.maps.init.subscribe(data) =>', data); }
      // Establecemos las opciones de inicialización igual como se haria durante la creación de un modal que hospedase el compoente.
      this.initializeRoute = data;
    });
    // Monitorizamos el cambio de tema.
    this.themeChangedSubscription = this.theme.changed.subscribe(() => this.maps.updateMapOptions(this.map));
  }

  ngOnInit() {
    super.ngOnInit();
  }

  ngOnDestroy() {
    super.ngOnDestroy();
    if (this.maptypeidChangedSubscription) { this.maptypeidChangedSubscription.unsubscribe(); }
    if (this.themeChangedSubscription) { this.themeChangedSubscription.unsubscribe(); }
    this.map.ngOnDestroy();
  }

  ngAfterViewInit() {
    if (this.debug) { console.log(this.constructor.name + '.ngAfterViewInit()', { map: this.map }); }
    if (!this.initialized) { this.initializeMap(); }
  }

  initializeMap() {
    if (this.debug) { console.log(this.constructor.name + '.initializeMap()'); }
    // Inicializamos los manejadores de marca para la recoigda y el destino.
    this.recogida = new MapMarkerClass('recogida', this.map, this.markers.first);
    this.destino = new MapMarkerClass('destino', this.map, this.markers.last);
    // Forzamos el redibujado del mapa.
    this.maps.initializeMap(this.map);
    // Refrescamos el tema cuando el tipo de mapa cambia.
    this.maptypeidChangedSubscription = this.map.maptypeidChanged.subscribe(() => { this.maps.updateMapOptions(this.map); });
    // Monitorizamos el cambio de tema.
    this.themeChangedSubscription = this.theme.changed.subscribe(() => { this.maps.updateMapOptions(this.map); this.updateMarkersTheme(); });
    // Creamos una única instancia del render para el recorrido y lo vinculamos con el mapa.
    this.directionsRenderer = new google.maps.DirectionsRenderer({ map: this.map.googleMap, suppressMarkers: true });
    // Establecemos el indicador de estado
    this.initialized = true;
    // Cargamos la ruta.
    this.route();
  }

  updateMarkersTheme(): void {
    this.recogida.icon = `assets/icons/${this.theme.mode}/recogida.svg`;
    this.destino.icon = { url: `assets/icons/${this.theme.mode}/destino.svg`,  anchor: new google.maps.Point(0, 32) };
  }

  route() {
    // Comprobamos si hay que consultar la ruta o solo renderizarla.
    if (this.current.hasOwnProperty('bounds') && this.current.hasOwnProperty('path')) {
      const request = this.current as RouteType;
          // Renderizamos la ruta.
      this.maps.renderRoute(this.map, this.recogida, this.destino, request);
      // Establecemos la duración y la distancia.
      this.duration = request.duration;
      this.distance = request.distance;

    } else {
      const request = this.current as google.maps.DirectionsRequest;
      // Establecemos el indicador de estado.
      this.loading = true;
      // Instanciamos el servicio de google.
      const directionsService = new google.maps.DirectionsService();
      // Una vez esté listo el mapa...
      this.map.idle.pipe(first()).subscribe({
        next: () => {
          // Consultamos al servicio para obtener la info de la ruta.
          directionsService.route({
            origin: request.origin,
            destination: request.destination,
            travelMode: request.travelMode || google.maps.TravelMode.DRIVING
          }, (response: any, status: any) => {
            if (this.debug) { console.log('directionsService -> response => ', response); }
            // Si se ha obtenido una respuesta correcta...
            if (status === 'OK' && response.routes && response.routes.length) {
              const route = response.routes[0];
              // Poisicionamos las marcas.
              this.recogida.location.current = this.maps.getLatLng(request.origin as google.maps.LatLng | google.maps.LatLngLiteral);
              this.destino.location.current = this.maps.getLatLng(request.destination as google.maps.LatLng | google.maps.LatLngLiteral);
              // NOTA: Los procedimientos manejados por GoogleMaps son asíncronos y están fuera de zona angular.
              // Delegamos la ejecución a través de `zone.run()` hasta que angular esté listo para reflejar los cambios en el template.
              this.zone.run(() => {
                // Calculamos la distancia.
                this.distance = this.maps.computeTotalDistance(route);
                if (this.debug) { console.log('directionsService -> distance => ', this.distance); }
              });
              // Establecemos la info de la ruta en el render para que la dibuje.
              this.directionsRenderer.setDirections(response);
              // Obtenemos la info estimada de tiempo.
              this.maps.requestDistance(request.origin, request.destination).then(value => {
                // { distance: 4.2 [km], duration: 904 [s] }
                if (value) { this.zone.run(() => { this.duration = value.duration; this.distance = value.distance; }); }
              });

            } else {
              // this.showError({ message: 'maps.genericError', error: { status, response } });
            }
          });
        }, complete: (() => this.loading = false),
      });
    }
  }


  /** Indica la ruta para mostrar en el mapa al iniciar. */
  set initializeRoute(current: google.maps.DirectionsRequest | RouteType) {
    if (this.debug) { console.log(this.constructor.name + '.initializeRoute = current', current); }
    // Establecemos la dirección actual.
    this.current = current;
  }

  /** Función equivalente a la de un modal para cerrarlo y devolver el valor seleccionado. */
  dismiss(value?: any) {
    // Construimos una respuesta como la que devolvería un modal.
    const detail = value ? { data: value } : null;
    // Notificamos la respuesta.
    this.maps.dismiss.next(detail);
    // Navegamos hacia atrás para simular el cierre del modal.
    this.nav.pop();
  }

}
