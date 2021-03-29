import { Injectable } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { HttpClient, HttpRequest, HttpHeaders, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, Subject, timer, from } from 'rxjs';
import { map, first } from 'rxjs/operators';
import { NetworkStatus } from '@capacitor/core';

import { AppConfig } from 'src/core/app-config';
import { NetworkPlugin } from 'src/core/native';
import { ConsoleService } from 'src/core/util';

import { ApiRequest, ApiRequestOptions, HttpMethod } from '../model/api.types';
import { Blob, BlobService } from './blob.service';
import { UserSettings, UserSettingsService } from './user-settings.service';


/**
 * Performs HTTP requests through `HttpClient` taking care of:
 *
 *   - Maintain a cache of request observables
 *   - Enrouting urls with the API's base url
 *   - Using static default configuration
 *   - Present and dismiss a loader
 *
 * ```typescript
 * this.api.get('user/123').subscribe(user => user);
 * ```
 */
@Injectable({
  providedIn: 'root'
})
export class ApiService {
  /** Url base. */
  static url: string;

  private verbose = false && AppConfig.debugEnabled;
  private debug = true && AppConfig.debugEnabled;

  constructor(
    public http: HttpClient,
    public network: NetworkPlugin,
    public blob: BlobService,
    public settings: UserSettingsService,
    public console: ConsoleService,
  ) {

    if (this.debug) { this.console.log(this.constructor.name + '.constructor() => ', network); }

    // Establecemos la url base de la variable obtenida a través de forRoot() desde el módulo principal.
    ApiService.url = ApiService.url || AppConfig.api?.url;

    // Monitorizamos la conexión.
    this.network.addListenerNetworkStatusChange((status: NetworkStatus) => {
      this.connected = status.connected;
      if (this.debug && this.verbose) { this.console.log('Network connected!', status); }
    });
  }

  // ---------------------------------------------------------------------------------------------------
  //  Properties
  // ---------------------------------------------------------------------------------------------------

  /** Indica el estado de conexión. */
  connected = false;
  /** Inidica el número de milisegundos que deben transcurrir antes de presentar el loader. */
  loaderDelay = 1000;
  /** Colecciona las peticiones en curso. */
  private requests: ApiRequest[] = [];
  /**
   * Delegado que se llama cuando hay que presentar errores.
   *
   * ```typescript
   * api.presentAlert = (message?: string): void => {
   *   // Mostramos una alerta al usuario.
   *   this.alert.create({
   *     message: `${message}`,
   *     buttons: [{
   *       text: this.translate.instant('buttons.accept')
   *     }]
   *   }).then(alert => alert.present());
   * };
   * ```
   */
  presentAlert: ((message?: string) => void) | undefined;
  /**
   * Delegado que se llama cuando hay que presentar un loader.
   *
   * ```typescript
   * api.presentLoader = (message?: string): Promise<any> => {
   *   return new Promise((resolve, reject) => {
   *     this.loadingCtrl.create({
   *       message: this.translate.instant(message || 'api.updating') + '...',
   *       spinner: 'circles',
   *     }).then(loader => {
   *       loader.present();
   *       resolve(loader);
   *     }).catch(error => reject(error));
   *   });
   * }
   * ```
   */
  presentLoader: ((message?: string) => Promise<any>) | undefined;

  // ---------------------------------------------------------------------------------------------------
  //  Default configuration
  // ---------------------------------------------------------------------------------------------------

  defaults: ApiRequestOptions = {
    // -> HttpRequestOptions properties from HttpClient
    // body: null,
    headers: new HttpHeaders({ 'Content-type': 'application/json' }),
    observe: 'body',
    params: new HttpParams(),
    // reportProgress: false,
    responseType: 'json',
    // withCredentials: true,

    // -> our own properties
    showLoader: false,
    showErrors: true,
    // loaderText: 'Please, wait',
    // subject: new Subject<any>(),
    // subject: undefined,
    useCache: true,
  };


  // ---------------------------------------------------------------------------------------------------
  //  Methods
  // ---------------------------------------------------------------------------------------------------

  get(url: string, options?: ApiRequestOptions): Observable<any> {
    return this.request('GET', url, options);
  }

  post(url: string, body: any | null, options?: ApiRequestOptions): Observable<any> {
    return this.request('POST', url, this.addBody(body, options));
  }

  put(url: string, body: any | null, options?: ApiRequestOptions): Observable<any> {
    return this.request('PUT', url, this.addBody(body, options));
  }

