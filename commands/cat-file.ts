import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import zlib from "node:zlib";

interface TreeEntry {
  mode: string;
  type: string;
  sha: string;
  filename: string;
}
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
          const treeEntries = this.parseTreeObject(bufferObject);
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

  // Helper function to parse a tree object
  parseTreeObject(data: Buffer): TreeEntry[] {
    const entries: TreeEntry[] = [];
    let offset = 0;
  
    // Skip "tree" header by moving to the first null byte
    while (data[offset] !== 0) offset++;
    offset++; // Move past the null byte
  
    while (offset < data.length) {
      // Parse mode
      let modeEnd = offset;
      while (data[modeEnd] !== 32) modeEnd++; // Find the space separator after mode
      const mode = data.toString('utf8', offset, modeEnd).padStart(6, '0');
      const type = mode === "040000" ? "tree" : (mode === "160000" ? "commit" : "blob");
  
      // Parse file name
      offset = modeEnd + 1; // Move past the space
      let filenameEnd = offset;
      while (data[filenameEnd] !== 0) filenameEnd++; // Find null terminator after filename
      const filename = data.toString('utf8', offset, filenameEnd);
  
      // Move past the null byte after filename
      offset = filenameEnd + 1;
  
      // Parse SHA (20 bytes in binary)
      const sha = data.slice(offset, offset + 20).toString('hex');
      offset += 20; // Move past the SHA
  
      // Store the entry
      entries.push({ mode, type, sha, filename });
    }
  
    return entries;
  }
  
}

export default CatFileCommand;