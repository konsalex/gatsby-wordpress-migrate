#!/usr/bin/env node -r esm

import fs from 'fs';
import parser from 'xml2js';
import chalk from 'chalk';
import helperFunctions from './functions';

const error = chalk.bold.red;
const success = chalk.bold.green.inverse;
const { log } = console;

(() => {
  const args = process.argv;
  if (args.length < 4) {
    log(error(`We expect two arguments \n1: Input file \n2:Export directory`));
    log(
      error('Example:   ') +
        success('gatsby2wordpress wordpressdata.xml blogposts'),
    );
    return null;
  }

  const inputFilePath = args[2];
  const outputDir = args[3];

  // Read the XML file and call DataWrangle after we parse it
  return fs.readFile(inputFilePath, (err, data) => {
    if (err) {
      return log(error(err));
    }
    return parser.parseString(data, (parseError, result) => {
      if (parseError) {
        return log(error(parseError));
      }
      log(success('Successfully loaded file.'));
      return helperFunctions.dataWrangle(result, outputDir);
    });
  });
})();
