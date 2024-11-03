import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';
import zlib from 'node:zlib';
import { Buffer } from "node:buffer";
import process from "node:process";

interface TreeEntry {
  mode: string;
  type: string;
  sha: string;
  filename: string;
}

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
      const hash = this.hashFile(filePath);
      process.stdout.write(hash);
    } else if (stat.isDirectory()) {
      // Process a directory (create a tree object)
      const treeHash = this.hashTree(filePath);
      process.stdout.write(treeHash);
    }
  }

  // Function to hash a single file as a blob
  hashFile(filePath: string): string {
    const fileContent = fs.readFileSync(filePath);
    const fileLength = fileContent.length;

    // Create blob
    const header = `blob ${fileLength}\0`;
    const blob = Buffer.concat([Buffer.from(header), fileContent]);

    // Create hash
    const hash = crypto.createHash('sha1').update(blob).digest('hex');

    // If -w flag is set, store the blob
    if (this.flag === '-w') {
      this.writeObject(hash, blob);
    }

    return hash;
  }

  // Function to hash a directory as a tree
  hashTree(dirPath: string): string {
    const entries: TreeEntry[] = [];

    // Read directory contents
    const items = fs.readdirSync(dirPath);
    for (const item of items) {
      const itemPath = path.join(dirPath, item);
      const stat = fs.statSync(itemPath);

      if (stat.isFile()) {
        // Hash file and add to tree entries
        const sha = this.hashFile(itemPath);
        entries.push({ mode: '100644', type: 'blob', sha, filename: item });
      } else if (stat.isDirectory()) {
        // Recursively hash subdirectory as a tree and add to entries
        const sha = this.hashTree(itemPath);
        entries.push({ mode: '040000', type: 'tree', sha, filename: item });
      }
    }

    // Create tree object content
    const treeContent = entries
      .map(entry => `${entry.mode} ${entry.type} ${entry.filename}\0${Buffer.from(entry.sha, 'hex')}`)
      .join('');

    // Prepend "tree" header
    const header = `tree ${Buffer.byteLength(treeContent)}\0`;
    const treeObject = Buffer.concat([Buffer.from(header), Buffer.from(treeContent)]);

    // Hash the tree object
    const treeHash = crypto.createHash('sha1').update(treeObject).digest('hex');

    // If -w flag is set, store the tree object
    if (this.flag === '-w') {
      this.writeObject(treeHash, treeObject);
    }

    return treeHash;
  }

  // Helper function to store an object
  writeObject(hash: string, object: Buffer) {
    const folder = hash.slice(0, 2);
    const fileName = hash.slice(2);
    const folderPath = path.join(process.cwd(), '.git', 'objects', folder);

    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }

    const compressedObject = zlib.deflateSync(object);
    fs.writeFileSync(path.join(folderPath, fileName), compressedObject);
  }
}

export default HashObjectCommand;
