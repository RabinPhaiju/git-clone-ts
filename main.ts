import fs from "node:fs";
import path from "node:path";
import process from "node:process";

// Import the GitClient class
import GitClient from "./client.ts"

// Import the Command classes
import { CatFileCommand, HashObjectCommand,LSTreeCommand,WriteTreeCommand,CommitTreeCommand } from "./commands/index.ts";

const gitClient = new GitClient();

const command = process.argv[2];
switch (command) {
  case "init":
    createGitDirectory();
    break;

  case "cat-file":
    handleCatFileCommand();
    break;

  case "hash-object":
    handleHashObjectCommand();
    break;

  case "ls-tree":
    handleLsTreeCommand();
    break;

  case "write-tree":
    handleWriteTreeCommand();
    break;

  case "commit-tree":
    handleCommitTreeCommand();
    break;

  default:
    process.stderr.write(`Unknown command ${command}`);
}

function createGitDirectory() {
  fs.mkdirSync(path.join(process.cwd(), ".git"), { recursive: true });
  fs.mkdirSync(path.join(process.cwd(), ".git", "objects"), { recursive: true });
  fs.mkdirSync(path.join(process.cwd(), ".git", "refs"), { recursive: true });

  fs.writeFileSync(path.join(process.cwd(), ".git", "HEAD"), "ref: refs/heads/main\n");
  console.log("Initialized git directory");
}

function handleCatFileCommand() {
  const flag: string = process.argv[3];
  const commitSHA: string = process.argv[4];

  const command = new CatFileCommand(flag, commitSHA);
  gitClient.run(command);

}

function handleHashObjectCommand() {
  let flag: string | null = process.argv[3];
  let filePath: string = process.argv[4];

  if(!filePath){
    filePath = flag;
    flag = null;
  }

  const command = new HashObjectCommand(flag, filePath);
  gitClient.run(command);
}

function handleLsTreeCommand() {
  let flag: string | null = process.argv[3];
  let commitSHA: string = process.argv[4];

  if(!commitSHA && flag === "--name-only") return;

  if(!commitSHA){
    commitSHA = flag;
    flag = null;
  }

  const command = new LSTreeCommand(flag, commitSHA);
  gitClient.run(command);
}

function handleWriteTreeCommand() {
  const command = new WriteTreeCommand();
  gitClient.run(command);
}

function handleCommitTreeCommand() {
  const tree: string = process.argv[3];
  const commitSha: string = process.argv[5];
  const commitMessage: string = process.argv[7];
  const command = new CommitTreeCommand(tree, commitSha, commitMessage);
  gitClient.run(command);

}