  patch(url: string, body: any | null, options?: ApiRequestOptions): Observable<any> {
    return this.request('PATCH', url, this.addBody(body, options));
  }

  delete(url: string, options?: ApiRequestOptions): Observable<any> {
    return this.request('DELETE', url, options);
  }


  // ---------------------------------------------------------------------------------------------------
  //  Request overloads
  // ---------------------------------------------------------------------------------------------------
  // request<R>(req: HttpRequest<any>): Observable<HttpEvent<R>>;
  // request(method: HttpMethod, url: string, options?: ApiRequestOptions): Observable<ArrayBuffer>;
  // request(method: HttpMethod, url: string, options?: ApiRequestOptions): Observable<Blob>;
  // request(method: HttpMethod, url: string, options?: ApiRequestOptions): Observable<string>;
  // request(method: HttpMethod, url: string, options?: ApiRequestOptions): Observable<HttpEvent<ArrayBuffer>>;
  // request(method: HttpMethod, url: string, options?: ApiRequestOptions): Observable<HttpEvent<Blob>>;
  // request(method: HttpMethod, url: string, options?: ApiRequestOptions): Observable<HttpEvent<string>>;
  // request(method: HttpMethod, url: string, options?: ApiRequestOptions): Observable<HttpEvent<any>>;

  // request<R>(method: HttpMethod, url: string, options?: ApiRequestOptions): Observable<HttpEvent<R>>;
  // request<R>(method: HttpMethod, url: string, options?: ApiRequestOptions): Observable<HttpResponse<ArrayBuffer>>;
  // request<R>(method: HttpMethod, url: string, options?: ApiRequestOptions): Observable<HttpResponse<Blob>>;
  // request<R>(method: HttpMethod, url: string, options?: ApiRequestOptions): Observable<HttpResponse<string>>;
  // request<R>(method: HttpMethod, url: string, options?: ApiRequestOptions): Observable<HttpResponse<Object>>;
  // request<R>(method: HttpMethod, url: string, options?: ApiRequestOptions): Observable<HttpResponse<R>>;
  // request<R>(method: HttpMethod, url: string, options?: ApiRequestOptions): Observable<Object>;
  // request<R>(method: HttpMethod, url: string, options?: ApiRequestOptions): Observable<R>;
  // request<R>(method: HttpMethod, url: string, options?: ApiRequestOptions): Observable<any>;
  // ---------------------------------------------------------------------------------------------------

  request(method: HttpMethod | HttpRequest<any>, url: string, options: ApiRequestOptions = {}): Observable<any> {
    // Definimos una nueva consulta.
    const request: ApiRequest = this.defineRequest(method, url, options);
    // Comprobamos si debemos usar la caché de consultas.
    if (request.options.useCache) {
      // Comprobamos si ya existe otra consulta igual en marcha.
      const previous = this.getRequest(request);
      // Devolvemos el observable de la consulta encontrada.
      if (previous) { return previous.subject.asObservable(); }
    }

    // Registramos una nueva consulta.
    this.initRequest(request).then(() => {

      // Ejecutamos la consulta contra el backend.
      this.http.request(request.method, this.getUrl(request.url), request.options).pipe(
        // Mapeamos la respuesta para devolver sólo sus datos.
        map((response: any) => request.options.observe === 'body' && response && response.data && !response.idreg ? response.data : response)

      ).subscribe(
        results => this.successRequest(request, results),
        error => this.errorRequest(request, error),
      );
    });

    // Devolvemos el observable de la nueva consulta.
    return request.subject.asObservable();
  }


  // ---------------------------------------------------------------------------------------------------
  //  Caché de consultas
  // ---------------------------------------------------------------------------------------------------

