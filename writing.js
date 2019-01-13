import fs from 'fs-extra';
import fetch from 'node-fetch';
import path from 'path';
import shortid from 'shortid';
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

  let srcPath = finalDestinationFolder;

  // Create the proper folder structure for the unique post
  if (!header.slug) {
    srcPath = `${destination}/draft.${shortid.generate()}`;
    fs.mkdirSync(srcPath);
  } else if (!fs.existsSync(finalDestinationFolder)) {
    fs.mkdirSync(srcPath);
  }

  const post = `---\n${Object.keys(header).reduce(
    (acc, key) =>
      header[key] !== undefined ? `${acc}${key}: ${header[key]}\n` : acc,
    '',
  )}---\n\n${content}`;

  // Writing the markdowns inside the folders
  fs.outputFile(`${srcPath}/index.md`, post, err => {
    if (err) {
      return log(error(err));
    }
    return log(success(`The post ${header.title} was successfully converted.`));
  });

  return null;
  // Fetching the Images from the URLs
  // Here I encode URI in order to convert Unescaped Characters
  log('Downloading images...');
  return images.forEach(async image =>
    fetch(encodeURI(image.url))
      .then(res => {
        const file = fs.createWriteStream(`${srcPath}/${image.fileName}`);
        res.body.pipe(file);
        log(success(`The image ${image.url} was successfully downloaded.`));
      })
      .catch(err => log(error(err))),
  );
};

export default writing;
