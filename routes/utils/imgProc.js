const sharp = require("sharp");
const fse = require("fs-extra");
const path = require("path");
const app = require("../../app");

// Image Directories
const imgDir = path.join(process.cwd(), "images/");
const siteDir = app.locals.siteDir;

async function processUploadImg(img, srcDir) {
  await fse.mkdirs(srcDir + "/thumb");

  sharp(srcDir + "/" + img)
    .resize({
      width: 300,
      height: 300,
      fit: "contain",
      background: "#FFF",
    })
    .toFile(srcDir + "/thumb/" + img);
}

async function publishImg(image, widths, imgDetails) {
  await fse.mkdirs(siteDir + "/assets/images/");

  let imgName = path.parse(image).name;

  const imageBuff = await sharp(imgDir + "original/" + image).toBuffer();

  for (width of widths) {
    sharp(imageBuff)
      .resize({ width: width })
      .jpeg()
      .toFile(
        `${siteDir}/assets/images/${imgName}-${imgDetails.uploadEpochTime}-${width}.jpg`
      );
    sharp(imageBuff)
      .resize({ width: width })
      .webp()
      .toFile(
        `${siteDir}/assets/images/${imgName}-${imgDetails.uploadEpochTime}-${width}.webp`
      );
  }
}

module.exports = { processUploadImg, publishImg };
