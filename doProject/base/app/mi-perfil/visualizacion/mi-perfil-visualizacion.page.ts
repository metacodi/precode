import { Component, Injector } from '@angular/core';


import { AppConfig } from 'src/config';
import { AbstractDetailComponent } from 'src/core/abstract';
import { AuthService } from 'src/core/auth';
import { DevicePlugin } from 'src/core/native';
import { ConsoleService } from 'src/core/util';

import { UserService } from 'src/app/user';
import { CalendarsService } from 'src/app/modules/calendars';

import { MiPerfilService } from '../mi-perfil.service';
import { MiPerfilVisualizacionSchema } from './mi-perfil-visualizacion.schema';


@Component({
  selector: 'app-mi-perfil-visualizacion',
  templateUrl: 'mi-perfil-visualizacion.page.html',
  styleUrls: ['mi-perfil-visualizacion.page.scss'],
})
export class MiPerfilVisualizacionPage extends AbstractDetailComponent {
  protected debug = true && AppConfig.debugEnabled;

  systemIcon = '';

  constructor(
    public injector: Injector,
    public auth: AuthService,
    public user: UserService,
    public calendars: CalendarsService,
    public console: ConsoleService,
    public service: MiPerfilService,
    public device: DevicePlugin,
  ) {
    super(injector, MiPerfilVisualizacionSchema);
    if (this.debug) { console.log(this.constructor.name + '.constructor()'); }
    this.device.ready().then(() => {
      this.systemIcon = this.service.deviceIcon(this.device.operatingSystem);
    });
    // NOTA: Asignamos la fila en preload para que no vaya a buscarla al backend.
    this.service.preloadedRow = {
      mode: this.theme.currentMode,
      light: this.theme.light.name,
      dark: this.theme.dark.name,
      statusBarVisible: this.theme.statusBarVisible
    } as any;
  }

  formChanged(value: any) {
    if (!value) { return; }
    const changedTheme = value.dark !== this.theme.dark.name || value.light !== this.theme.light.name;
    const changedMode = value.mode !== this.theme.currentMode;
    this.theme.light = this.theme.findTheme(value.light, 'light');
    this.theme.dark = this.theme.findTheme(value.dark, 'dark');
    if (changedMode) { this.theme.mode = value.mode; }
    if (!changedMode && changedTheme) { this.theme.setTheme(this.theme.current); }
    if (changedMode || changedTheme) { setTimeout(() => { this.theme.checkStatusBar(this); }, 250); }
    const changedStatusBar = value.statusBarVisible !== this.theme.statusBarVisible;
  }

  clickShowStatusBar(){
    this.theme.statusBarVisible = !!this.frm.controls.statusBarVisible.value;
  }

}
