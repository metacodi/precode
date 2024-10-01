#!/usr/bin/env node
import chalk from 'chalk';
import Prompt from 'commander';
import moment from 'moment';
import Client from 'ftp';

import { Git, Terminal } from '@metacodi/node-utils';


try {

  Promise.resolve().then(async () => {

    Terminal.title(`Test git`);
    // 6721a9b05f3b6164611c2337c2c449f82b685ec4
    const results = await Git.getChangesSince('2022-03-17 20:00:22.001');
    // const results = await Git.getPendingChanges({ verbose: true });
    console.log('results =>', results);

  });
} catch (error) { Terminal.error(error); throw error; }