  private defineRequest(method: HttpMethod | HttpRequest<any>, url: string, options: ApiRequestOptions): ApiRequest {
    /*
    export interface ApiRequestOptions {

      // HttpRequestOptions properties from HttpClient request
      body?: any,             // Mochila de datos real de la consulta.
      headers?: HttpHeaders | {[header: string]: string | string[]},
      observe?: 'body'|'response'|'events',  // Indica si se devuelve toda la respuesta o solo el cuerpo.
      params?: HttpParams | {[param: string]: string | string[]},
      reportProgress?: boolean,
      responseType?: 'arraybuffer'|'blob'|'json'|'text',
      withCredentials?: boolean,

      // our own properties
      showErrors?: boolean;   // Indica si se mostrarán mensajes de error automáticamente.
      showLoader?: boolean,   // Indica si se mostrará un spinner durante la consulta.
      loaderText?: string,    // Texto que se mostrará en el spinner.
      useCache?: boolean,     // Indica si se usará la caché de consultas.
      subject?: Subject<any> | BehaviorSubject<any>,
      blobs?: boolean | string | string[] | number | number[];
    }
    */

    // Tratamos las opciones de la consulta.
    if (!options) { options = {}; }
    // Sobrescribimos los valores por defecto con los suministrados.
    options = { ...this.defaults, ...options };

    // HttpRequestOptions properties from HttpClient request
    if (options.body === undefined) { options.body = null; }
    if (options.headers === undefined) { options.headers = new HttpHeaders(); }
    if (options.observe === undefined) { options.observe = 'body'; }
    if (options.params === undefined) { options.params = new HttpParams(); }
    if (options.reportProgress === undefined) { options.reportProgress = false; }
    if (options.responseType === undefined) { options.responseType = 'json'; }
    if (options.withCredentials === undefined) { options.withCredentials = true; }

    // our own properties
    if (options.showLoader === undefined) { options.showLoader = false; }
    if (options.showErrors === undefined) { options.showErrors = true; }
    if (options.loaderText === undefined) { options.loaderText = ''; }
    if (options.useCache === undefined) { options.useCache = true; }
    if (options.subject === undefined) { options.subject = options.subject || new Subject<any>(); }
    if (options.blobs === undefined) { options.blobs = false; }

    // Copy properties
    if (method instanceof HttpRequest) {
      const req = method as HttpRequest<any>;
      options.body = req.body || options.body || null;
      options.reportProgress = req.reportProgress;
      options.responseType = req.responseType;
      options.withCredentials = req.withCredentials;
    }

    // Tratamos los datos del formualrio.
    options.body = this.getFormValue(options.body);
    if (this.debug && this.verbose) { this.console.log(this.constructor.name + '.defineRequest(options)', options); }

    // Definimos una nueva consulta.
    return {
      method: method instanceof HttpRequest ? (method as HttpRequest<any>).method : method,
      url: method instanceof HttpRequest ? (method as HttpRequest<any>).url : url,
      options,
      subject: options.subject,
      loader: undefined,
      // timestamp: Math.round(new Date().getTime() / 1000 * 60 * 60 * 24 * 365),
    };
  }

  private getRequest(request: ApiRequest): ApiRequest | null {
    // Buscamos otra consulta parecida que aún esté pendiente de resolverse.
    const req = this.requests.find(req2 => this.equalsRequest(req2, request));
    // Comprobamos si hemos encontrado alguna consulta parecida.
    if (req) {
      // Devolvemos la consulta encontrada.
      if (this.debug && this.verbose) { this.console.log(this.constructor.name + '.getRequest(previous) => ', request); }
      return req;

    } else {
      // No se ha encontrado ninguna consulta.
      if (this.debug && this.verbose) { this.console.log(this.constructor.name + '.getRequest(new) => ', request); }
      return null;
    }
  }

  private equalsRequest(request1: ApiRequest, request2: ApiRequest): boolean {
    // return request1.method === request2.method && request1.url === request2.url && request1.body === request2.body
    return request1.method === request2.method && request1.url === request2.url;
  }

  private initRequest(request: ApiRequest): Promise<ApiRequest> {
    return new Promise<ApiRequest>((resolve: any, reject: any) => {
      // Registramos la consulta.
      this.requests.push(request);

      // Comprobamos si hay que realizar una petición de blobs.
      this.requestBlobs(request).then((req: ApiRequest) => {
        if (this.debug && this.verbose) { this.console.log(this.constructor.name + '.initRequest(requests) -> requestBlobs()'); }

        // Comprobamos si hay que realizar una petición de ajustes de usuario.
        this.requestUserSettings(req).then((req2: ApiRequest) => {
          if (this.debug && this.verbose) { this.console.log(this.constructor.name + '.initRequest(requests) -> requestUserSettings()'); }
          if (request.options.showLoader) { this.showLoader(request); }
          resolve(req2);

          // Mostramos el error sin interrumpir la ejecución.
        }).catch(error => { resolve(request); if (this.debug) { this.console.error(this.constructor.name + '.initRequest() -> processUserSettings(error) => ', { request: request.url, error }); } });
        // Mostramos el error sin interrumpir la ejecución.
      }).catch(error => { resolve(request); if (this.debug) { this.console.error(this.constructor.name + '.initRequest() -> requestBlobs(error) => ', { request: request.url, error }); } });
    });
  }

