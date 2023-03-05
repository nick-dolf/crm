const path = require("path");
const fse = require("fs-extra");
const upload = require("multer")();
const express = require("express");
const router = express.Router();
const app = require("../app");

/*
/ Important variables
*/
const pageDir = path.join(process.cwd(), "pages/");
const siteDir = app.locals.siteDir;

/*
/ Publish (POST)
*/
router.post("/:page", upload.none(), (req, res) => {
  const page = path.join(pageDir, req.params.page);

  // Update pages
  let pageInfo = {};
  app.locals.site.pages = app.locals.site.pages.filter((item) => {
    if (item.slug == req.params.page) {
      item.publishedDate = new Date().toString();
      pageInfo = item;
    }
    return item;
  });

  // Update drafts
  const draftData = fse.readJsonSync(
    pageDir + "drafts/" + req.params.page + ".json"
  );
  const pageData = {
    ...pageInfo,
    details: draftData.details,
    sections: draftData.sections,
  };
  fse.writeJsonSync(pageDir + "drafts/" + req.params.page + ".json", pageData);

  // Save Page Data to JSON
  fse
    .outputJson(pageDir + "published/" + req.params.page + ".json", pageData)
    .then(() => {
      let template = "default";
      if (req.body.template) template = pageData.template;

      app.render(
        `templates/${template}/site`,
        { page: pageData },
        (err, html) => {
          if (err) {
            console.error(err.message);
          } else {
            let destination = path.join(
              siteDir,
              pageData.permalink,
              "index.html"
            );

            fse
              .outputFile(destination, html)
              .then(() => {
                res.send(`${req.url}`);
              })
              .catch((err) => {
                console.error(err.message);
              });
          }
        }
      );
    })
    .catch((err) => {
      console.error(err.message);
      res.status(500).end();
    });
});

module.exports = router;
