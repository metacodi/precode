import { Component, OnInit, Injector, OnDestroy, ViewChild, ViewChildren, QueryList } from '@angular/core';
import { ActionSheetController, IonContent, IonItem, IonList, IonSearchbar, ModalController } from '@ionic/angular';
import { Subscription } from 'rxjs';

import { AppConfig } from 'src/config';
import { AbstractComponent } from 'src/core/abstract';
import { BlobService } from 'src/core/api';

import { MapsService } from './maps.service';


/**
 * Componente para buscar direcciones a partir de un texto escrito.
 *
 * Se consulta el servicio `autcomplete` de la api de Google Maps.
 */
@Component({
  selector: 'app-search-address',
  templateUrl: 'search-address.component.html',
  styleUrls: ['search-address.component.scss'],
})
export class SearchAddressComponent extends AbstractComponent implements OnInit, OnDestroy {
  protected debug = true && AppConfig.debugEnabled;

  /** Referencia al contenido. */
  @ViewChild(IonContent, { static: false }) content: IonContent;
  /** Referenciamos el input de búsqueda. */
  @ViewChild(IonSearchbar, { static: false }) searchbar: IonSearchbar;

  /** Título de la ventana. */
  title: string;
  /** Colecciona los resultados de google de una búsqueda por texto. */
  searchResults: any[] = [];
  /** Texto escrito en la barra de búsqueda. */
  match: string;
  /** Indica el tiempo de espera entre pulsaciones antes de iniciar la búsqueda. */
  searchDebounce: 800;
  /** Indicador de estado de carga de resultados. */
  loading = false;
  /** Indicador de estado. */
  initialized = false;

  constructor(
    public injector: Injector,
    public maps: MapsService,
    public modal: ModalController,
    public action: ActionSheetController,
    public blob: BlobService,
  ) {
    super(injector, undefined);

    this.blob.get('mapsSettings').then(behavior => this.subscriptions.push(behavior.subscribe(data => this.searchDebounce = data.searchDebounce || 800)));
  }

  ngOnInit() {
    super.ngOnInit();
  }

  ngOnDestroy() {
    super.ngOnDestroy();
  }

  ionViewDidEnter() {
    setTimeout(() => {
      // Al entrar establecemos el foco en el cuadro de búsqueda.
      this.searchbar.setFocus();
      // Seleccionamos el texto del control.
      this.searchbar.getInputElement().then((el: HTMLInputElement) => el.select());
    });
    // Establecemos el indicador de estado.
    this.initialized = true;
  }

  /** Indica la ubicación para mostrar en el mapa al iniciar. */
  set initializeDireccion(data: { current: string, title?: string }) {
    if (this.debug) { console.log(this.constructor.name + '.initializeDireccion()', data); }
    // Establecemos la dirección actual.
    if (data?.current) { this.match = data.current; }
    if (data?.title) { this.title = data.title; }
  }

  /** Ocurre al escribir en el cuadro de búsqueda. */
  onSearchChanged(ev: any) {
    if (this.debug) { console.log(this.constructor.name + '.onSearchChanged(ev) => ', this.match); }
    // Inicializamos la colección.
    this.searchResults = [];
    // Comprobamos si el ussario  ha escrito un texto.
    if (this.initialized) {
      // Establecemos el indicador de estado.
      this.loading = true;
      // Obtenemos la descripción de la ubicación.
      this.maps.autocomplete(this.match).subscribe({
        next: results => {
          if (results.length === 0) {
            // Si no hay ningún resultado no hacemos nada.

          // } else if (results.length === 1) {
          //   // Si solo hay un resultado lo seleccionamos automáticamente.
          //   this.onSearchResultSelected(results[0]);

          } else {
            // Mostramos los resultados para que el usuario seleccione uno.
            this.searchResults = results;
            // Mostramos los primeros elementos de la lista.
            this.content.scrollToTop();
          }
        }, complete: () => this.loading = false
      });
    }
  }

  /** Ocurre al pulsar enter en el cuadro de búsqueda. */
  onSearchSubmit() {
    if (this.debug) { console.log(this.constructor.name + '.onSearchSubmit()'); }
    // // Si solo hay un resultado.
    // if (this.searchResults.length === 1) {
    //   // Seleccionamos automáticamente el único resultado.
    //   this.onSearchResultSelected(this.searchResults[0]);
    // }
    // Forzar la búsqueda.
    this.onSearchChanged(undefined);
  }

  /** Ocurre cuando se hace clic sobre uno de los resultados de búsqueda. */
  onSearchResultSelected(direccion: any) {
    // Limpiamos los resultados de la búsqueda.
    this.searchResults = [];
    // Establecemos el indicador de estado.
    this.loading = true;
    // Obtenemos la dirección seleccionada.
    this.maps.geocodeAddress(direccion).subscribe({
      next: results => {
        // Devolvemos la dirección obtenida.
        this.onGeocodeAddress(results);

      }, complete: () => this.loading = false
    });
  }

  // onGeocodeAddress(results: any) {
  //   // Establecemos la dirección obtenida.
  //   this.modal.dismiss(results);
  // }

  /** Devuelve los resultados obtenidos por geocodeAddress(). */
  onGeocodeAddress(results: any) {
    if (results.zona) {
      this.mostrarParadas(results.zona.seleccion, results.zona)
        .then(address => this.modal.dismiss(address))
        .catch(() => {});

    } else if (results.address) {
      // Establecemos la dirección obtenida.
      this.modal.dismiss(results.address);

    }
  }

  mostrarParadas(tipoUbicacion: number, infra: any): Promise<boolean> {
    return new Promise<boolean>((resolve: any, reject: any) => {
      // Comprobamos si hay más de una parada por elegir.
      if (infra.paradas.length === 1) {
        resolve(infra.paradas[0]);

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
              resolve(address);
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

  ionItemInput(ev: any) {
    if (this.debug) { console.log(this.constructor.name + '.ionItemInput()', ev); }
  }
}

