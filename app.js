const PORT = 1337;
require("dotenv").config();
const path = require("path");
const fse = require("fs-extra");
const { createGzip } = require("zlib");
const marked = require("marked");
marked.setOptions({ breaks: true });
const sanitizeHtml = require("sanitize-html");
const express = require("express");
const app = express();
module.exports = app;

console.log("\n--\nTree Rat CMS Starting\n--");

/*
/ Site Configuration
*/
const config = fse.readJsonSync("config.json");
const pageDir = path.join(process.cwd(), "pages/");
const imageDir = path.join(process.cwd(), "images/");

// Ensure needed files/directories exist
try {
  fse.statSync(pageDir + "drafts/home.json");
} catch {
  fse.ensureDirSync(pageDir + "drafts");
  fse.ensureDirSync(pageDir + "published");
  fse.writeJsonSync(pageDir + "drafts/home.json", {
    name: "Home",
    slug: "home",
    permalink: "",
    publishedDate: false,
    draftedDate: new Date().toString(),
  });
}

// Global site variable available to template engine
app.locals.site = {};
app.locals.siteDir = path.join(process.cwd(), config.siteDir);
app.locals.site.pages = fse.readdirSync(pageDir + "drafts").map((entry) => {
  const pageEntry = fse.readJsonSync(pageDir + "drafts/" + entry);
  return {
    name: pageEntry.name,
    slug: pageEntry.slug,
    permalink: pageEntry.permalink,
    publishedDate: pageEntry.publishedDate,
    draftedDate: new Date().toString(),
  };
});
app.locals.site.sections = fse.readdirSync(app.get("views") + "/sections");
app.locals.site.blocks = fse.readdirSync(app.get("views") + "/blocks");
try {
  app.locals.site.images = fse.readJsonSync(imageDir + "info.json");
} catch (err) {
  app.locals.site.images = {};
  console.error(err.message);
}

// Section Includes
let sectionAdminIncludes = app.locals.site.sections
  .map((section) => {
    return `include /sections/${section}/admin`;
  })
  .join("\n");

fse.outputFileSync(
  app.get("views") + "/admin/section-helper/includes.pug",
  sectionAdminIncludes
);

let sectionSiteIncludes = app.locals.site.sections
  .map((section) => {
    return `include /sections/${section}/site`;
  })
  .join("\n");

fse.outputFileSync(
  app.get("views") + "/section-helper/includes.pug",
  sectionSiteIncludes
);

let sectionSassIncludes = app.locals.site.sections
  .map((section) => {
    return `@import "../../views/sections/${section}/${section}.scss";`;
  })
  .join("\n");

fse.outputFileSync(
  path.join(process.cwd() + "/sass/sections/includes.scss"),
  sectionSassIncludes
);

console.log(app.locals.site.sections);

// Block Includes
let blockAdminIncludes = app.locals.site.blocks
  .map((block) => {
    return `include /blocks/${block}/admin`;
  })
  .join("\n");

fse.outputFileSync(
  app.get("views") + "/admin/block-helper/includes.pug",
  blockAdminIncludes
);

let blockSiteIncludes = app.locals.site.blocks
  .map((block) => {
    return `include /blocks/${block}/site`;
  })
  .join("\n");

fse.outputFileSync(
  app.get("views") + "/block-helper/includes.pug",
  blockSiteIncludes
);

let blockSassIncludes = app.locals.site.blocks
  .map((block) => {
    return `@import "../../views/blocks/${block}/${block}.scss";`;
  })
  .join("\n");

fse.outputFileSync(
  path.join(process.cwd() + "/sass/blocks/includes.scss"),
  blockSassIncludes
);

// Basedir needed for absolute paths in templates
app.locals.basedir = app.get("views");

// Convert Markdown and sanitize the HTML
app.locals.md = (data) => {
  return sanitizeHtml(marked.parse(data));
};

app.locals.round = (num) => {
  return Math.round(num);
};

app.locals.publishImg = require("./routes/utils/imgProc").publishImg;

// Remove old site directory
fse.removeSync("site");

/*
/ Environments (Development, Staging, Production)
*/
if (process.env.NODE_ENV === "development") {
  console.log("Environment: Development");

  // Make HTML easy to read in development
  app.locals.pretty = true;

  // Live Reload
  const livereload = require("livereload");
  const liveReloadServer = livereload.createServer();
  liveReloadServer.watch(path.join(__dirname, "site"));

  const connectLivereload = require("connect-livereload");
  app.use(connectLivereload());

  liveReloadServer.server.once("connection", () => {
    setTimeout(() => {
      liveReloadServer.refresh("/");
    }, 100);
  });

  // On production this will be served by NGINX
  app.use(express.static("site"));

  // Environment Specific
  app.locals.site.baseURL = "/";

  // Log request
  app.use("/", (req, res, next) => {
    console.log(req.method, req.url);
    next();
  });
}

/*
/ Copy Assets
*/
fse.copy("assets/fonts", "site/assets/fonts").catch((err) => {
  console.error(err);
});
fse
  .copy("assets/svg/sprites.svg", "site/assets/svg/sprites.svg")
  .then(() => {
    compressFile("site/assets/svg/sprites.svg");
  })
  .catch((err) => {
    console.error(err);
  });
fse
  .copy("assets/svg/favicon.svg", "site/favicon.svg")
  .then(() => {
    compressFile("site/favicon.svg");
  })
  .catch((err) => {
    console.error(err);
  });

/*
/ Compile SASS
*/
const autoprefixer = require("autoprefixer");
const postcss = require("postcss");
const sass = require("sass");
const result = sass.compile("sass/main.scss", { style: "compressed" });

postcss([autoprefixer])
  .process(result.css, { from: undefined })
  .then((result) => {
    result.warnings().forEach((warn) => {
      console.warn(warn.toString());
    });

    fse
      .outputFile("site/assets/css/style.css", result.css.toString())
      .then(() => {
        compressFile("site/assets/css/style.css");
      })
      .catch((err) => {
        console.error(err);
      });
  });

/*
/ Setup template Engine
*/
app.set("view engine", "pug");

/*
/ Build Published pages
*/
app.locals.site.pages.forEach((page) => {
  if (page.publishedDate) {
    fse
      .readJson(pageDir + "published/" + page.slug + ".json")
      .then((data) => {
        let template = "default";
        if (data.template) template = data.template;

        app.render(
          `templates/${template}/site`,
          { page: data },
          (err, html) => {
            if (err) {
              console.error(err.message);
            } else {
              let destination = path.join(
                app.locals.siteDir,
                data.permalink,
                "index.html"
              );

              fse
                .outputFile(destination, html)
                .then(() => [compressFile(destination)])
                .catch((err) => {
                  console.error(err.message);
                });
            }
          }
        );
      })
      .catch((err) => {
        console.error(err.message);
      });
  }
});

/*
/ Admin Route
*/
app.use("/admin", require("./routes/admin"));

app.listen(PORT, () => {
  console.log(`listening on port: ${PORT}...`);
});

function compressFile(filePath) {
  const stream = fse.createReadStream(filePath);
  stream
    .pipe(createGzip({ level: 9 }))
    .pipe(fse.createWriteStream(`${filePath}.gz`))
    .on("finish", () =>
      console.log(`Successfully compressed the file at ${filePath}`)
    );
}
