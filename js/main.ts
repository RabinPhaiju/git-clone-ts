import fs from "node:fs";
import path from "node:path";
import process from "node:process";

// Import the GitClient class
import GitClient from "./client.ts"

// Import the Command classes
import { CatFileCommand } from "./commands/index.ts";

const gitClient = new GitClient();

const command = process.argv[2];
switch (command) {
  case "init":
    createGitDirectory();
    break;

  case "cat-file":
    handleCatFileCommand();
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

