import { Component, Injector, OnInit, OnDestroy, Input, Output } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ModalController } from '@ionic/angular';

import { AppConfig } from 'src/config';
import { AbstractComponent } from 'src/core/abstract';
import { ThemeService } from 'src/core/util';

import { RolesService } from '../roles.service';
import { PermissionNode, PermissionsData } from '../types';


@Component({
  selector: 'app-permissions',
  templateUrl: 'permissions.component.html',
  styleUrls: ['permissions.component.scss'],
})
export class PermissionsComponent extends AbstractComponent implements OnInit, OnDestroy {
  protected debug = true && AppConfig.debugEnabled;

  @Input() isModal = false;
  @Input() isEmbeded = false;

  @Input() idRole: number;
  @Input() idUser: number;

  role: PermissionsData['role'];
  allowed: string[];
  permissions: PermissionNode[];
  @Output() denied: string[];

  expandedAll = false;
  hasChanges = false;
  loading = false;

  constructor(
    public injector: Injector,
    public theme: ThemeService,
    public service: RolesService,
    public route: ActivatedRoute,
    public modal: ModalController,
  ) {
    super(injector, null);
    if (this.debug) { console.log(this.constructor.name + '.constructor()'); }

    const p = 'facturas.edit.emision.tipo';
    const r = p.split('.').reduce((pre, cur, i) => pre.concat((i > 0 ? pre[pre.length - 1] + '.' : '') + cur), []);
    console.log(p);
    console.log(r);
  }

  ngOnInit() {
    super.ngOnInit();

    // Obtenemos el identificador del role.
    this.idRole = this.route.snapshot.queryParams.idRole;
    this.idUser = this.route.snapshot.queryParams.idUser;
    // Cargamos los permisos del role obtenido.
    this.loadPermissions(this.idRole ? 'Role' : 'User', this.idRole || this.idUser);
  }

  loadPermissions(type: 'Role' | 'User', idreg: number): void {
    this.loading = true;
    // Obtenemos los permisos del role/usuario.
    this.service.loadPermissions(type, idreg).then(data => {
      // Info del role.
      this.role = data.role;
      // Definición de los permisos del role padre del cual se hereda el role/usuario actual.
      this.allowed = data.allowed;
      // Permisos denegados para el role/usuario actual.
      this.denied = data.denied;
      // Mapeamos y filtramos el árbol de permisos.
      this.permissions = this.filterPermissions(this.mapPermissions(data.permissions), data.allowed, data.denied);
    }).finally(() => this.loading = false);
  }

  savePermissions() {
    this.loading = true;
    // Guardamos los permisos del role/usuario.
    const type = this.idRole ? 'Role' : 'User';
    const idreg = this.idRole ? this.idRole : this.idUser;
    this.service.savePermissions(type, idreg, this.denied).subscribe({
      next: data => this.hasChanges = false,
      complete: () => this.loading = false,
    });

  }

  // ---------------------------------------------------------------------------------------------------
  //  map . filter
  // ---------------------------------------------------------------------------------------------------

  mapPermissions(rawPermissions: (PermissionNode | string)[], parent = null, level = 0): PermissionNode[] {
    return rawPermissions.map(p => {
      const permission = typeof p === 'string' ? { name: p } : p;
      permission.isFolder = permission.hasOwnProperty('isFolder') ? permission.isFolder : false;
      permission.parent = parent;
      permission.level = level;
      permission.expanded = false;
      permission.selected = false;
      permission.selectedState = false;
      permission.children = this.mapPermissions(permission.children || [], permission, level + 1);
      return permission;
    });
  }

  filterPermissions(allPermissions: PermissionNode[], allowed: string[], denied: string[]): PermissionNode[] {
    return allPermissions.filter(permission => {
      // Excluímos los permisos que ya no aparecen en el role padre.
      if (!permission.isFolder && !allowed.includes(permission.name)) { return false; }
      // Comprobamos si el permiso (o cualquiera de sus padres) está denegado para el role/usuario actual.
      // REDUCE: 'facturas.print.iva' => ['facturas', 'facturas.print', 'facturas.print.iva']
      const parentsAndMe = permission.name.split('.').reduce((pre, cur, i) => pre.concat((i > 0 ? `${pre[pre.length - 1]}.` : '') + cur), []);
      permission.selected = !parentsAndMe.some(p => denied.includes(p));
      // Primero filtramos los hijos.
      permission.children = this.filterPermissions(permission.children as PermissionNode[], allowed, denied);
      // Excluímos las carpetas sin hijos.
      if (permission.isFolder && permission.children?.length === 0) { return false; }
      // Comprobamos el estado de selección del role/usuario actual.
      if (permission.children?.length) {
        const someSelected = permission.children.some((p: PermissionNode) => p.selected);
        const someIndetermiante = permission.children.some((p: PermissionNode) => p.selectedState === undefined);
        const indeterminate = !permission.children.every((p: PermissionNode) => p.selected === permission.selected);
        permission.selectedState = someIndetermiante || indeterminate ? undefined : someSelected;
      } else {
        permission.selectedState = permission.selected;
      }
      return true;
    });
  }


