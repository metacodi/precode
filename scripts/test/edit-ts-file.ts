#!/usr/bin/env node
import { Terminal } from '@metacodi/node-utils';
import chalk from 'chalk';
import Prompt from 'commander';
import moment from 'moment';

import { TypescriptProject, TypescriptParser } from '../../src';


/**
 * ```
 * npx ts-node scripts/test/edit-ts-file.ts
 * ```
 */

const project: TypescriptProject = new TypescriptProject(Prompt.folder);
project.initialize().then(async () => {
  try {

    const file = `prova/config.ts`;
    console.log(file);
    const config = new TypescriptParser(file);
    const obj = config.getPropertyValue('AppConfig.app.obj');
    console.log('AppConfig.app.obj =', obj);
    const arr = config.getPropertyValue('AppConfig.app.arr');
    console.log('AppConfig.app.arr =', arr);
    config.setPropertyValue('AppConfig.gateways.foo', arr);
    config.setPropertyValue('AppConfig.gateways.10', obj);
    // config.setPropertyValue('AppConfig.gateways.11', arr);
    // console.log('AppConfig.app.package =', config.getPropertyValue('AppConfig.app.package'));
    // console.log('AppConfig.gateways.foo =', config.getPropertyValue('AppConfig.gateways.foo'));
    // console.log('AppConfig.gateways.10 =', config.getPropertyValue('AppConfig.gateways.10'));
    // // config.setPropertyValue('AppConfig.app.name', /^3/g);
    // // config.setPropertyValue('AppConfig.app.name', 'jord');
    // config.setPropertyValue('AppConfig.app.name', /^3/g);
    // config.setPropertyValue('AppConfig.app.regex', true);
    // config.setPropertyValue('AppConfig.app.nulo', null);
    // config.setPropertyValue('AppConfig.app.text', 'text');
    // config.setPropertyValue('AppConfig.gateways.10', '10');
    config.save();

  } catch (error) {
    Terminal.error(error);
  }
  Terminal.line();
});
