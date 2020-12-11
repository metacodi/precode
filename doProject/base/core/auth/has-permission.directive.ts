import { Directive, Input, ElementRef, AfterViewChecked } from '@angular/core';

import { ApiUserService } from 'src/core/api';


/** Add or remove 'hidden' class to element. */
@Directive({
  // tslint:disable-next-line: directive-selector
  selector: '[hasPermission]'
})
export class HasPermissionDirective implements AfterViewChecked {
  private permission: string;

  constructor(
    private el: ElementRef,
    private user: ApiUserService,
  ) { }

  @Input() set hasPermission(permission: string) {
    this.permission = permission;
    this.evalPermission();
  }

  ngAfterViewChecked() {
    // console.log('HasPermissionDirective', { permission: this.permission, el: this.el });
    this.evalPermission();
  }

  evalPermission() {
    if (!this.permission) { return; }
    const list: DOMTokenList = this.el.nativeElement.classList;
    if (this.user.instant && this.user.instant.permissions !== undefined && Array.isArray(this.user.instant.permissions)
    && (this.user.instant.permissions as string[]).includes(this.permission)) {
      // console.log(`HasPermissionDirective.evalPermission(${this.permission}) => true`, this.user.instant?.email);
      list.remove('hidden');
    } else {
      // console.log(`HasPermissionDirective.evalPermission(${this.permission}) => false`, this.user.instant?.email);
      list.add('hidden');
    }
  }

}
