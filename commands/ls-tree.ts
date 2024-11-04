import path from "node:path";
import process from "node:process";
import fs from "node:fs";
import zlib from "node:zlib";
import Utils from "./utils/utils.ts";
import { TreeEntry } from "./types/types.ts";

class LSTreeCommand {
    flag: string | null
    commitSHA: string
    constructor(flag: string | null, commitSHA: string) {
        this.flag = flag
        this.commitSHA = commitSHA
    }
    execute() {
        const flag = this.flag
        const commitSHA = this.commitSHA

        const folder = commitSHA.slice(0, 2);
        const fileName = commitSHA.slice(2);

        const objectPath = path.join(process.cwd(), ".groot", "objects", folder, fileName);
      
        if (!fs.existsSync(objectPath)) {
          throw new Error(`Not a valid object name ${commitSHA}`);
        }

        const object = fs.readFileSync(objectPath);
        const bufferObject = zlib.inflateSync(object)
        const decompressedObject = bufferObject.toString('utf8');

        if(decompressedObject.slice(0,6).toString() === "commit"){
            const treeLine = decompressedObject.split('\n').find(line => line.startsWith("commit "));
            if (treeLine) {
                const treeSHA = treeLine.split(" ")[2];
                // Call execute on a new LSTreeCommand instance with the new treeSHA
                const treeCommand = new LSTreeCommand(this.flag, treeSHA);
                treeCommand.execute(); // Recursively call execute
                return; // Exit the current method after calling execute on the new instance
            }
        }
        if(flag === '--name-only'){
            const output = decompressedObject.split("\0");
            const treeContent = output.slice(1).filter(e=>e.includes(" "));
            const names = treeContent.map(e=>e.split(" ")[e.split(" ").length-1]);
            names.forEach(e=>process.stdout.write(e + "\n"));
        }else{
            const treeEntries = Utils.parseTreeObject(bufferObject);
            treeEntries.forEach((entry: TreeEntry) => {
                process.stdout.write(`${entry.mode} ${entry.type} ${entry.sha} ${entry.filename}\n`);
            })
        }
    }
}

export default LSTreeCommand;