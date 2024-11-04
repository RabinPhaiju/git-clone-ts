import fs from 'node:fs';
import process from "node:process";
import Utils from "./utils/utils.ts";

class HashObjectCommand {
  flag: string | null;
  filePath: string;

  constructor(flag: string | null, filePath: string) {
    this.flag = flag;
    this.filePath = filePath;
  }

  execute() {
    const filePath = this.filePath;

    if (!fs.existsSync(filePath)) {
      throw new Error("Could not open '" + filePath + "' (No such file or directory)");
    }

    const stat = fs.statSync(filePath);

    if (stat.isFile()) {
      // Process a single file
      const hash = Utils.hashFile(filePath, this.flag);
      process.stdout.write(hash);
    } else if (stat.isDirectory()) {
      // Process a directory (create a tree object)
      const treeItems = fs.readdirSync(filePath);
      if(treeItems.length === 0)return; // ignore empty directories

      const treeHash = Utils.hashTree(filePath, this.flag);
      process.stdout.write(treeHash);
    }
  }

}

export default HashObjectCommand;
