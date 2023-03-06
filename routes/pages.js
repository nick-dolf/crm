const path = require("path");
const fse = require("fs-extra");
const app = require("../app");
const express = require("express");
const router = express.Router();
const { body, validationResult } = require("express-validator");
const slugify = require("slugify");
const upload = require("multer")();
router.use(express.urlencoded({ extended: true }));

//router.use(express.json());

/*
/ Important variables
*/
const pageDir = path.join(process.cwd(), "pages/drafts/");
const publishedDir = path.join(process.cwd(), "pages/published/");
const siteDir = app.locals.siteDir;

/*
/ Create (POST)
*/
router.post(
  "/",
  body("name").isString().isLength({ min: 2 }).trim(),
  (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      console.log(errors);
      return res.status(400).json({ errors: errors.array() });
    }

    // Setup Page Data
    const slug = slugify(req.body.name, {
      remove: /[*+~.()'"!/:@]/g,
      lower: true,
    });

    // Check if page already exists
    if (
      req.app.locals.site.pages.some((item) => {
        return item.slug === slug;
      })
    ) {
      return res.status(403).send("Page with that name already exists");
    }

    const pageData = {
      name: req.body.name,
      slug: slug,
      permalink: slug,
      publishedDate: false,
      draftedDate: new Date().toString(),
    };

    // Update pages
    req.app.locals.site.pages.push(pageData);

    // Save Page Data to JSON
    fse
      .outputJson(pageDir + pageData.permalink + ".json", pageData)
      .then(() => {
        res.render("admin/parts/page-table", {
          page: { pages: req.app.locals.site.pages },
        });
      })
      .catch((err) => {
        console.error(err.message);
        res.status(500).end();
      });
  }
);

/*
/ Read (GET)
*/
router.get("/*", (req, res) => {
  const page = path.join(pageDir, req.url);

  fse
    .readJson(page + ".json")
    .then((data) => {
      let template = "default";
      if (data.template) template = data.template;

      res.render("admin/" + template, { page: data });
    })
    .catch((err) => {
      console.error(err.message);
      res.status(404).end("page does not exist");
    });
});

/*
/ Update (PUT)
*/
router.put("/:page", upload.none(), (req, res) => {
  const page = path.join(pageDir, req.params.page);

  // Update pages
  let pageInfo = {};
  req.app.locals.site.pages = req.app.locals.site.pages.filter((item) => {
    if (item.slug == req.params.page) {
      item.draftedDate = new Date().toString();
      pageInfo = item;
    }
    return item;
  });
  const pageData = { ...pageInfo, ...req.body };

  // Save Page Data to JSON
  fse
    .outputJson(page + ".json", pageData)
    .then(() => {
      res.render("templates/default/admin", { page: pageData });
    })
    .catch((err) => {
      console.error(err.message);
      res.status(500).end();
    });
});

/*
/ Delete (DELETE)
*/
router.delete("/:page", (req, res) => {
  const page = req.params.page;

  if (page === "home") {
    res.status(403).send("Home page may not be deleted");
    return;
  }

  let published = false;
  req.app.locals.site.pages = req.app.locals.site.pages.filter((item) => {
    if (item.slug == page && item.publishedDate) published = true;
    return item.slug != page;
  });

  fse
    .rm(pageDir + page + ".json")
    .then(() => {
      res.render("admin/parts/page-table", {
        page: { pages: req.app.locals.site.pages },
      });
    })
    .catch((err) => {
      console.error(err.message);
      res.status(500).end();
    });

  if (published) {
    fse.rm(publishedDir + page + ".json").catch((err) => {
      console.error(err.message);
      res.status(500).end();
    });

    fse.remove(siteDir + "/" + page).catch((err) => {
      console.error(err.message);
      res.status(500).end();
    });
  }
});

module.exports = router;
