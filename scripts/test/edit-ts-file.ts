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
    const data = new TypescriptParser(file);
    data.replaceProperty('AppConfig.app.name', /^3/g);
    data.save();

  } catch (error) {
    Terminal.error(error);
  }
  Terminal.line();
});
