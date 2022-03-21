#!/usr/bin/env node
import chalk from 'chalk';
import Prompt from 'commander';
import moment from 'moment';
import Client from 'ftp';

import { TypescriptProject, Terminal, Resource, Git, FtpClient, TypescriptParser } from '../../src';

try {

  Promise.resolve().then(async () => {
    // const secureOptions: Client.Options['secureOptions'] = {
    //   secureProtocol: 'sftp',
    //   // passphrase: '',
    //   // cert: '',
    // };
    const options = {
      host: 'app.exceltaxisantcugat.com',
      // protocol: 'ftp',
      // port: 21,
      user: 'excelftp',
      password: '!1z6T0$74-pA',
      // secure: true,
      // secureOptions,
    };
    const ftp = new FtpClient(options);
    // ftp.download('test', 'www/test/');
    // await ftp.upload('www/metabot', 'metabot', { verbose: true });
    // await ftp.upload(`tslint.json`, `/tslint.json`, { verbose: true });
    // await ftp.download(`pre/migracio`, `prova/migracio`, { verbose: true, ignore: `\\.sql$` });
    // await ftp.download(`pre/migracio`, `prova/migracio`, { verbose: true, ignore: `scripts` });
    ftp.disconnect();
  });
} catch (error) { Terminal.error(error); throw error; }