  private successRequest(request: ApiRequest, results: any): void {
    // Procesamos los blobs de la respuesta.
    this.processBlobs(results).then(() => {
      // Procesamos los ajustes de usuario de la respuesta.
      this.processUserSettings(results).then(() => {

        // Finalizamos la consulta.
        this.finishRequest(request);
        // Notificamos los resultados a los suscriptores.
        if (this.debug) { this.console.log(this.constructor.name + '.successRequest(request) => ', { request: request.url, results }); }
        request.subject.next(results);
        request.subject.complete();

      }).catch(error => {
        // Mostramos el error sin interrumpir la ejecución y notificamos los resultados a los suscriptores.
        if (this.debug) { this.console.error(this.constructor.name + '.successRequest() -> processUserSettings(error) => ', { request: request.url, results, error }); }
        request.subject.next(results);
        request.subject.complete();

      });

    }).catch(error => {
      // Mostramos el error sin interrumpir la ejecución y notificamos los resultados a los suscriptores.
      if (this.debug) { this.console.error(this.constructor.name + '.successRequest() -> processBlobs(error) => ', { request: request.url, results, error }); }
      request.subject.next(results);
      request.subject.complete();

    });
  }

  private errorRequest(request: ApiRequest, error: any): void {
    // Finalizamos la consulta.
    this.finishRequest(request);
    // Recuperamos el mensaje de error.
    let message = '';
    if (error instanceof HttpErrorResponse) {
      if (!!error.error && error.error.message) {
        message = error.error.message;
      } else if (error.status) {
        // status = 0 -> Not connected or server not response!
        message = error.message;
      }
    } else if (error && error.message) {
      message = error.message;
    }
    if (this.debug) { this.console.error(this.constructor.name + '.errorRequest(request) => ', { request, error, connected: this.connected }); }
    // Evitamos publicar urls.
    if (message.includes('http://') || message.includes('https://')) { message = (message + ' ').replace(/http.*(?=\s)/, '').trim(); }
    // Comprobamos si el error es debido a la falta de conexión a Internet.
    if (!message) { message = !this.connected ? 'api.network_error' : 'api.unknown_error'; }

    // Comprobamos si hay que mostrar el mensaje de error.
    if (request.options.showErrors && typeof this.presentAlert === 'function') { this.presentAlert(message); }
    // Notificamos los resultados a los suscriptores.
    request.subject.error(error);
  }

  private finishRequest(request: ApiRequest): void {
    // Iteramos las consultas en marcha.
    for (let i = 0; i < this.requests.length; i++) {
      // Comprobamos si son iguales.
      if (this.equalsRequest(this.requests[i], request)) {
        // Eliminamos la consulta de la colección.
        this.requests.splice(i, 1);
        if (this.debug && this.verbose) { this.console.log('ApiService.finishRequest(request) => requests.splice -> ', request); }
        // Ocultamos el loader.
        this.dismissLoader(request.loader);
        break;
      }
    }
    if (this.debug && this.verbose) { this.console.log('ApiService.finishRequest(request) => ', request); }
  }

  addBody<T>(body: T | null, options?: ApiRequestOptions): any {
    if (!options) { options = {}; }
    if (!options.body) { options.body = body; }
    return options;
  }


  // ---------------------------------------------------------------------------------------------------
  //  blobs . userSettings
  // ---------------------------------------------------------------------------------------------------

  /** Forzamos la carga de todos los blobs. Trabaja a petición de la notificación push correspondiente. */
  forceRequestBlobs(): Observable<Blob[]> {
    return this.get('blobs');
  }

