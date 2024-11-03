import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import zlib from "node:zlib";
import Utils from "./utils/utils.ts";
import { TreeEntry } from "./types/types.ts";
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
        const bufferObject = zlib.inflateSync(object)
        const decompressedObject = bufferObject.toString('utf8');
        
        // check if the object is a tree
        if(decompressedObject.slice(0, 4).toString() === "tree"){
          // parse the tree object

          const treeEntries = Utils.parseTreeObject(bufferObject);
          treeEntries.forEach((entry: TreeEntry) => {
            process.stdout.write(`${entry.mode} ${entry.type} ${entry.sha} ${entry.filename}\n`);
          })
        }else{
          // remove extra new line if exist
          const output = decompressedObject.split("\x00");
          process.stdout.write(output.toString());

        }
        break;
      }
      default:
        throw new Error(`Unknown flag ${flag}`);
    }
  }

}

export default CatFileCommand;