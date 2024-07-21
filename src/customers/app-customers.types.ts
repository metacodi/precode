
/**
 * ```typescript
 * export interface AppCustomersOptions {
 *   // Path relatiu des de la carpeta d'execució (típicament /precode) fins a la carpeta on es troben els environments del projecte. Ex: `../apps`
 *   apps: string;
 *   // Nom de la propietat dins de l'arxiu 'data.ts' que conté la info del customer. @default `data`.
 *   dataIdentifier?: string;
 *   // Nom de la carpeta del projecte front-end.
 *   frontendFolder: string;
 * }
 * ```
 */
export interface AppCustomersOptions {
  /** Path relatiu des de la carpeta d'execució (típicament /precode) fins a la carpeta on es troben els environments del projecte. Ex: `../apps` */
  apps: string;
  /** Nom de la propietat dins de l'arxiu 'data.ts' que conté la info del customer. @default `data`. */
  dataIdentifier?: string;
  /** Nom de la carpeta del projecte front-end.  */
  frontendFolder: string;
}