  private requestBlobs(request: ApiRequest): Promise<ApiRequest> {
    return new Promise<ApiRequest>((resolve: any, reject: any) => {
      const options = request.options;
      // Comprobamos si hay que realizar una petición blob.
      if (!!options.blobs && (
        // Respetamos el parámetro si ya viene establecido en la colección params.
        (options.params instanceof HttpParams && !options.params.has('blobs'))
        || (typeof options.params === 'object' && !options.params.hasOwnProperty('blobs'))
      )) {
        if (this.debug && this.verbose) { this.console.log(this.constructor.name + '.requestBlobs(request) => ', true); }
        // Obtenemos las versiones indicadas para el parámetro de solicitud de blobs.
        this.blob.resume(options.blobs).then((versions: any) => {
          // Añadimos el parámetro 'blobs' según el tipo de parametrización suministrada.
          if (options.params instanceof HttpParams) {
            // if (this.debug && this.verbose) { this.console.log(this.constructor.name + '.requestBlobs() -> params instanceof HttpParams => ', options.params); }
            options.params = (options.params as HttpParams).set('blobs', this.blob.param(versions));
            // if (this.debug && this.verbose) { this.console.log(this.constructor.name + '.requestBlobs() -> params2 instanceof HttpParams => ', options.params); }

          } else if (typeof options.params === 'object') {
            // if (this.debug && this.verbose) { this.console.log(this.constructor.name + '.requestBlobs() -> params === \'object\' => ', options.params); }
            options.params = Object.assign(options.params, { blobs: this.blob.param(versions) });
            // if (this.debug && this.verbose) { this.console.log(this.constructor.name + '.requestBlobs() -> params2 === \'object\' => ', options.params); }
          }
          resolve(request);

        }).catch(error => {
          // Mostramos el error sin interrumpir la ejecución y notificamos los resultados a los suscriptores.
          if (this.debug && this.verbose) { this.console.error(this.constructor.name + '.requestBlobs() -> resume(error) => ', { options, error }); }
          resolve(request);
        });
      } else {
        if (this.debug && this.verbose) { this.console.log(this.constructor.name + '.requestBlobs(request) => ', false); }
        resolve(request);
      }
    });
  }

  private processBlobs(results: any): Promise<any> {
    return new Promise<any>((resolve: any, reject: any) => {
      if (this.debug && this.verbose) { this.console.log(this.constructor.name + '.processBlobs(results) ' + (results?.hasOwnProperty('blobs')) + ' => ', results); }
      // Comprobamos si se ha devuelto información de los blobs.
      if (!results?.hasOwnProperty('blobs')) {
        resolve(false);
      } else {
        // Guardamos los nuevos blobs.
        this.blob.store(results.blobs).then(() => {
          // Emitimos los cambios para que los suscriptores actualicen los blobs modificados.
          (results.blobs as Blob[]).map(blob => this.blob.updated.next(blob));
          // Quitamos la info de la respuesta.
          delete results.blobs;
          // Blobs procesados.
          resolve(true);
        }).catch(error => reject(error));
      }
    });
  }

  private requestUserSettings(request: ApiRequest): Promise<ApiRequest> {
    return new Promise<ApiRequest>((resolve: any, reject: any) => {
      const options = request.options;
      // Comprobamos si hay que realizar una petición de ajustes de usuario.
      if (!!options.userSettings && (
        // Respetamos el parámetro si ya viene establecido en la colección params.
        (options.params instanceof HttpParams && !options.params.has('userSettings'))
        || (typeof options.params === 'object' && !options.params.hasOwnProperty('userSettings'))
      )) {
        if (this.debug && this.verbose) { this.console.log(this.constructor.name + '.requestUserSettings(request) => ', true); }
        // Obtenemos las versiones indicadas para el parámetro de solicitud de ajustes de usuario.
        this.settings.resume(options.userSettings).then((versions: any) => {
          // Añadimos el parámetro 'userSettings' según el tipo de parametrización suministrada.
          if (options.params instanceof HttpParams) {
            // if (this.debug && this.verbose) { this.console.log(this.constructor.name + '.requestUserSettings() -> params instanceof HttpParams => ', options.params); }
            options.params = (options.params as HttpParams).set('userSettings', this.settings.param(versions));
            // if (this.debug && this.verbose) { this.console.log(this.constructor.name + '.requestUserSettings() -> params2 instanceof HttpParams => ', options.params); }

          } else if (typeof options.params === 'object') {
            // if (this.debug && this.verbose) { this.console.log(this.constructor.name + '.requestUserSettings() -> params === \'object\' => ', options.params); }
            options.params = Object.assign(options.params, { userSettings: this.settings.param(versions) });
            // if (this.debug && this.verbose) { this.console.log(this.constructor.name + '.requestUserSettings() -> params2 === \'object\' => ', options.params); }
          }
          resolve(request);

        }).catch(error => {
          // Mostramos el error sin interrumpir la ejecución y notificamos los resultados a los suscriptores.
          if (this.debug && this.verbose) { this.console.error(this.constructor.name + '.requestUserSettings() -> resume(error) => ', { options, error }); }
          resolve(request);
        });
      } else {
        if (this.debug && this.verbose) { this.console.log(this.constructor.name + '.requestUserSettings(request) => ', false); }
        resolve(request);
      }
    });
  }

