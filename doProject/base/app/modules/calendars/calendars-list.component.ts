import { Component, Injector } from '@angular/core';

import { AppConfig } from 'src/config';

import { AbstractListComponent } from 'src/core/abstract';

import { CalendarsService } from './calendars.service';
import { CalendarsSchema } from './calendars.schema';


@Component ({
  selector: 'app-calendars-list',
  templateUrl: 'calendars-list.component.html',
  styleUrls: ['calendars-list.component.scss'],
})
export class CalendarsListComponent extends AbstractListComponent {
  protected debug = true && AppConfig.debugEnabled;

  constructor(
    public injector: Injector,
    public service: CalendarsService,
  ) {
    super(injector, CalendarsSchema);

    // if (this.debug) { console.log(this.constructor.name + '.constructor()'); }
    // this.loading = true;
    // this.service.getAll().subscribe(rows => {
    //   this.loading = false;
    //   this.rows = rows;
    // });
  }

  // set init(current: string) {
  //   if (current) {
  //     this.current = current;
  //   }
  // }

  // selectRow(row) {
  //   this.modal.dismiss(row);
  // }

}
