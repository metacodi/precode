import { ActionType } from './code-project-types';

export type ModifierType = 'private' | 'protected' | 'public';

export interface ConstructorDeclaration {
  modifier: ModifierType;
  variable: string;
  specifier: string;
  action: ActionType;
}

export interface FileImport {
  specifiers: string[];
  source: string;
  action?: ActionType;
}
