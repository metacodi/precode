import { Terminal, TerminalRunOptions } from './terminal';

export class Git {

  /**
   * Comprova si hi ha canvis al repositori indicat o, s'hi no se n'indica cap, a l'actual.
   *
   * Si no s'indica cap filtre es cerquen tots els arxius que han canviat respecte del darrer commit (`'ACDMRTUXB'`).
   *
   * ```bash
   * git dif --diff-filter=[(A|C|D|M|R|T|U|X|B)...[*]]
   * ```
   * Select only files that are Added (A), Copied (C), Deleted (D), Modified (M), Renamed (R), have their type (i.e. regular
   * file, symlink, submodule, ...) changed (T), are Unmerged (U), are Unknown (X), or have had their pairing Broken (B). Any
   * combination of the filter characters (including none) can be used. When * (All-or-none) is added to the combination, all
   * paths are selected if there is any file that matches other criteria in the comparison; if there is no file that matches
   * other criteria, nothing is selected.
   */
  static async hasChanges(options?: { folder?: string, filter?: string, verbose?: boolean }): Promise<boolean> {
    if (!options) { options = {}; }
    if (options.filter === undefined) { options.filter = 'ACDMRTUXB'; }
    if (options.verbose === undefined) { options.verbose = false; }
    return new Promise<boolean>(async (resolve: any, reject: any) => {
      const filter = options.filter;
      const verbose = options.verbose;
      const cwd = process.cwd();
      const diffDir = !!options.folder && options.folder !== cwd;

      // Esstablim el directori del repositori.
      if (diffDir) { process.chdir(options.folder); }

      const head = (await Terminal.run(`git rev-parse --verify HEAD`, { verbose }) as string).trim();
      if (verbose) { console.log('head => ', head); }
      const changes = (await Terminal.run(`git diff --name-status --diff-filter=${filter} ${head}`, { verbose }) as string).trim();
      const lines = changes.split('\n');

      for (const l of lines) {
        if (l.length > 2 && filter.includes(l.charAt(0)) && l.charAt(1) === '\t') {
          resolve(true); return;
        }
      }

      // Restablim l'anterior carpeta de treball.
      if (diffDir) { process.chdir(cwd); }

      resolve(false);
    });
  }

  /**
   * Obté una llista dels arxius del repositori indicat o, s'hi no se n'indica cap, de l'actual.
   *
   * Si no s'indica cap filtre es cerquen tots els arxius que han canviat respecte del darrer commit (`'ACDMRTUXB'`).
   *
   * ```bash
   * git dif --diff-filter=[(A|C|D|M|R|T|U|X|B)...[*]]
   * ```
   * Select only files that are Added (A), Copied (C), Deleted (D), Modified (M), Renamed (R), have their type (i.e. regular
   * file, symlink, submodule, ...) changed (T), are Unmerged (U), are Unknown (X), or have had their pairing Broken (B). Any
   * combination of the filter characters (including none) can be used. When * (All-or-none) is added to the combination, all
   * paths are selected if there is any file that matches other criteria in the comparison; if there is no file that matches
   * other criteria, nothing is selected.
   */
  static async getChanges(options?: { folder?: string, filter?: string, verbose?: boolean }): Promise<{ filename: string, status: string }[]> {
    if (!options) { options = {}; }
    if (options.filter === undefined) { options.filter = 'ACDMRTUXB'; }
    if (options.verbose === undefined) { options.verbose = false; }
    return new Promise<{ filename: string, status: string }[]>(async (resolve: any, reject: any) => {
      const filter = options.filter;
      const verbose = options.verbose;
      const cwd = process.cwd();
      const diffDir = !!options.folder && options.folder !== cwd;

      // Esstablim el directori del repositori.
      if (diffDir) { process.chdir(options.folder); }

      const head = (await Terminal.run(`git rev-parse --verify HEAD`, { verbose }) as string).trim();
      if (!!verbose) { console.log('head => ', head); }
      const changes = (await Terminal.run(`git diff --name-status --diff-filter=${filter} ${head}`, { verbose }) as string).trim();
      // if (!!verbose) { console.log('changes =>', changes); }
      const lines = changes.split('\n');

      const results: any[] = [];
      lines.map((l: string) => {
        if (l.length > 2 && filter.includes(l.charAt(0)) && l.charAt(1) === '\t') {
          const parts = l.split('\t');
          results.push({
            filename: parts[1] as string,
            status: Git.codeToStatus(parts[0])
          });
        }
      });
      if (verbose) { console.log(results); }
      if (verbose) { console.log(''); }

      // Restablim l'anterior carpeta de treball.
      if (diffDir) { process.chdir(cwd); }

      resolve(results);
    });
  }


  /**
   * Publica el repositori indicat o, s'hi no se n'indica cap, el de la carpeta de treball l'actual `cwd`.
   *
   * ```bash
   * git add -A
   * git commit -m "auto-update"
   * git push origin master
   * ```
   */
  static async publish(options?: { folder?: string, commit?: string, branch?: string, run?: TerminalRunOptions }): Promise<void> {
    if (!options) { options = {}; }
    if (options.commit === undefined) { options.commit = 'auto-update'; }
    if (options.branch === undefined) { options.branch = 'master'; }
    if (options.run === undefined) { options.run = {}; }
    const cwd = process.cwd();
    const diffDir = !!options.folder && options.folder !== cwd;

    // Esstablim el directori del repositori.
    if (diffDir) { process.chdir(options.folder); }

    // Acceptem els canvis al reposiori.
    await Terminal.run(`git add -A`, options.run).catch(err => {});
    // Fem el commit al reposiori.
    await Terminal.run(`git commit -m "${options.commit}"`, options.run).catch(err => {});
    // Publiquem el reposiori.
    await Terminal.run(`git push origin ${options.branch}`, options.run).catch(err => {});

    // Restablim l'anterior carpeta de treball.
    if (diffDir) { process.chdir(cwd); }
  }

  /**
   * Torna una descripció a partir del codi que defineix l'estat de canvis de l'arxiu.
   *
   * File status can be: Added (A), Copied (C), Deleted (D), Modified (M), Renamed (R), have their type (i.e. regular
   * file, symlink, submodule, ...) changed (T), are Unmerged (U), are Unknown (X), or have had their pairing Broken (B)
   */
  static codeToStatus(code: string): string {
    const map = {
        A: 'Added',
        C: 'Copied',
        D: 'Deleted',
        M: 'Modified',
        R: 'Renamed',
        T: 'Type-Change',
        U: 'Unmerged',
        X: 'Unknown',
        B: 'Broken'
    };
    return Object.keys(map).find(k => k === code);
  }

}
