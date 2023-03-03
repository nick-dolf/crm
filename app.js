const PORT = 1337;
require("dotenv").config();
const express = require("express");
const app = express();
module.exports = app;
const path = require("path");
const fse = require("fs-extra");

console.log("\n--\nCRM Starting\n--");

/*
/ Site Configuration
*/
const config = fse.readJsonSync("config.json");
const pageDir = path.join(process.cwd(), "pages/");

// Ensure needed files/directories exist
try {
  fse.statSync(pageDir + "home.json");
} catch {
  fse.writeJsonSync(pageDir + "home.json", {
    name: "Home",
    slug: "home",
    permalink: "",
    published: new Date().toString(),
  });
}

// Global site variable available to template engine
app.locals.site = {};
app.locals.site.pages = fse.readdirSync(pageDir).map((entry) => {
  const pageEntry = fse.readJsonSync(pageDir + entry);
  return {
    name: pageEntry.name,
    slug: pageEntry.slug,
    permalink: pageEntry.permalink,
    published: pageEntry.published,
  };
});
app.locals.site.sections = fse.readdirSync(app.get("views") + "/sections");
let sectionIncludes = app.locals.site.sections
  .map((section) => {
    return `include /sections/${section}/admin`;
  })
  .join("\n");


fse.outputFileSync(
  app.get("views") + "/admin/section-helper/includes.pug",
  sectionIncludes
);

// Basedir needed for absolute paths in templates
app.locals.basedir = app.get("views");

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
/Setup template Engine
*/
app.set("view engine", "pug");

// app.render(
//   "templates/default/site",
//   { page: { title: "test" } },
//   (err, html) => {
//     if (err) {
//       console.error(err);
//     } else {
//       fse.outputFile("site/index.html", html).catch((err) => {
//         console.error(err);
//       });
//     }
//   }
// );

/*
/ Admin Route
*/
app.use("/admin", require("./routes/admin"));

app.listen(PORT, () => {
  console.log(`listening on port: ${PORT}...`);
});
