#!/usr/bin/env node -r esm

// FS-Extra in order to enable promises
const fs = require('fs');
const path = require('path');
const args = process.argv;
const parser = require('xml2js');
const inquirer = require('inquirer');
// Custom Styling for Command Line printing
const log = console.log;
const chalk = require('chalk');
const error = chalk.bold.red;
const success = chalk.bold.green.inverse;
const helperFunctions = require('./functions');

(async () => {
  const args = process.argv;
  let infos = null;
  if (args.length < 4) {
    infos = await inquirer.prompt([
      {
        type: 'input',
        name: 'xml',
        message: 'Wordpress XML file:',
      },
      {
        type: 'input',
        name: 'dest',
        message: 'Destination for your new MarkDown folder:',
      },
    ]);
  }

  const inputFilePath = infos ? infos.xml : args[2];
  const outputDir = infos ? infos.dest : args[3];

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
