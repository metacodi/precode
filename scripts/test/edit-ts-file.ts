#!/usr/bin/env node
import chalk from 'chalk';
import Prompt from 'commander';
import moment from 'moment';

import { TypescriptProject, Terminal, Resource, Git, FtpClient, TypescriptParser } from '../../src';

const project: TypescriptProject = new TypescriptProject(Prompt.folder);
project.initialize().then(async () => {
  try {

    const file = `prova/config.ts`;
    console.log(file);
    const config = new TypescriptParser(file);
    console.log('AppConfig.app.package =', config.getPropertyValue('AppConfig.app.package'));
    console.log('AppConfig.gateways.foo =', config.getPropertyValue('AppConfig.gateways.foo'));
    console.log('AppConfig.gateways.10 =', config.getPropertyValue('AppConfig.gateways.10'));
    config.replaceProperty('AppConfig.app.name', /^3/g);
    config.save();

  } catch (error) {
    Terminal.error(error);
  }
  Terminal.line();
});
