import { Component, ViewChild, ElementRef, NgZone, OnInit, Injector, OnChanges, AfterViewInit, AfterViewChecked, AfterContentChecked, AfterContentInit, OnDestroy } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { GoogleMap, MapInfoWindow, MapMarker } from '@angular/google-maps';
import { ModalController, NavController, IonContent, ActionSheetController, IonSearchbar } from '@ionic/angular';
import { GeolocationPosition } from '@capacitor/core';
import { Subscription, timer } from 'rxjs';

import { AppConfig } from 'src/config';
import { AbstractComponent } from 'src/core/abstract';
import { ApiService, BlobService, findRowIndex } from 'src/core/api';
import { GeolocationPlugin } from 'src/core/native';
import { ThemeService } from 'src/core/util';

import { UBICACION_MAPA } from 'src/app/model';

import { MapsService } from './maps.service';
import { MapMarkerClass } from './map-marker.class';


/**
 * {@link https://github.com/angular/components/blob/master/src/google-maps/README.md @angular/google-maps}
 */
@Component({
  selector: 'app-pick-map',
  templateUrl: 'pick-map.component.html',
  styleUrls: ['pick-map.component.scss'],
})
export class PickMapComponent extends AbstractComponent implements OnInit, OnDestroy, AfterViewInit {
  protected debug = true && AppConfig.debugEnabled;

  @ViewChild(IonContent, { static: false }) content: IonContent;
  /** Referenciamos el input de búsqueda. */
  @ViewChild(IonSearchbar, { static: false }) searchbar: IonSearchbar;
  /** Referencia a la instancia del mapa. */
  @ViewChild(GoogleMap, { static: false }) map: GoogleMap;
  /** Referencia al marcador que indica la dirección actual en el mapa. */
  @ViewChild(MapMarker, { static: false }) mapMarker: MapMarker;
  /** Referencia al manejador de la marca. */
  marker: MapMarkerClass;
  /** Default bounds. */
  bounds: google.maps.LatLngBounds;
  /** Indicador de estado */
  initialized = false;
  /** Indica si el usuario puede modificar la dirección inicial. */
  readOnly = false;
  /** Indicador de estado de carga de resultados. */
  loading = false;
  /** Colecciona los resultados de google de una búsqueda por clic. */
  clickResults: any;
  /** Colecciona los resultados de google de una búsqueda por texto. */
  searchResults: any[] = [];
  /** Texto escrito en la barra de búsqueda. */
  match: string;
  /** @hidden */
  maptypeidChangedSubscription: Subscription;
  /** @hidden */
  themeChangedSubscription: Subscription;

  /** Título de la ventana cuando no hay descripción para la dirección. */
  title: string;
  /** Valor actual del componente. */
  current: any;
  /** Mostra el formulari de fitxa. */
  get formAvailable(): boolean { return this.current && !this.searchResults.length; }
  /** Formulario de ficha. */
  frm = new FormGroup({ descripcion: new FormControl(null), direccion: new FormControl(null, Validators.required) });
  /** @hidden */
  formChangesSubscription: Subscription;

  constructor(
    public injector: Injector,
    public nav: NavController,
    // public modal: ModalController,
    public api: ApiService,
    // public translate: TranslateService,
    public zone: NgZone,
    public maps: MapsService,
    public theme: ThemeService,
    public geolocation: GeolocationPlugin,
    public blob: BlobService,
    public action: ActionSheetController,
  ) {
    super(injector, undefined);
    if (this.debug) { console.log(this.constructor.name + '.constructor()'); }
    // Nos suscribimos al notificador del servicio para recibir el valor de incialización del componente una única vez.
    this.maps.init.subscribe(data => {
      if (this.debug) { console.log(this.constructor.name + '.maps.init.subscribe(data) =>', data); }
      // Establecemos las opciones de inicialización igual como se haria durante la creación de un modal que hospedase el compoente.
      this.initializeDireccion = data;
    });
  }

  ngOnInit() {
    super.ngOnInit();
    if (!this.formChangesSubscription) { this.formChangesSubscription = this.frm.valueChanges.subscribe(value => Object.assign(this.current || {}, value)); }
  }

  ngOnDestroy() {
    if (this.formChangesSubscription) { this.formChangesSubscription.unsubscribe(); }
    if (this.maptypeidChangedSubscription) { this.maptypeidChangedSubscription.unsubscribe(); }
    if (this.themeChangedSubscription) { this.themeChangedSubscription.unsubscribe(); }
    this.map.ngOnDestroy();
    super.ngOnDestroy();
  }

