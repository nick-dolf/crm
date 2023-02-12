const path = require("path");
const fse = require("fs-extra");
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
const pageDir = path.join(process.cwd(), "pages/");

/*
/ Ensure needed files/directories exist
*/
try {
  fse.statSync(pageDir + "info.json");
  fse.statSync(pageDir + "home.json");
} catch {
  fse.writeJsonSync(pageDir + "info.json", {
    home: { name: "Home", slug: "home", permalink: "" },
  });
  fse.writeJsonSync(pageDir + "home.json", {
    name: "Home",
    slug: "home",
    permalink: "",
  });
}

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
    const pageData = {
      name: req.body.name,
      slug: slug,
      permalink: slug,
    };

    // Update page-info
    let pageInfo = fse.readJsonSync(pageDir + "info.json");
    pageInfo[slug] = pageData;
    fse.writeJsonSync(pageDir + "info.json", pageInfo);

    // Save Page Data to JSON
    fse
      .outputJson(pageDir + pageData.permalink + ".json", pageData)
      .then(() => {
        res.render("admin/parts/page-table", { page: { pages: pageInfo } });
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

      res.render("admin/" + template, {page: data});
    })
    .catch((err) => {
      console.error(err.message);
      res.status(404).end("page does not exist");
    });
});

/*
/ Update (PUT)
*/
router.put("/*", upload.none(), (req, res) => {
  const page = path.join(pageDir, req.url)
  console.log(page);
  // Save Page Data to JSON
  fse
    .outputJson(page + ".json", req.body)
    .then(() => {
      console.log(req.body)
      res.render("templates/default/admin",{page: req.body});
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

  let pageInfo = fse.readJsonSync(pageDir + "info.json");
  delete pageInfo[page];
  fse.writeJsonSync(pageDir + "info.json", pageInfo);

  fse
    .rm(pageDir + page + ".json")
    .then(() => {
      res.render("admin/parts/page-table", { page: { pages: pageInfo } });
    })
    .catch((err) => {
      console.error(err.message);
      res.status(500).end();
    });
});

module.exports = router;
