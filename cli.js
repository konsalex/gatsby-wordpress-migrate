#!/usr/bin/env node

// FS-Extra in order to enable promises
const fs = require("fs");
const path = require("path");
const args = process.argv;
const parser = require('xml2js');
// Custom Styling for Command Line printing
const log = console.log;
const chalk = require("chalk");
const error = chalk.bold.red;
const success = chalk.bold.green.inverse;
const helperFunctions = require("./functions");


const cli = async () => {
  if (args.length < 4) {
    log(
      error(
        "We expect two arguments \n1: Input file \n2:Export directory as second."
      )
    );
    log(
      error("Example:   ") +
        success("gatsby2wordpress wordpressdata.xml blogposts")
    );
    process.exit();
  }

  const inputFilePath = args[2];
  const outputDir = args[3];

  // Read the XML file and call DataWrangle after we parse it
  fs.readFile(inputFilePath, function(err, data) {
    if (err){
      log(error(err));
      process.exit();
    }
    parser.parseString(data, function(err, result) {
      log(success("Successfully loaded file."));
      helperFunctions.dataWrangle(result, outputDir);
    });
  });

};

cli();
