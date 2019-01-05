const xml2js = require("xml2js");
const cheerio = require("cheerio");
const moment = require("moment");
const fs = require("fs-extra");
const uuid = require("uuid/v4");
var TurndownService = require("turndown");
const path = require("path");
const url = require("url");
const writing = require("./writing");

// Custom Styling for Command Line printing
const chalk = require("chalk");
const success = chalk.bold.green.inverse;
const log = console.log;
const progress = chalk.yellow;
const error = chalk.bold.red;

var parser = new xml2js.Parser();

/* *********** Turndown Initializing ********** */

var turndownService = new TurndownService({
  headingStyle: "atx",
  codeBlockStyle: "fenced"
});

// Pre tag => PrismJS for gatsby plugin
turndownService.addRule("pre-tags", {
  filter: "pre",
  replacement: function(content, node, options) {
    // Remove Escape Characters from String
    // created by TurndownService.prototype.escape
    // Unfortenately node is private in Turndown.js
    content = content.replace(/\\/g, "");

    // Check if there is a Newline character to make the comment inline
    if (content.split("\n").length > 1) {
      return "\n```\n" + `${content}` + "\n```\n";
    } else {
      return " `" + content + "` ";
    }
  }
});

// Code tag => PrismJS for gatsby plugin
turndownService.addRule("code-tags", {
  filter: "code",
  replacement: function(content) {
    // Check if there is a Newline character to make the comment inline
    if (content.split("\n").length > 1) {
      return "\n```\n" + `${content}` + "\n```\n";
    } else {
      return " `" + content + "` ";
    }
  }
});

// Strong tag fixes
turndownService.addRule("strong", {
  filter: "strong",
  replacement: function(content) {
    return "**" + content.trim() + "** ";
  }
});

/* ********************************************************** */

/* PrismJS
 * Here the function is taking as input the content of the post
 * plus the parsed version of it in order to search fast and with ease tags that contain code.
 * The tag I have seen so far are with the following format : <pre args... > ... </pre>
 * For extra tags feel free to make an issue or add them.
 * Previous work for Classes Extraction (If requested I should check it again)
 */
function prismJS(content, parsed) {
  const tags = parsed("pre").contents();

  for (let i = 0; i < tags.length; i++) {
    const classes = tags[i].parent.attribs.class;

    let language = "";

    if (classes != undefined) {
      language = classes.split(" ")[0].split(":")[1];
    }

    if (content.includes(tags[i].data)) {
      log(progress("Changing the codeblock."));

      const replaceString = "```" + `${language}\n${tags[i].data}\n` + "```";

      parsed("pre")
        .first()
        .replaceWith(replaceString);
    }
  }
  return parsed.text();
}

async function dataWrangle(data, destination) {
  // Iterate in every Post
  data.rss.channel[0].item.map((value, index) => {
    /* For every post I need
     * 1: Title
     * 2: Publish Date
     * 3: Creator
     * 4: Content
     */
    log(progress(`Currently Parsing Post No: ${index + 1}`));
    let content = value["content:encoded"][0];
    const title = value.title[0];
    const pubDate = moment(value.pubDate[0]).format("YYYY-MM-DD");
    const slug = value["wp:post_name"][0];

    // I am sure there must be an easier way and more concise here
    let categories = [];
    value.category.map(temp => categories.push(temp.$.nicename));
    categories = categories.join(",");
    // ////////////////////////////////

    let author = value["dc:creator"][0];

    const images = parseImages(content);
    images.forEach(image => {
      content = content.replace(image.url, image.fileName);
    });

    content = turndownService.turndown(content);

    // Header of every index.md
    const frontMatter = "---\n";
    const titleMD = `title: ${title}\n`;
    const date = `date: ${pubDate}\n`;
    author = `author: ${author}\n`;
    categories = `categories: ${categories}\n`;
    // /////////////////////
    const Output = [
      frontMatter,
      titleMD,
      date,
      author,
      categories,
      frontMatter,
      "\n",
      content
    ].join("");

    writing(Output,title, images, destination)
  });
}

/* parseImages(value)
 * value : The content of the post with all the tags inside
 * return : [{url: <URL of the image>, fileName: <The UUID name generated>},...]
 */

const parseImages = value => {
  const content = cheerio.load(value);
  const imagesElements = content("img");
  const images = imagesElements
    .map((index, item) => {
      const imageName = uuid();
      const imageUrl = item.attribs["src"];
      const imageExtension = path.extname(url.parse(imageUrl).pathname);
      return {
        url: imageUrl,
        fileName: `${imageName}${imageExtension}`
      };
    })
    .toArray();

  return images;
};

module.exports = { dataWrangle: dataWrangle };
