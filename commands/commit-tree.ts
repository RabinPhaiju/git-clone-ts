import { Buffer } from "node:buffer";
import crypto from "node:crypto";
import Utils from "./utils/utils.ts";

class CommitTreeCommand {
    treeSha: string;
    commitSha: string;
    commitMessage: string;
    constructor(tree: string, commitSha: string, commitMessage: string) {
        this.treeSha = tree;
        this.commitSha = commitSha;
        this.commitMessage = commitMessage;
    }

    execute() {
        const commitMessageBuffer = Buffer.concat([
            Buffer.from(`tree ${this.treeSha}\n`, 'utf8'),
            Buffer.from(`parent ${this.commitSha}\n`, 'utf8'),
            Buffer.from(`author Rabin Phaiju <rabin@example.com> ${Date.now()} +0000\n`, 'utf8'),
            Buffer.from(`committer Rabin Phaiju <rabin@example.com> ${Date.now()} +0000\n\n`, 'utf8'),
            Buffer.from(`${this.commitMessage}\n`, 'utf8'),
        ]);

        const header = `commit ${commitMessageBuffer.length}\0`;
        const data = Buffer.concat([Buffer.from(header, 'utf8'), commitMessageBuffer]);
        const hash = crypto.createHash('sha1').update(data).digest('hex');

        Utils.writeObject(hash, data);

    }
}

export default CommitTreeCommand