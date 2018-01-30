# Contributing to Ayria Desktop
_**Thank you for your interest in contributing!** This document will outline the basics of where to start if you wish to contribute to the project. There are many ways to help us out and and we appreciate all of them. We look forward to **your contribution**!_

## Communication

### Chat
The quickest and most open way to **communicate with the Ayria team** is on our [**Discord channel**](https://discord.gg/Jg8NZDK).

### GitHub Issues
A bit more formal way of communication with fellow Ayria members, but a little less quick and convenient like the chat. Submit an issue when you run into problems or just would like to discuss a certain topic, be it _features, code style, code inconsistencies, minor changes and fixes, etc._

### Pull Requests
It’s fine to just submit a small pull request without first making an issue or asking in the chat unless if it’s a significant change that will require **planning and reviewing**. Also see [Creating a Pull Request](#creating-a-pr) and [Git Style Guidelines](#git-style-guidelines).

## Possible Contributions

### Design
If you’re a good designer, whether it’s _2D graphics, 3D graphics, interfaces, web design, you can help. We need screen designs, a consistent visual language, UI & UX design, icons, etc_.

### Technical
* **Testing the app**, filing issues for bugs and needed features
* **Desktop integration**, make sure the app plays well with the OS
* **App**, improve the JS code in ways you deem better
* **Bootstrap**, improve the [C++ bootstrap module](https://github.com/AyriaPublic/Bootstrapmodule_cpp)
* **Plugins**, create an Ayria game plugin
* Anything else, come chat with us!

### <a name=“creating-a-pr”> Creating a Pull Request </a>

**1**. _**Fork**_ and _**clone**_ the repository.

**2**. Install needed dependencies: `npm install`.

**3**. Create a _**separate branch**_: `git checkout -b my-branch`.

**4**. Start the application with `npm start`, _make changes_.

**6**. Run `npm run lint -- --fix`, making sure no conflicts remain.

**7**. **Commit**: `git add <changed files>; git commit` and write a commit message.

**8**. Push to **your fork**: `git push`.

**9**. Create a _pull request_ on GitHub and **submit**!

## Best Practices and Guidelines
### General
* **Make sure your code is readable and only has comments where needed.**
* **Don’t hesitate to ask for help, comments or suggestions!**
* **Before implementing something, discuss it! Open an issue, or ask in the chat.**

### Style Guidelines

### JavaScript
Besides the defined code style rules defined in the linter configuration the JavaScript code is following the functional paradigm. Meaning: pure functions, avoiding shared state, mutable data, and side-effects.

### <a name=“git-style-guidelines”> Git </a>
* When you start to make changes, you will want to create a separate branch, and keep the `master` branch of your fork identical to the main repository, so that you can compare your changes with the main branch and test out a more stable build if you need to.
* Usually, when syncing your local copy with the master branch, you’ll want to rebase instead of merge. This is because it will create duplicate commits that don’t actually do anything when merged into the master branch. You can do this in one command with `git pull upstream --rebase`. This will pull from the upstream, then roll back to the current state of the upstream, and “replay” your changes on top of it. Make sure you commit before doing this, though. Git won’t be able to rebase if you don’t.
* Prefer to omit the `-m` when using `git commit`. This opens your editor and should help get you in the habit of writing longer commit messages.
* Commit messages should describe their changes in present tense, e.g. `Add live reloading to game list` instead of `Added live reloading to game list`.
* Try to remove useless duplicate/merge commits from PRs as these don’t do anything except clutter up history and make it harder to read.
