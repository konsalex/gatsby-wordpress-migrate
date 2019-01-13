import fs from 'fs-extra';
import fetch from 'node-fetch';
import path from 'path';

// Custom Styling for Command Line printing
import chalk from 'chalk';

const success = chalk.bold.green.inverse;
const { log } = console;
const error = chalk.bold.red;

/** writing.js
 * header: {title, slug, author, tags...}
 * images:  [{fileName, alt, ...}, ...]
 * content: the content of the post converted to the proper markdown
 * dest: the destination folder
 */

const writing = (header, images, content, dest) => {
  const destination = path.isAbsolute(dest)
    ? dest
    : [process.cwd(), path.normalize(dest)].join('/');

  // Create the destination folder exists
  if (!fs.existsSync(destination)) {
    fs.mkdirSync(destination);
  }

  const finalDestinationFolder = [destination, header.slug].join('/');

  let srcPath = '';

  // Create the proper folder structure for the unique post
  if (!fs.existsSync(finalDestinationFolder)) {
    srcPath = finalDestinationFolder;
    fs.mkdirSync(srcPath);
  } else {
    const random = Math.floor(Math.random() * 100);
    srcPath = finalDestinationFolder + random;
    fs.mkdirSync(srcPath);
  }
  const post = `---\n${Object.keys(header).reduce(
    (acc, key) => `${acc}${key}: ${header[key]}\n`,
    '',
  )}---\n\n${content}`;
  console.log(post);

  // Writing the markdowns inside the folders
  fs.outputFile(`${srcPath}/index.md`, post, err => {
    if (err) {
      return log(error(err));
    }
    return log(success(`The post ${header.title} was successfully converted.`));
  });

  // Fetching the Images from the URLs
  return images.forEach(async image => {
    try {
      // Here I encode URI in order to convert Unescaped Characters
      return fetch(encodeURI(image.url)).then(res => {
        const file = fs.createWriteStream(`${srcPath}/${image.fileName}`);
        res.body.pipe(file);
      });
    } catch (err) {
      return log(error(err));
    }
  });
};

export default writing;
