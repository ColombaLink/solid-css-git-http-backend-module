# [Community Solid Server (CSS)](https://github.com/CommunitySolidServer/CommunitySolidServer) GIT-Request-Handler Component ([Component.js](https://componentjs.com/))

## General Description

[CSS](https://github.com/CommunitySolidServer/CommunitySolidServer) Module which allows sending Git Commands to the CSS which are then Handled and passed on to the [node-git-http-backend](https://github.com/FUUbi/node-git-http-backend).

The module consists of two important classes. 

* *UrlDpopWebIdExtractor*: An Authentification handler which extracts authenification tokens from Urls. E.g. http://<strong>token-type:token</strong>@dybli.com

* *GitRequestHandler*: An LDP handler which checks if it is a Git request and handles it if so. 

## Getting Started

To get started in seconds, clone the repo and:
```
npm i
npm start
```


Clients can clone and push to Git Repositories saved on the CSS

Examples:

git clone http://localhost:3000/repositories/myRepo.git/


## Integration into the Community Solid Server

This Module is intended to be intergrated into the backend of the CSS.

* *UrlDpopWebIdExtractor*: Is an Authentification handler an needs to be configured in config/ldp/authentification an Example configuration can be seen in the file urldpop-dpop-bearer.json

* *GitRequestHandler*: Is an Http handler an needs to be configured in config/http/handler an Example configuration can be seen in the backend under config/http/handler/git.json. The GitRequestHandler itself is defined an configured in config/http/handler/handlers/git-request-handler.json
