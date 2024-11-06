import { Buffer } from "node:buffer";
import path from "node:path";
import process from "node:process";
import fs from "node:fs";

interface IndexEntry {
    ctimeSeconds: number;
    ctimeNanoseconds: number;
    mtimeSeconds: number;
    mtimeNanoseconds: number;
    dev: number;
    ino: number;
    mode: number;
    uid: number;
    gid: number;
    fileSize: number;
    sha1: string;
    flags: number;
    filePath: string;
}

function readUInt32BE(buffer: Buffer, offset: number): number {
    return buffer.readUInt32BE(offset);
}

function readUInt16BE(buffer: Buffer, offset: number): number {
    return buffer.readUInt16BE(offset);
}

function readSHA1(buffer: Buffer, offset: number): string {
    return buffer.slice(offset, offset + 20).toString('hex');
}

function parseIndex(filePath: string): IndexEntry[] {
    const indexEntries: IndexEntry[] = [];
    const data = fs.readFileSync(filePath);

    // Check for the "DIRC" header
    const header = data.toString('utf8', 0, 4);
    if (header !== 'DIRC') {
        throw new Error('Not a valid Git index file.');
    }
    const version = readUInt32BE(data, 4);
    const entryCount = readUInt32BE(data, 8);

    console.log(`Header:`);
    console.log(`  Signature: ${header}`);
    console.log(`  Version: ${version}`);
    console.log(`  Entry Count: ${entryCount}`);

    let offset = 12;

    for (let i = 0; i < entryCount; i++) {
        const entry: IndexEntry = {
            ctimeSeconds: readUInt32BE(data, offset),
            ctimeNanoseconds: readUInt32BE(data, offset + 4),
            mtimeSeconds: readUInt32BE(data, offset + 8),
            mtimeNanoseconds: readUInt32BE(data, offset + 12),
            dev: readUInt32BE(data, offset + 16),
            ino: readUInt32BE(data, offset + 20),
            mode: readUInt32BE(data, offset + 24),
            uid: readUInt32BE(data, offset + 28),
            gid: readUInt32BE(data, offset + 32),
            fileSize: readUInt32BE(data, offset + 36),
            sha1: readSHA1(data, offset + 40),
            flags: readUInt16BE(data, offset + 60),
            filePath: ''
        };

        // Read the file path
        offset += 62;
        const pathOffset = offset;
        const endOfPath = data.indexOf(0, pathOffset);
           
        entry.filePath = data.toString('utf8', pathOffset, endOfPath);

        // Add to entries array
        indexEntries.push(entry);

        // Move to the next entry (pad to 8-byte boundary)
        offset = endOfPath +1;

        // After reading file path, we need to account for padding
        // Calculate the total length of the entry
        const entryLength = offset - (pathOffset - 62); // Length includes path and fixed fields

        // Ensure the next entry starts at an 8-byte aligned offset
        const paddingLength = (8 - entryLength % 8) % 8; // Padding needed to align the next entry

        // Skip over the padding
        offset += paddingLength;
    }

    return indexEntries;
}

function displayIndexEntries(entries: IndexEntry[]): void {
    entries.forEach((entry, index) => {
        console.log(`Entry ${index + 1}:`);
        console.log(`  File Path: ${entry.filePath}`);
        console.log(`  Mode: ${entry.mode.toString(8)}`);
        console.log(`  SHA-1: ${entry.sha1}`);
        console.log(`  Size: ${entry.fileSize}`);
        console.log(`  UID: ${entry.uid}`);
        console.log(`  GID: ${entry.gid}`);
        console.log('');
    });
}

function mainScript() {
    const indexPath = path.join(process.cwd(), '.git', 'index');
    if (fs.existsSync(indexPath)) {
        const entries = parseIndex(indexPath);
        displayIndexEntries(entries);
    } else {
        console.log('No .git/index file found. Are you in a Git repository?');
    }
}

export default mainScript;

