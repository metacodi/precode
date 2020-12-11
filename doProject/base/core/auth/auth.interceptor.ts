import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { HttpEvent, HttpInterceptor, HttpHandler, HttpRequest, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { mergeMap, catchError, switchMap } from 'rxjs/operators';

import { AppConfig } from 'src/core/app-config';
import { ApiService } from 'src/core/api';
import { API_ERR_VALIDATION_REQUIRED, API_ERR_SESSION_EXPIRED, API_ERR_INVALID_CREDENTIALS, API_ERR_INVALID_TOKEN, HTTP_ERR_FORBIDDEN } from 'src/core/api';
import { ConsoleService } from 'src/core/util';

import { AuthService } from './auth.service';


/**
 * Implementa la clase `HttpInterceptor` para interceptar las consultas a la api con el propósito de:
 * - Añadir el token de autorización automáticamente en la cabecera de las consultas dirigidas a la api.
 * - Capturar los errores de autenticación y de expiración de la sesión (401) para intentar refrescar el token y repetir la consulta.
 */
@Injectable({
  providedIn: 'root'
})
export class AuthInterceptor implements HttpInterceptor {
  private debug = true && AppConfig.debugEnabled;

  constructor(
    public auth: AuthService,
    public console: ConsoleService,
  ) { }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Inyectamos el token de autorización sólo en las llamadas a la api.
    if (!req.url.startsWith(ApiService.url)) { return next.handle(req); }

    if (this.debug) { console.log(this.constructor.name + ' => req = ', req); }
    if (this.debug) { console.log(this.constructor.name + ' => ApiService.url = ', ApiService.url); }
    if (this.debug) { console.log(this.constructor.name + ' => ', req.url.replace(ApiService.url, '')); }

    // Recuperamos el usuario del almacén.
    return this.auth.getToken().pipe(
      mergeMap((token: string) => {
        // Si se ha recuperado un token almacenado...
        if (this.debug) { console.log(this.constructor.name + 'intercept -> auth.getToken() => true', token ? 'with token' : 'without token'); }
        // Enviamos el request clonado al siguiente manejador.
        return next.handle(req.clone({ setHeaders: { Authorization: token } })).pipe(
          catchError(error => {
            const err: any = (error as HttpErrorResponse).error || { };
            if (this.debug) { console.log(this.constructor.name + ' -> catchError() => :', error); }
            // 401 Unauthorized (no logueado)
            if (err.http_code === API_ERR_VALIDATION_REQUIRED) {
              if (this.debug) { console.log(this.constructor.name + ` -> ${API_ERR_VALIDATION_REQUIRED} Unauthorized (no logueado)`, error); }
              // api API_ERR_VALIDATION_REQUIRED Todavía no se ha validado.
              // api 490 La sesión ha caducado.
              if (err.api_code === API_ERR_SESSION_EXPIRED) {
                if (this.debug) { console.log(this.constructor.name + ' -> api_code => ' + err.api_code, error); }
                // Comprobamos que la llamada fallida no sea un intento de refresh del token.
                // if (req.url.endsWith('/api/refreshToken') && (req.body.token || req.body.apiToken)) {
                if (req.url.endsWith('/api/refreshToken')) {
                  // No volvemos a intentar el refreshToken para no entrar en bucle infinito.
                  this.auth.logout();
                  return throwError(err);
                }
                // Intentamos refrescar el token.
                return this.auth.refreshToken().pipe(
                  switchMap((newToken: any) => {
                    if (this.debug) { console.log(this.constructor.name + ' -> auth.refreshToken() -> newToken => ', newToken); }
                    return next.handle(req.clone({ setHeaders: { Authorization: newToken } }));
                  }),
                  catchError(newError => {
                    if (this.debug) { this.console.log(this.constructor.name + ' -> auth.refreshToken() -> catchError(newError) -> logout() => ', newError); }
                    this.auth.logout();
                    return throwError(newError);
                  })
                );

              } else {
                // api 491 Invalid token
                if (err.api_code === API_ERR_INVALID_TOKEN) {
                  if (this.debug) { this.console.log(this.constructor.name + ` -> api ${API_ERR_INVALID_TOKEN} Invalid token!`, error); }
                  this.auth.logout();
                }
                // api 401 Invalid token
                if (err.api_code === API_ERR_VALIDATION_REQUIRED) {
                  if (this.debug) { this.console.log(this.constructor.name + ` -> api ${API_ERR_VALIDATION_REQUIRED} Validation required!`, error); }
                  this.auth.logout();
                }
                // api 489 Correo electrónico y contraseña incorrectos
                if (err.api_code === API_ERR_INVALID_CREDENTIALS) {
                  if (this.debug) { this.console.log(this.constructor.name + ` -> api ${API_ERR_INVALID_CREDENTIALS} Correo electrónico y contraseña incorrectos`, error); }
                  this.auth.logout();
                }
                // api 493 Pendiente de validación. Solo se puede producir tras un login, por eso se captura desde auth.login()
                return throwError(error);
              }

            } else if (err.http_code === HTTP_ERR_FORBIDDEN) {
              // 403 Forbidden (no tiene permisos)
              if (this.debug) { this.console.log(this.constructor.name + ` -> ${HTTP_ERR_FORBIDDEN} Forbidden (no tiene permisos)`, error); }
              this.auth.logout();
              return throwError(error);

            } else {
              // It's not an authentication error.
              if (this.debug) { this.console.log(this.constructor.name + ' -> It\'s not an authentication error.', error); }
              return throwError(error.error);
            }
          })
        );
      })
    );
  }
}