  // ---------------------------------------------------------------------------------------------------
  //  add | revoke permission
  // ---------------------------------------------------------------------------------------------------

  updatePermission(permission: PermissionNode) {
    // Solo afecta a los permisos reales.
    if (permission.isFolder) { return; }
    // Si el permiso está seleccionado...
    if (permission.selected) {
      // Lo quitamos de la lista de denegados.
      const idx = this.denied.indexOf(permission.name);
      if (idx > -1) { this.denied.splice(idx, 1); }
    } else {
      // Lo añadimos a la lista de los denegados.
      if (!this.denied.includes(permission.name)) { this.denied.push(permission.name); }
      // Quitamos permisos hijos redundantes.
      this.denied = this.denied.filter(p => !p.startsWith(permission.name + '.'));
    }
  }

  // ---------------------------------------------------------------------------------------------------
  //  expand
  // ---------------------------------------------------------------------------------------------------

  toggleExpanded(permission: PermissionNode): void {
    permission.expanded = !permission.expanded;
  }

  toggleExpandedAll(expanded: boolean, permission?: PermissionNode): void {
    this.expandedAll = expanded;
    if (!permission) {
      this.permissions.map(p => this.toggleExpandedAll(expanded, p));
    } else {
      if (permission.children?.length) {
        permission.expanded = expanded;
        permission.children.map((p: PermissionNode) => this.toggleExpandedAll(expanded, p));
      }
    }
  }

  allParentsExpanded(permission: PermissionNode): boolean {
    while (permission.parent) {
     if (!permission.parent.expanded) { return false; }
     permission = permission.parent;
    }
    // let parent = permission.parent;
    // while (parent) {
    //  if (!parent.expanded) { return false; }
    //  parent = parent.parent;
    // }
    return true;
  }


  // ---------------------------------------------------------------------------------------------------
  //  selection
  // ---------------------------------------------------------------------------------------------------

  toggleSelected(permission: PermissionNode): void {
    permission.selected = !permission.selected;
    permission.selectedState = permission.selected;
    if (permission.selected) {
      this.updatePermission(permission);
      this.selectAllChildren(permission);
      this.checkSiblingsAndParents(permission);
    } else {
      this.selectAllChildren(permission);
      this.updatePermission(permission);
      this.checkSiblingsAndParents(permission);
    }
    this.denied.sort();
    this.hasChanges = true;
  }

  selectedIcon(permission: PermissionNode): string {
    switch (permission.selectedState) {
      case true: return 'assets/icons/check-state-true.svg';
      case false: return 'assets/icons/check-state-false.svg';
      case undefined: return 'assets/icons/check-state-indeterminate.svg';
    }
  }

  selectAllChildren(permission: PermissionNode): void {
    permission.children.map((p: PermissionNode) => {
      p.selected = permission.selected;
      p.selectedState = permission.selected;
      if (p.selected) {
        this.updatePermission(p);
        this.selectAllChildren(p);
      } else {
        this.selectAllChildren(p);
        this.updatePermission(p);
      }
    });
  }

  checkSiblingsAndParents(permission: PermissionNode): void {
    if (permission.parent) {
      const someSelected = permission.parent.children.some((p: PermissionNode) => p.selected);
      const someIndetermiante = permission.parent.children.some((p: PermissionNode) => p.selectedState === undefined);
      const indeterminate = !permission.parent.children.every((p: PermissionNode) => p.selected === permission.selected);
      permission.parent.selected = someSelected;
      permission.parent.selectedState = someIndetermiante || indeterminate ? undefined : someSelected;
      if (permission.selected) {
        this.checkSiblingsAndParents(permission.parent);
        this.updatePermission(permission.parent);
        permission.parent.children.map((p: PermissionNode) => this.updatePermission(p));
      } else {
        permission.parent.children.map((p: PermissionNode) => this.updatePermission(p));
        this.updatePermission(permission.parent);
        this.checkSiblingsAndParents(permission.parent);
      }
    }
  }

}
