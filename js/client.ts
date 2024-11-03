class GitClient {
  run(command: { execute: () => void; }) {
    command.execute();
  }
}

export default GitClient
