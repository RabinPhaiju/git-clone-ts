import process from "node:process";
import fs from "node:fs";
import Utils from "./utils/utils.ts";

class WriteTreeCommand {
    flag: string | null
    constructor(flag: string | null = '-w') {
        this.flag = flag;
    }
    execute() {
        const filePath = process.cwd();
    
        const treeItems = fs.readdirSync(filePath);
        if(treeItems.length === 0)return; // ignore empty directories

        const treeHash = Utils.hashTree(filePath, this.flag);
        process.stdout.write(treeHash);
      }
}

export default WriteTreeCommand;