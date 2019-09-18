const cheerio = require('cheerio');
const { get, findIndex } = require('lodash');
const chalk = require('chalk');
const moment = require('moment');
const TurndownService = require('turndown');
const writing = require('./writing');

const { log } = console;
const { yellow: progress } = chalk;

/* *********** Turndown Initializing ********** */

const turndownService = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced',
});

// Pre tag => PrismJS for gatsby plugin
turndownService.addRule('pre-tags', {
  filter: 'pre',
  replacement(value) {
    // Remove Escape Characters from String
    // created by TurndownService.prototype.escape
    // Unfortenately node is private in Turndown.js
    const content = value.replace(/\\/g, '');

    // Check if there is a Newline character to make the comment inline
    return content.split('\n').length > 1
      ? `\n\`\`\`\n${content}\n\`\`\`\n`
      : ` \`${content}\` `;
  },
});

// Code tag => PrismJS for gatsby plugin
turndownService.addRule('code-tags', {
  filter: 'code',
  replacement(content) {
    return content.split('\n').length > 1
      ? `\n\`\`\`\n${content}\n\`\`\`\n`
      : ` \`${content}\` `;
  },
});

// Strong tag fix es
turndownService.addRule('strong', {
  filter: 'strong',
  replacement(content) {
    return `**${content}**`;
  },
});

// Strong tag fixes
turndownService.addRule('span', {
  filter(node) {
    return node.nodeName === 'SPAN' && get(node, 'attributes[0].value');
  },
  replacement(content, node) {
    return `<span style="${node.attributes[0].value}">${content}</span>`;
  },
});

/* parseImages(value)
 * value : The content of the post with all the tags inside
 * return : [{url: <URL of the image>, fileName: <The UUID name generated>},...]
 */

const parseImages = value => {
  const content = cheerio.load(value);
  const imagesElements = content('img');
  const images = imagesElements
    .map((index, { attribs: { src: imageURL, ...rest } }) => ({
      fileName: imageURL.substring(imageURL.lastIndexOf('/') + 1),
      url: imageURL,
      ...rest,
    }))
    .toArray();
  return images;
};

const dataWrangle = async (data, destination) => {
  // Iterate in every Post
  data.rss.channel[0].item.map((post, index) => {
    log(progress(`Currently Parsing Post No: ${index + 1}`));

    const getMeta = (key, defaultMeta = undefined) => {
      const metaIndex = findIndex(
        post['wp:postmeta'],
        meta => meta['wp:meta_key'][0] === key,
      );
      return metaIndex !== -1
        ? get(post, `['wp:postmeta'][${metaIndex}]['wp:meta_value'][0]`)
        : defaultMeta;
    };

    let content = post['content:encoded'][0];
    let images = parseImages(content);
    images.forEach(image => {
      content = content.replace(
        new RegExp(image.url, 'g'),
        `./${image.fileName}`,
      );
    });

    const thumbnail = getMeta('essb_cached_image');
    images =
      thumbnail !== undefined
        ? [
            {
              url: thumbnail,
              fileName: thumbnail.substring(thumbnail.lastIndexOf('/') + 1),
            },
            ...images,
          ]
        : images;

    content = turndownService.turndown(content);

    const categories = post.category
      ? `[${post.category.map(
          (category, categoriesIndex) =>
            `${categoriesIndex > 0 ? ' ' : ''}"${category._}"`,
        )}]`
      : '';

    const header = {
      layout: 'post',
      title: `"${get(post, 'title[0]')}"`,
      image: thumbnail
        ? `./${thumbnail.substring(thumbnail.lastIndexOf('/') + 1)}`
        : undefined,
      author: get(post, `['dc:creator'][0]`),
      date: moment(get(post, 'pubDate[0]')).format(),
      categories,
      slug: get(post, `['wp:post_name'][0]`) || undefined,
      excerpt: get(post, `['excerpt:encoded'][0]`)
        ? `"${get(post, `['excerpt:encoded'][0]`)}"`
        : undefined,
      draft: get(post, `['wp:status'][0]`) !== 'publish',
      meta_title: `"${getMeta('_yoast_wpseo_title', get(post, 'title[0]'))}"`,
      twitter_shares: getMeta('essb_c_twitter'),
      facebook_shares: getMeta('essb_c_facebook'),
      kksr_ratings: getMeta('_kksr_ratings'),
      kksr_casts: getMeta('_kksr_casts'),
    };

    return writing(header, images, content, destination);
  });
};

module.exports = { dataWrangle };
