import { Buffer } from "node:buffer";
import { TreeEntry } from "../types/types.ts";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import zlib from "node:zlib";
import crypto from "node:crypto";

class Utils {
    public static parseTreeObject(data: Buffer): TreeEntry[] {
        const entries: TreeEntry[] = [];
        let offset = 0;
    
        // Move offset past "tree" header by finding the first null byte
        while (data[offset] !== 0 && offset < data.length) offset++;
        offset++; // Move past the null byte
    
        while (offset < data.length) {
            // Parse mode
            let modeEnd = offset;
            while (data[modeEnd] !== 32 && modeEnd < data.length) modeEnd++; // Find the space separator after mode
            if (modeEnd >= data.length) {
                console.log("Error: Mode not terminated with space as expected.");
                break;
            }
            
            const mode = data.toString('utf8', offset, modeEnd).padStart(6, '0');
            const type = mode === "040000" ? "tree" : (mode === "160000" ? "commit" : "blob");
            
            // Parse file name
            offset = modeEnd + 1; // Move past the space
            let filenameEnd = offset;
            while (data[filenameEnd] !== 0 && filenameEnd < data.length) filenameEnd++; // Find null terminator after filename
            if (filenameEnd >= data.length) {
                console.log("Error: Filename not terminated with null byte as expected.");
                break;
            }
    
            const filename = data.toString('utf8', offset, filenameEnd);
            
            // Move past the null byte after filename
            offset = filenameEnd + 1;
            
            // Parse SHA (20 bytes in binary)
            if (offset + 20 > data.length) {
                console.log("Error: Not enough bytes for SHA.");
                break;
            }
            const sha = data.slice(offset, offset + 20).toString('hex');
            offset += 20; // Move past the SHA
            // Store the entry
            entries.push({ mode, type, sha, filename });
        }
        return entries;
    }
    

    public static hashFile(filePath: string,flag: string|null): string {
        // Function to hash a single file as a blob
        const fileContent = fs.readFileSync(filePath);
        const fileLength = fileContent.length;
    
        // Create blob
        const header = `blob ${fileLength}\0`;
        const blob = Buffer.concat([Buffer.from(header, 'utf8'), fileContent]);
    
        // Create hash
        const hash = crypto.createHash('sha1').update(blob).digest('hex');
    
        // If -w flag is set, store the blob
        if (flag === '-w') {
            this.writeObject(hash, blob, filePath);
        }
    
        return hash;
    }

    public static hashTree(dirPath: string,flag: string|null): string {
        // Function to hash a directory as a tree
        const entries: TreeEntry[] = [];

        // Read directory contents
        const items = fs.readdirSync(dirPath);
            for (const item of items) {
            // ignore .git | .groot directory
            if (item === '.groot' || item === '.git') continue;

            const itemPath = path.join(dirPath, item);
            const stat = fs.statSync(itemPath);

            if (stat.isFile()) {
                // Hash file and add to tree entries
                const sha = this.hashFile(itemPath, flag);
                entries.push({ mode: '100644', type: 'blob', sha, filename: item });
            } else if (stat.isDirectory()) {
                // Recursively hash subdirectory as a tree and add to entries
                const sha = this.hashTree(itemPath, flag);
                entries.push({ mode: '040000', type: 'tree', sha , filename: item });
            }else {
                continue;
            }
        }

        // Create tree object content
        const treeContent = entries.map(entry => 
            Buffer.concat([
                Buffer.from(`${entry.mode} ${entry.filename}\0`, 'utf8'),
                Buffer.from(entry.sha, 'hex')
            ])
        );

        // Prepend "tree" header
        const header = `tree ${treeContent.length}\0`;
        const treeObject = Buffer.concat([Buffer.from(header, 'utf8'), Buffer.concat(treeContent)]);

        // Hash the tree object
        const treeHash = crypto.createHash('sha1').update(treeObject).digest('hex');

        // If -w flag is set, store the tree object
        if (flag === '-w') {
            this.writeObject(treeHash, treeObject, dirPath);
        }

        return treeHash;
    }

