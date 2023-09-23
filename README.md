# Variance

A Matrix client that aims to be user-friendly and provide an experience similar to Discord. It's based on [Cinny](https://github.com/cinnyapp/cinny).
- [Contributing](./CONTRIBUTING.md)

## Getting started
A web app is available at https://variance.matdoes.dev and is updated on every commit.

To host Variance on your own, build it with `yarn build` and serve the `dist/` directory. To set default Homeserver on login and register page, place a customized [`config.json`](config.json) in webroot of your choice.

## Local development
> We recommend using a version manager as versions change very quickly. You will likely need to switch
> between multiple Node.js versions based on the needs of different projects you're working on.
> [NVM on windows](https://github.com/coreybutler/nvm-windows#installation--upgrades) on Windows
> and [nvm](https://github.com/nvm-sh/nvm) on Linux/macOS are pretty good choices. Also recommended
> nodejs version Hydrogen LTS (v18).

Execute the following commands to start a development server:
```sh
yarn # Installs all dependencies
yarn dev # Serve a development version
```

To build the app:
```sh
yarn build # Compiles the app into the dist/ directory
```

### Running with Docker
This repository includes a Dockerfile, which builds the application from source and serves it with Nginx on port 80. To
use this locally, you can build the container like so:
```
docker build -t variance:latest .
```

You can then run the container you've built with a command similar to this:
```
docker run -p 8080:80 variance:latest
```

This will forward your `localhost` port 8080 to the container's port 80. You can visit the app in your browser by navigating to `http://localhost:8080`.
