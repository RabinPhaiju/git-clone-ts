import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import zlib from "node:zlib";

class CatFileCommand {
  flag: string;
  commitSHA: string;
  constructor(flag: string, commitSHA: string) {
    this.flag = flag;
    this.commitSHA = commitSHA;
  }

  execute() {
    const flag = this.flag;
    const commitSHA = this.commitSHA;

    switch (flag) {
      case "-p": {
        const folder = commitSHA.slice(0, 2);
        const fileName = commitSHA.slice(2);

        const objectPath = path.join(process.cwd(), ".git", "objects", folder, fileName);

        if (!fs.existsSync(objectPath)) {
          throw new Error(`Not a valid object name ${commitSHA}`);
        }

        const object = fs.readFileSync(objectPath);
        const decompressedObject = zlib.inflateSync(object).toString();
        // remove extra new line if exist
        const output = decompressedObject.split("\x00")[1];
        process.stdout.write(output);

        break;
      }
      default:
        throw new Error(`Unknown flag ${flag}`);
    }
  }
}

export default CatFileCommand;