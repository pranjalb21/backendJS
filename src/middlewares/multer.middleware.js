const multer = require("multer");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/temp");
  },
  filename: function (req, file, cb) {
    const modFileName =
      Date.now() +
      "." +
      file.originalname.split(".")[file.originalname.split('.').length - 1];
    cb(null, modFileName);
  },
});
const upload = multer({ storage });

module.exports = upload;
