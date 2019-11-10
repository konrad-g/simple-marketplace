export class Upload {
  multer = require("multer");
  fs = require("fs");
  path = require("path");

  public build(folder = "uploads", maxFileSizeBytes = 1048576, maxFiles = 1) {
    const self = this;

    let baseDir = self.path.sep + "tmp";
    let targetDir = baseDir + self.path.sep + folder;

    // Create required directory
    self.createDirIfDontExist(baseDir);
    self.createDirIfDontExist(targetDir);

    var storage = self.multer.diskStorage({
      destination: function(req, file, cb) {
        cb(null, targetDir);
      },
      filename: function(req, file, cb) {
        cb(null, file.originalname);
      }
    });

    var upload = self.multer({
      storage: storage,
      limits: { fileSize: maxFileSizeBytes, files: maxFiles }
    });

    return upload;
  }

  createDirIfDontExist(dirPath: string) {
    if (!this.fs.existsSync(dirPath)) {
      this.fs.mkdirSync(dirPath);
    }
  }
}
