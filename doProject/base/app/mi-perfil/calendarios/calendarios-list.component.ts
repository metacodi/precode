import { Component, Injector, OnInit, OnDestroy } from '@angular/core';

import { AppConfig } from 'src/config';
import { AbstractListComponent } from 'src/core/abstract';
import { UserService } from 'src/app/user';

import { CalendarsListComponent, CalendarsService } from 'src/app/modules/calendars';

import { MiPerfilService } from '../mi-perfil.service';
import { CalendariosSchema } from './calendarios.schema';


@Component({
  selector: 'app-calendarios-list',
  templateUrl: 'calendarios-list.component.html',
  styleUrls: ['calendarios-list.component.scss'],
})
export class CalendariosListComponent extends AbstractListComponent implements OnInit, OnDestroy {
  protected debug = true && AppConfig.debugEnabled;

  constructor(
    public injector: Injector,
    public service: MiPerfilService,
    public user: UserService,
    public calendars: CalendarsService,
  ) {
    super(injector, CalendariosSchema);
    if (this.debug) { console.log(this.constructor.name + '.constructor()'); }
  }

  addCalendar() {
    this.calendars.pickRow({ component: CalendarsListComponent }).then(calendar => {
      if (this.debug) { console.log(this.constructor.name + '.addCalendar => .select = >', calendar); }
      if (calendar) {
        this.saveRow({ idreg: 'new', idUser: this.user.instant.idreg, calendario: calendar.name }).then(() => {
          this.calendars.check().then(() => {});
        });
      }
    });
  }

  async deleteRow(row: any): Promise<any> {
    return super.deleteRow(row).then(result => {
      // Al eliminar el perfil deslogueamos.
      this.calendars.check().then(() => {});
    });
  }

}
