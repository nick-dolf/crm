const path = require("path");
const fse = require("fs-extra");
const app = require("../app");
const express = require("express");
const router = express.Router();
const { body, validationResult } = require("express-validator");
const slugify = require("slugify");
const multer = require("multer");
const sharp = require("sharp");
const { processUploadImg } = require("./utils/imgProc");
router.use(express.urlencoded({ extended: true }));

// IMAGE DIRECTORIES
const imgDir = path.join(process.cwd(), "images");
const imgOgDir = imgDir + "/original";
fse.mkdirsSync(imgOgDir);

// IMAGE STORAGE WITH MULTER
var storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, imgOgDir);
  },
  filename: function (req, file, callback) {
    callback(null, niceImageName(file.originalname));
  },
});
var upload = multer({ storage: storage });

/*
/ Create (POST)
*/
router.post("/", upload.array("pic"), (req, res) => {
  Promise.all(
    req.files.map(async (file) => {
      const metadata = await sharp(file.path).metadata();

      const imageData = {
        name: file.filename,
        uploadEpochTime: Date.now(),
        modifiedEpochTime: "",
        height: metadata.height,
        width: metadata.width,
        og: { height: metadata.height, width: metadata.width },
      };
      app.locals.site.images[file.filename] = imageData;

      await processUploadImg(file.filename, imgOgDir);
    })
  )
    .then(() => {
      return fse.outputJson(imgDir + "/info.json", app.locals.site.images);
    })
    .then(() => {
      res.render("admin/parts/image-table");
    })
    .catch((err) => {
      console.error(err);
    });
});

/*
/ Read (GET)
*/
router.get("/*", (req, res) => {
  res.render("admin/images");
});

/*
 * Delete (DELETE)
 */
router.delete("/*", (req, res) => {
  const image = req.url.slice(1);

  if (app.locals.site.images[image]) {
    delete app.locals.site.images[image];
    fse.outputJson(imgDir + "/info.json", app.locals.site.images)

    fse.rm(imgOgDir+req.url)
    fse.rm(imgOgDir+"/thumb"+req.url)

    res.send(app.locals.site.images[image])
    
  } else {
    res.status(404).send("image not found");
  }
});

function niceImageName(imageFile) {
  const pathObject = path.parse(imageFile);

  let name = slugify(pathObject.name, {
    remove: /[*+~.()'"!/:@]/g,
    lower: true,
  });

  if (app.locals.site.images[imageFile]) {
    name += "-copy";
  }

  return name + pathObject.ext;
}

module.exports = router;