  ngAfterViewInit() {
    if (this.debug) { console.log(this.constructor.name + '.ngAfterViewInit()', { map: this.map }); }
    if (!this.initialized) { this.initializeMap(); }
  }

  initializeMap() {
    if (this.debug) { console.log(this.constructor.name + '.initializeMap()'); }
    // Obtenemos la posición de la dirección actual.
    const position = this.current?.ubicacion ? new google.maps.LatLng(+this.current.ubicacion.lat, +this.current.ubicacion.lng) : undefined;
    // Instanciamos un manejador de marca.
    this.marker = new MapMarkerClass('marker', this.map, this.mapMarker, { map: this.map.googleMap }, position);
    // Forzamos el redibujado del mapa.
    this.maps.initializeMap(this.map, position);
    // Mostramos la marca en el mapa.
    if (position) { this.marker.refresh(); }
    // Refrescamos el tema cuando el tipo de mapa cambia.
    this.maptypeidChangedSubscription = this.map.maptypeidChanged.subscribe(() => this.maps.updateMapOptions(this.map));
    // Monitorizamos el cambio de tema.
    this.themeChangedSubscription = this.theme.changed.subscribe(() => { this.maps.updateMapOptions(this.map); });
    // Establecemos el indicador de estado
    this.initialized = true;
  }

  /** Indica la ubicación para mostrar en el mapa al iniciar. */
  set initializeDireccion(options: { current?: any, readOnly?: boolean, title?: string }) {
    if (this.debug) { console.log(this.constructor.name + '.initializeDireccion()', options); }
    if (options) {
      // Establecemos el título de la ventana para cuando no haya descripción para la dirección.
      this.title = options.title;
      // Establecemos la dirección actual.
      if (options.current) { this.setAddress(options.current); }
      // Establecemos el idicador de estado.
      this.readOnly = options.readOnly;
    }
  }

  /** Devuelve la ubicación actual en forma de object literal { lat, lng }. */
  get currentLocation(): google.maps.LatLng {
    if (this.current && this.current.ubicacion?.lat && this.current.ubicacion?.lng) {
      return new google.maps.LatLng(+this.current.ubicacion.lat, +this.current.ubicacion.lng);
    } else {
      const location = AppConfig.google.maps.defaultLocation;
      return new google.maps.LatLng(+location.lat, +location.lng);
    }
  }
  /** Template property: indica si la dirección actual és valida como ubicación. */
  get invalid(): boolean {
    if (!!this.current && !!this.current.ubicacion?.lat && !!this.current.ubicacion?.lng && !!this.current.ubicacion?.direccion) { return false; }
    return true;
  }

  /** Establece la dirección actual y el valor en el formulario. */
  setAddress(address: any) {
    return new Promise<boolean>((resolve: any, reject: any) => {
      // Planchamos el valor de la ubicación.
      if (!address.descripcion) { address.descripcion = address.ubicacion?.descripcion; }
      if (!address.direccion) { address.direccion = address.ubicacion?.direccion; }
      // Filtramos las propiedades válidas de la dirección.
      address = this.maps.parseDireccion(address);
      // Actualizamos el template en zona, ya que la asignación de address puede producirse desde eventos de Google Maps que están fuera de zona.
      this.zone.run(() => { this.match = address.direccion || address.ubicacion.direccion; });
      // Establecemos la ubicación actual de la dirección obtenida.
      if (this.marker) { this.marker.position = new google.maps.LatLng(+address.ubicacion.lat, +address.ubicacion.lng); }
      // Establecemos la dirección.
      this.current = address;
      // Establecemos la dirección en el formulario.
      this.frm.reset({
        descripcion: address?.descripcion || null,
        direccion: address?.direccion || null,
      }, { emitEvent: false });
      // Limpiamos los resultados de la búsqueda.
      this.searchResults = []; this.clickResults = undefined;
      // Aceptamos la ubicación actual y terminamos la edición.
      if (this.marker) { this.marker.accept(); this.marker.edit = false; }
      resolve(true);
    });
  }

  get isDireccionModfied(): boolean {
    if (!this.current) { return false; }
    if (!this.frm.value.direccion || !this.current.ubicacion?.direccion) { return false; }
    return this.frm.value.direccion !== this.current.ubicacion?.direccion;
  }