    public static writeObject(hash: string, object: Buffer, filePath: string) {
        // Helper function to store an object
        const folder = hash.slice(0, 2);
        const fileName = hash.slice(2);
        const folderPath = path.join(process.cwd(), '.groot', 'objects', folder);

        if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
        }

        const compressedObject = zlib.deflateSync(object);
        fs.writeFileSync(path.join(folderPath, fileName), compressedObject);
        // TODO: add the file to staging area
        this.addToIndex(hash, filePath);
    }

    public static addToIndex(hash: string, filePath: string) {
        const indexPath = path.join(process.cwd(),".git", "index");
        const stat = fs.statSync(filePath);

        const ctimeSeconds = Math.floor(stat.ctimeMs / 1000);
        const ctimeNanoseconds = (stat.ctimeMs % 1000) * 1e6;
        const mtimeSeconds = Math.floor(stat.mtimeMs / 1000);
        const mtimeNanoseconds = (stat.mtimeMs % 1000) * 1e6;

        const dev = stat.dev;
        const ino = stat.ino;
        const mode = stat.mode;
        const uid = stat.uid;
        const gid = stat.gid;
        const fileSize = stat.size;

        const sha1 = Buffer.from(hash, "hex");

        // Flags: 0xFFF = max name length; other bits like assume-valid, etc., can be added later
        const flags = Math.min(filePath.length, 0xFFF);

        const pathBuffer = Buffer.from(filePath, "utf8");

        // Calculate entry length, ensuring alignment to an 8-byte boundary
        const entryLength = 62 + pathBuffer.length;
        const paddingLength = (8 - (entryLength % 8)) % 8;
        const padding = Buffer.alloc(paddingLength, 0);

        const entryBuffer = Buffer.alloc(entryLength + paddingLength);
        let offset = 0;

        // Write fields to the buffer
        entryBuffer.writeUInt32BE(ctimeSeconds, offset); offset += 4;
        entryBuffer.writeUInt32BE(ctimeNanoseconds, offset); offset += 4;
        entryBuffer.writeUInt32BE(mtimeSeconds, offset); offset += 4;
        entryBuffer.writeUInt32BE(mtimeNanoseconds, offset); offset += 4;
        entryBuffer.writeUInt32BE(dev, offset); offset += 4;
        entryBuffer.writeUInt32BE(ino, offset); offset += 4;
        entryBuffer.writeUInt32BE(mode, offset); offset += 4;
        entryBuffer.writeUInt32BE(uid, offset); offset += 4;
        entryBuffer.writeUInt32BE(gid, offset); offset += 4;
        entryBuffer.writeUInt32BE(fileSize, offset); offset += 4;
        sha1.copy(entryBuffer, offset); offset += 20;
        entryBuffer.writeUInt16BE(flags, offset); offset += 2;
        pathBuffer.copy(entryBuffer, offset); offset += pathBuffer.length;
        padding.copy(entryBuffer, offset);

        // Read existing index if it exists
        let indexBuffer = Buffer.alloc(0);
        try {
            indexBuffer = fs.readFileSync(indexPath);
        } catch (error: any) {
            if (error.code !== "ENOENT") throw error;
        }

        // Update header (update entry count in the index file)
        let newIndexBuffer;
        if (indexBuffer.length > 0) {
            const entryCount = indexBuffer.readUInt32BE(8) + 1;
            indexBuffer.writeUInt32BE(entryCount, 8);
            newIndexBuffer = Buffer.concat([indexBuffer, entryBuffer]);
        } else {
            // Create a new index file with a header
            const header = Buffer.alloc(12);
            header.write("DIRC", 0); // Signature
            header.writeUInt32BE(2, 4); // Version
            header.writeUInt32BE(1, 8); // Entry count
            newIndexBuffer = Buffer.concat([header, entryBuffer]);
        }

        // Write updated index to the file
        fs.writeFileSync(indexPath, newIndexBuffer);
    }

    public static fileExists(path: string): boolean {
        const stat = Deno.statSync(path);
        return stat.isFile || stat.isDirectory;
    }

}



export default Utils; 