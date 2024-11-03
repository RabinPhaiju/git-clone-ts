import fs from "node:fs";
import path from "node:path";
import process from "node:process";

// Import the GitClient class

// Import the Command classes

const command = process.argv[2];
switch (command) {
  case "init":
    createGitDirectory();
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

