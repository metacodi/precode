import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MenuController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { saveAs } from 'file-saver';
import { FilesystemDirectory, FilesystemEncoding } from '@capacitor/core';
// Workaround: Use Web-Implementation of plugin
import { FilesystemPluginWeb } from '@capacitor/core/dist/esm/web/filesystem.js';

import { AppConfig } from 'src/config';
import { SplashScreenPlugin } from 'src/core/native';
import { ThemeService, ConsoleService } from 'src/core/util';

import { VersionControlService } from './version-control.service';


const Filesystem = new FilesystemPluginWeb();

@Component({
  selector: 'app-version-control',
  templateUrl: 'version-control.page.html',
  styleUrls: ['version-control.page.scss'],
})
export class VersionControlPage implements OnInit {
  private debug = true && AppConfig.debugEnabled;

  constructor(
    public version: VersionControlService,
    public translate: TranslateService,
    public splashScreen: SplashScreenPlugin,
    public menu: MenuController,
    public theme: ThemeService,
    public http: HttpClient,
    public console: ConsoleService,
  ) {
    if (this.debug) { console.log(this.constructor.name + '.constructor()'); }
  }

  ngOnInit() {
    if (this.debug) { console.log(this.constructor.name + '.ngOnInit()'); }
  }

  ionViewWillEnter() {
    if (this.debug) { console.log(this.constructor.name + '.ionViewWillEnter()'); }

    this.menu.enable(false, 'main');

  }

  ionViewDidEnter() {
    // Ocultamos la pantalla inicial.
    this.splashScreen.hide();
  }

  ionViewWillLeave() {
    this.menu.enable(true, 'main');
  }

  async descarga() {
    await this.mkdir();

    // let mediaType = 'application/pdf';
    // let fileName = '';

    // const httpOptions = {
    //   headers: new HttpHeaders({
    //     'Content-Type':  'application/json',
    //     Authorization: 'my-auth-token'
    //   })
    // };

    // this.http.post(this.version.urlStore, null, { httpOptions, responseType: 'arraybuffer' }).subscribe(
    //   (response) => {

    //       this.blobFileWrite(fileName, response);
    //     }
    //   }, e => {
    //     console.error(e);

    //   }, () => {
    //     /* do nothing */
    //   }
    // );

    saveAs(this.version.urlStore, FilesystemDirectory.Documents + '/ExcelDownloads/ExcelApp.app');
  }

  async mkdir() {
    try {
      const ret = await Filesystem.mkdir({
        path: 'ExcelDownloads',
        directory: FilesystemDirectory.Documents,
        recursive: false // like mkdir -p
      });
    } catch (e) {
      console.error('Unable to make directory', e);
    }
  }

}