  get isDescripcionModfied(): boolean {
    if (!this.current) { return false; }
    if (!this.frm.value.descripcion || !this.current.ubicacion?.descripcion) { return false; }
    return this.frm.value.descripcion !== this.current.ubicacion?.descripcion;
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

  onSearchFocus(ev: any) {
    if (this.debug) { console.log(this.constructor.name + '.onSearchFocus(ev) => ', { edit: this.marker?.edit, ev }); }
    // Seleccionamos el texto del control.
    this.searchbar.getInputElement().then((el: HTMLInputElement) => el.select());
  }

  onSearchInput(ev: any) {
    if (this.debug) { console.log(this.constructor.name + '.onInput(ev) => ', { edit: this.marker?.edit, ev }); }
    // Permutamos el modo de edición.
    this.marker.edit = true;
  }

  /** Ocurre al escribir en el cuadro de búsqueda. */
  onSearchChanged(ev: any) {
    if (this.debug) { console.log(this.constructor.name + '.onSearchChanged(ev) => ', this.match); }
    // Sólo consultamos si la marca está en edición.
    if (this.marker?.edit) {
      // Inicializamos la colección.
      this.searchResults = []; this.clickResults = undefined;
      // Establecemos el indicador de estado.
      this.loading = true;
      // Si no hay ningún resultado desposicionamos la marca.
      this.marker.position = undefined;
      // // Eliminamos la dirección.
      // this.frm.reset({ direccion: null });
      // Obtenemos la descripción de la ubicación.
      this.maps.autocomplete(this.match).subscribe({
        next: results => {
          if (results.length === 0) {
            // Si no hay ningún resultado no hacemos nada.
            this.loading = false;

          } else if (results.length === 1) {
            // Si solo hay un resultado lo seleccionamos automáticamente.
            this.onSearchResultSelected(results[0]);

          } else {
            // Mostramos los resultados para que el usuario seleccione uno.
            this.searchResults = results;
            this.content.scrollToTop();
            this.loading = false;
          }
        }, error: () => this.loading = false
      });
    }
  }

  /** Ocurre al pulsar enter en el cuadro de búsqueda. */
  onSearchSubmit() {
    if (this.debug) { console.log(this.constructor.name + '.onSearchSubmit()'); }
    // Si solo hay un resultado.
    if (this.searchResults.length === 1) {
      // Hacemos clic automáticamente para ocultar el teclado en el móbil e ir a los resultados en un solo paso.
      // const row = this.searchResults[0];
      // this.onMapClick([{ lat: row.lat, lng: row.lng }]);
      this.onSearchResultSelected(this.searchResults[0]);
    }
  }

  /** Ocurre cuando se hace clic sobre uno de los resultados de búsqueda. */
  onSearchResultSelected(direccion: any) {
    // Limpiamos los resultados de la búsqueda.
    this.searchResults = []; this.clickResults = undefined;
    // Establecemos el indicador de estado.
    this.loading = true;
    // Obtenemos la dirección seleccionada.
    this.maps.geocodeAddress(direccion).subscribe({
      next: results => {
        if (results.zona) {
          this.mostrarParadas(results.zona.seleccion, results.zona).catch(() => this.cancelSearchSelection());

        } else if (results.address) {
          // Establecemos la dirección obtenida.
          this.setAddress(results.address).then(result => {}).catch(() => this.cancelSearchSelection());

        } else {
          this.cancelSearchSelection();
        }

      }, complete: () => this.loading = false
    });
  }

  cancelSearchSelection() {
    // Antes de restablecer la dirección cancelamos la edición para que no piense que estamos escribiendo texto.
    this.marker.edit = false;
    // Establecer la dirección seleccionada.
    this.frm.patchValue({ direccion: this.current?.ubicacion?.direccion });
  }

  /** Ocurre cuando se desliza alguno de los resultados de búsqueda. */
  onSearchResultSwipe(ev: any, row: any) {
    if (this.debug) { console.log(this.constructor.name + '.ionSwipe() => ', { ev, row }); }
    // Eliminamos el resultado de la lista.
    this.searchResults.splice(this.searchResults.findIndex(findRowIndex(row)), 1);
  }

  onMapClick($event: any) {
    const marker = this.marker;

    // Cancelamos el click si hay resultados por elegir.
    if (this.searchResults.length || !!this.clickResults) {
      marker.cancel();
      this.searchResults = []; this.clickResults = undefined;
      return;
    }

    // Inicializamos la colección.
    this.searchResults = []; this.clickResults = undefined;
    if (this.debug) { console.log(this.constructor.name + '.onMapClick($event)', $event); }
    // Si el recorrido está completado y no hay ninguna marca en edición...
    if (this.readOnly) {
      // Centramos el recorrido o posicionamos el mapa en la marca actual.
      if (this.bounds) { this.map.fitBounds(this.bounds); } else { marker.refresh(); }

    } else {
      // Establecemos el indicador de estado.
      this.loading = true;
      // Posicionamos la marca temporalmente.
      marker.position = $event.latLng as google.maps.LatLng;
      // Obtenemos los datos donde el usuario ha hecho clic.
      const data = $event.placeId || $event.latLng;
      // Obtenemos las direcciones donde ha hecho clic.
      this.maps[$event.placeId ? 'geocodePlace' : 'geocodeCoordinates'](data).subscribe({
        next: results => {
          // Comprobamos si está en zona.
          if (results.zona) {
            this.mostrarParadas(UBICACION_MAPA, results.zona).then(parada => this.setAddress(parada)).catch(() => marker.cancel());

          } else {
            if (results.length === 0) {
              // Revertimos la ubicación actual.
              marker.cancel();

            } else {
              const clickResults = {
                direcciones: results.direcciones,
                servicios: results.servicios,
                google: (results.google as any[]).map(d => ({ idDireccion: null, idUbicacion: 'new', ubicacion: d })),
              };
              // Comprobamos si solo se ha obtenido un resultado.
              if (results.length === 1) {
                // Seleccionamos directamente el único resultado.
                const address = [].concat(clickResults.direcciones, clickResults.servicios, clickResults.google).find(d => !!d);
                this.setAddress(address);

              } else {
                // Terminamos la edición de la marca.
                this.marker.edit = false;
                // Eliminamos el valor del cuadro de búsqueda.
                this.match = '';
                // Mostramos los resultados para que el usuario pueda elegir una dirección.
                this.clickResults = clickResults;
              }
            }
          }

        }, complete: () => this.loading = false
      });
    }
  }

  onClickResultSelected(direccion: any) {
    // Limpiamos los resultados de la búsqueda.
    this.searchResults = []; this.clickResults = undefined;
    // Establecemos la dirección obtenida.
    this.setAddress(direccion);
  }

  geoLocalizame() {
    this.alertCtrl.create({
      // Establecemos el contenido del alert
      header: this.translate.instant('reservar.geolocalizando'),
      subHeader: this.translate.instant('common.espere_un_momento') + '...',
      message: '<ion-spinner></ion-spinner>'
    }).then(alert => {
      // Presentamos el modal.
      alert.present();
      // Obtenemos la ubicación actual.
      this.geolocation.getCurrentPosition({ enableHighAccuracy: true }).then((data: GeolocationPosition) => {
        alert.dismiss();
        if (this.debug) { console.log('geolocation.getCurrentPosition() => ', data); }
        if (data && data.coords && data.coords.latitude) {
          // this.onMapClick([{ lat: data.coords.latitude, lng: data.coords.longitude }], { descripcion: this.translate.instant('reservar.geolocalizado') });
          this.onMapClick({ latLng: new google.maps.LatLng(+data.coords.latitude, +data.coords.longitude) });
        } else {
          this.maps.alertError({ message: 'reservar.error_geolocalizando' });
        }

      }).catch(error => { alert.dismiss(); this.maps.alertError({ error, message: 'reservar.error_geolocalizando' }); });
    });
  }

  mostrarParadas(tipoUbicacion: number, infra: any): Promise<boolean> {
    return new Promise<boolean>((resolve: any, reject: any) => {
      // Comprobamos si hay más de una parada por elegir.
      if (infra.paradas.length === 1) {
        return this.setAddress(infra.paradas[0]);

      } else {
        const actionSheetButtons = [];
        // Creamos los buttons para cada parada.
        infra.paradas.forEach(parada => {
          actionSheetButtons.push({
            text: this.translate.instant(parada.descripcion),
            handler: () => {
              // Quitamos el campo descripcion.
              const { descripcion, ...address } = parada;
              // Establecemos la nueva dirección seleccionada.
              this.setAddress(address).then(() => resolve(true)).catch(reject());
            }
          });
        });
        // Creamos el botón para cancelar.
        actionSheetButtons.push({
          text: this.translate.instant('buttons.cancel'),
          role: 'cancel',
          handler: () => {
            reject();
          }
        });
        // Mostramos el ActionSheet.
        this.action.create({
          header: this.translate.instant(infra.descripcion),
          buttons: actionSheetButtons
        }).then(action => { action.present(); });
      }
    });
  }

  /** Selecciona el texto del control. */
  onFocusForm($event: any) {
    $event.target.getInputElement().then((el: HTMLInputElement) => el.select());
  }

}
