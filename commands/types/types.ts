interface TreeEntry {
    mode: string;
    type: string;
    sha: string;
    filename: string;
  }

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

  export type { TreeEntry, IndexEntry };