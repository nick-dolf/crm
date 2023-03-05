const PORT = 1337;
require("dotenv").config();
const path = require("path");
const fse = require("fs-extra");
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

// Basedir needed for absolute paths in templates
app.locals.basedir = app.get("views");

// Convert Markdown and sanitize the HTML
app.locals.md = (data) => {
  return sanitizeHtml(marked.parse(data));
};

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
/ Compile SASS
*/
const sass = require("sass");
const result = sass.compile("sass/main.scss");
fse.outputFile("site/css/style.css", result.css.toString()).catch((err) => {
  console.error(err);
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
