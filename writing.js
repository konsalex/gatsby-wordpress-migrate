const fs = require("fs-extra");
const fetch = require("node-fetch");
const slugify = require('@sindresorhus/slugify');
var path = require("path");

// Custom Styling for Command Line printing
const chalk = require("chalk");
const success = chalk.bold.green.inverse;
const log = console.log;
const error = chalk.bold.red;

/* writing
 * post: the content of the post converted to the proper markdown
 * title: the title of the post
 * images:  [{url: <URL of the image>, fileName: <The UUID name generated>},...]
 * destination: the destination folder
 */

const writing = (post, title, images, destination) => {
  // Converting the title to the proper folder name
  const dirTitle = slugify(title);

  destination = path.isAbsolute(destination)
    ? destination
    : [process.cwd(), path.normalize(destination)].join("/");

  // Create the destination folder exists
  if (!fs.existsSync(destination)) {
    fs.mkdirSync(destination);
  }

  const finalDestinationFolder = [destination, dirTitle].join("/");

  let srcPath = "";


  // Create the proper folder structure for the unique post
  if (!fs.existsSync(finalDestinationFolder)) {
    srcPath = finalDestinationFolder;
    fs.mkdirSync(srcPath);
  } else {
    const random = Math.floor(Math.random() * 100);
    srcPath = finalDestinationFolder + random;
    fs.mkdirSync(srcPath);
  }

  // Writing the markdowns inside the folders
  fs.outputFile(`${srcPath}/index.md`, post, function(err) {
    if (err) {
      return log(error(err));
    }
    log(success(`The post ${title} was successfully converted.`));
  });

  // Fetching the Images from the URLs
  images.forEach(async image => {
    try {
      // Here I encode URI in order to convert Unescaped Characters
      const imageResponse = fetch(encodeURI(image.url)).then(res => {
        const file = fs.createWriteStream(
          `${srcPath}/${image.fileName}`
        );
        res.body.pipe(file);
      });
    } catch (err) {
      log(error(err));
    }
  });
};

module.exports = writing;
