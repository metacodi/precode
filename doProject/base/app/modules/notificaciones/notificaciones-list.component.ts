import { Component, OnInit, Injector, OnDestroy, Input, ElementRef, ViewChild, NgZone, AfterViewInit } from '@angular/core';
import { IonInfiniteScroll } from '@ionic/angular';
import { timer, Subscription } from 'rxjs';
import * as moment from 'moment';

import { AbstractListComponent, EntityQuery, OrderByPipe, AbstractListRequestOptions } from 'src/core/abstract';
import { ApiService } from 'src/core/api';
import { AuthService } from 'src/core/auth';
import { NotificationsSchema, NotificationsService, NotifiedUser } from 'src/core/notifications';
import { LocalizationService } from 'src/core/localization';
import { ThemeService } from 'src/core/util';

import { UserService } from 'src/app/user';


@Component ({
  selector: 'app-notificaciones-list',
  templateUrl: 'notificaciones-list.component.html',
  styleUrls: ['notificaciones-list.component.scss'],
})
export class NotificacionesListComponent extends AbstractListComponent implements OnInit, OnDestroy {
  @ViewChild(IonInfiniteScroll, { static: false }) infinite: IonInfiniteScroll;

  itemsPerPage = 100;
  filterUnattended = false;
  infiniteVisible = true;

  /** @hidden */
  toggleUnattendedSubscription: Subscription;
  /** @hidden */
  newNotificationReceivedSubscription: Subscription;

  constructor(
    public injector: Injector,
    public auth: AuthService,
    public api: ApiService,
    public user: UserService,
    public theme: ThemeService,
    public service: NotificationsService,
    public zone: NgZone,
  ) {
    super(injector, NotificationsSchema);
    if (this.debug) { console.log(this.constructor.name + '.constructor()'); }

    // Recibimos la notificación desde la página de notificaciones para permutar las notificaciones filtradas.
    this.toggleUnattendedSubscription = this.service.toggleUnattended.subscribe(() => this.toggleUnattended());
    // Escuchamos las notificaciones push.
    this.newNotificationReceivedSubscription = this.service.newNotificationReceivedSubject.subscribe(nu => this.newNotificationReceived(nu));
  }

  ionViewWillEnter() {
    super.ionViewWillEnter();
    this.preloading = false;
    if (this.debug) { console.log(this.constructor.name + '.ionViewWillEnter()', { infinite: this.infinite }); }
  }

  ngOnDestroy() {
    if (this.toggleUnattendedSubscription) { this.toggleUnattendedSubscription.unsubscribe(); }
    if (this.newNotificationReceivedSubscription) { this.newNotificationReceivedSubscription.unsubscribe(); }
    super.ngOnDestroy();
  }

  selectRow(nu: NotifiedUser) {
    this.preloading = nu.idreg;
    timer().subscribe(() => {
      // La marcamos como atendida cuando no necesita ser solventada. Sinó deberá marcarse en la función asociada a la acción.
      this.service.executeNotification(nu, { forceAttended: !nu.notified.needToSolve }).then(() => {
        this.preloading = false;
      }).catch(() => {});
    });
  }

  /** Devuelve todas las filas de la cache o solo las filtradas. */
  get cache(): any[] {
    return this.filterUnattended ? (this.service.cache.rows as NotifiedUser[]).filter(nu => !nu.notified.attended) : this.service.cache.rows;
  }

  toggleUnattended() {
    if (this.debug) { console.log(this.constructor.name + '.toggleUnattended()', { infinite: this.infinite }); }
    this.filterUnattended = !this.filterUnattended;
    this.content.scrollToTop();
    this.request();
  }

  async request(options?: AbstractListRequestOptions): Promise<any> {
    // Vaciamos la consulta.
    this.query.rows = [];
    // Cargamos la siguiente página con las filas de la cache.
    this.loadPage(options?.event);
    // NOTA: Mostramos el infinite scroll pos si lo habíamos ocultado al completarse (pq usando la propiedad `disabled` deja de funcionar cuando alteramos la colección al filtrarla).
    this.infiniteVisible = true;
  }

  loadPage(event?: any) {
    // Cargamos la siguiente página con las filas de la cache.
    const cacheRows = this.cache;
    const page = cacheRows.slice(this.query.rows.length, this.query.rows.length + this.itemsPerPage);
    this.query.rows.push(...page);
    // Comprobamos cuantas filas se han consumido de la cache.
    const percentage = this.query.rows.length / cacheRows.length * 100;
    // if (this.debug) { console.log(this.constructor.name + '.loadPage()', { query: this.query.rows.length, cache: cacheRows.length, page: page.length, disabled: this.infinite?.disabled }); }
    if (!this.service.cache.completed && percentage > 80) {
      this.service.loadCache(false).subscribe(() => this.checkCompletition(event?.target));
    } else {
      this.checkCompletition(event?.target);
    }
  }

  protected checkCompletition(infinite?: HTMLIonInfiniteScrollElement) {
    // Completamos el evento de carga.
    setTimeout(() => infinite?.complete(), 500);
    // Obtenemos las filas de la cache según el filtro actual.
    const cacheRows = this.cache;
    // NOTA: Si hemos consumido todas las páginas de la cache, ocultamos el inifinite scroll (pq usando la propiedad `disabled` deja de funcionar cuando alteramos la colección al filtrarla).
    if (this.service.cache.completed && cacheRows.length === this.query.rows.length) { this.infiniteVisible = false; }
    if (this.debug) { console.log(this.constructor.name + '.checkCompletition()', { query: this.query.rows.length, cache: cacheRows.length, completed: this.service.cache.completed, disabled: this.infinite?.disabled }); }
  }

  newNotificationReceived(nu: NotifiedUser): void {
    const rows: NotifiedUser[] = this.query.rows;
    // Buscamos la fila correspondiente en la cache.
    const cached = this.cache.slice(0, rows.length).find(n => n.idreg === nu.idreg);
    // Si está entre los resultados del filtro y la paginación actuales...
    if (cached) {
      // Comprobamos que no se encuentra ya en la consulta del comnponente.
      const found = rows.find(n => n.idreg === nu.idreg);
      // Añadimos la fila al principio de la consulta.
      if (!found) { rows.unshift(cached); }
    }
  }

}
