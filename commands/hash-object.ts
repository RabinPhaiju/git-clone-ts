import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';
import zlib from 'node:zlib';
import { Buffer } from "node:buffer";
import process from "node:process";

class HashObjectCommand {
  flag: string | null;
  filePath: string;
  constructor(flag: string | null, filePath: string) {
    this.flag = flag;
    this.filePath = filePath;
  }

  execute() {
    const flag = this.flag;
    const filePath = this.filePath;

    if(!filePath){
      throw new Error("could not open '"+filePath+"' (No such file or directory)");
    }

    // read file
    const fileContent = fs.readFileSync(filePath);
    const fileLength = fileContent.length;

    // create blob
    const header = `blob ${fileLength}\0`;
    const blob = Buffer.concat([Buffer.from(header), fileContent]);
    
    // create hash
    const hash = crypto.createHash('sha1').update(blob).digest('hex');

    // if -w flag is set
    if(flag && flag === '-w'){
      const folder = hash.slice(0, 2);
      const fileName = hash.slice(2);
      const folderPath = path.join(process.cwd(), '.git', 'objects', folder);

      if(!fs.existsSync(folderPath)){
        fs.mkdirSync(folderPath, { recursive: true });
      }

      const compressedBlob = zlib.deflateSync(blob);
      fs.writeFileSync(path.join(folderPath, fileName), compressedBlob);
    }

    process.stdout.write(hash);
  }
}

export default HashObjectCommand;