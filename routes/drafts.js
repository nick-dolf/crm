const path = require("path");
const fse = require("fs-extra");
const express = require("express");
const router = express.Router();

/*
/ Important variables
*/
const pageDir = path.join(process.cwd(), "pages/drafts/");

/*
/ Read (GET)
*/
router.get("/*", (req, res) => {
  const page = path.join(pageDir, req.url);
  console.log(page);

  fse
    .readJson(page + ".json")
    .then((data) => {
      let template = "default";
      if (data.template) template = data.template;
      console.log(data)
      res.render(`templates/${template}/site`, {page: data});
    })
    .catch((err) => {
      console.error(err.message);
      res.status(404).end("page does not exist");
    });
});

module.exports = router;