  private processUserSettings(results: any): Promise<any> {
    return new Promise<any>((resolve: any, reject: any) => {
      if (this.debug && this.verbose) { this.console.log(this.constructor.name + '.processUserSettings(results) ' + (results?.hasOwnProperty('userSettings')) + ' => ', results); }
      // Comprobamos si se ha devuelto información de los ajustes de usuario.
      if (!results?.hasOwnProperty('userSettings')) {
        resolve(false);
      } else {
        // Guardamos los nuevos ajustes de usuario.
        this.settings.store(results.userSettings).then(() => {
          // Emitimos los cambios para que los suscriptores actualicen los blobs modificados.
          (results.userSettings as UserSettings[]).map(us => this.settings.updated.next(us));
          // Quitamos la info de la respuesta.
          delete results.userSettings;
          // UserSettings procesados.
          resolve(true);
        }).catch(error => reject(error));
      }
    });
  }


  // ---------------------------------------------------------------------------------------------------
  //  Loader
  // ---------------------------------------------------------------------------------------------------

  showLoader(request: ApiRequest): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      // Esperamos un momento antes de lanzar el loader.
      timer(this.loaderDelay).pipe(first()).subscribe(() => {
        // Comprobamos si la consulta todavía está en marcha.
        if (this.getRequest(request) && typeof this.presentLoader === 'function') {
          // Presentamos el loader.
          this.presentLoader(request.options.loaderText).then(loader => {
            if (this.debug && this.verbose) { this.console.log(this.constructor.name + '.presentLoader(loader) => ', loader); }
            // Comprobamos si la consulta todavía está en marcha.
            if (this.getRequest(request)) {
              // Referenciamos el loader para poder cerrarlo más tarde cuando haya finalizado la consulta.
              request.loader = loader;
              resolve(loader);

            } else {
              // Puede que se haya terminado la consulta antes de haber podido presentar el loader.
              this.dismissLoader(loader);
              resolve();

            }
          }).catch(error => reject(error));
        } else { resolve(); }
      }, error => reject(error));
    });
  }

  dismissLoader(loader: any): void {
    if (this.debug && this.verbose) { this.console.log(this.constructor.name + '.dismissLoader(loader) => ', loader); }
    // Ocultamos el loader actual.
    if (loader) { loader.dismiss(); }
  }


  // ---------------------------------------------------------------------------------------------------
  //  Url . Headers . Params
  // ---------------------------------------------------------------------------------------------------

  getUrl(url: string): string {
    // Si no es una url relativa...
    if (url.startsWith(ApiService.url)) { return url; }
    // Comprobamos si la ruta es absoluta.
    if (url.startsWith('http')) { return url; }
    // Añadimos la ruta base a la url relativa.
    return ApiService.url + (ApiService.url.endsWith('/') || url.startsWith('/') ? '' : '/') + url;
  }

  getFormValue(frm: FormGroup | any): any {
    if (frm instanceof FormGroup) {
      return Object.assign({}, frm.value);

    } else {
      return frm;
    }
  }


  unGroupData(data: { [x: string]: any; }, stringify = false): any {
    const target: any = {};
    // Iteramos todas las propiedades del objeto.
    for (const prop in data) {
      if (data[prop] !== null && typeof data[prop] === 'object') {
        if (stringify) {
          target[prop] = JSON.stringify(data[prop]);
        } else {
          Object.assign(target, this.unGroupData(data[prop], stringify));
        }

      } else {
        target[prop] = data[prop];
      }
    }
    return target;
  }

  getFormParams(data: any, stringify = false): string {
    // Devolvemos un objeto plano que revierta el anidamiento de grupos creados para validación.
    data = this.unGroupData(data, stringify);
    // Transformamos los datos en parámetros para contenido de tipo 'x-www-form-urlencoded'
    let params = new HttpParams();
    // Iteramos cada propiedad de la mochila de datos.
    for (const prop in data) {
      if (data.hasOwnProperty(prop)) {
        params = params.set(prop, data[prop]);
      }
    }
    // Devolvemos un string con los datos en formato param1=value1&param2=value2
    return params.toString();
  }


}






