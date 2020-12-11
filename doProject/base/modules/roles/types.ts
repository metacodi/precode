
export type CheckState = true | false | undefined;

export interface PermissionNode {
  name: string;
  icon?: string;
  level?: number;
  parent?: PermissionNode;
  isFolder?: boolean;
  selected?: boolean;
  selectedState?: CheckState;
  expanded?: boolean;
  children?: (PermissionNode | string)[];
}

export interface PermissionsData {
  role: { idreg: number; name: string; allowInheritance: boolean; allowInstances: boolean; };
  permissions: (PermissionNode | string)[];
  allowed: string[];
  denied: string[];
}
