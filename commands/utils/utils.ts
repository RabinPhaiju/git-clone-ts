import { Buffer } from "node:buffer";
import { TreeEntry } from "../types/types.ts";

class Utils {
    public static parseTreeObject(data: Buffer): TreeEntry[] {
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

export default Utils; 