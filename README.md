# [Community Solid Server (CSS)](https://github.com/CommunitySolidServer/CommunitySolidServer) GIT-HTTP-Backend Module 



The Community Solid Server Git-Request-Handler Component (CSS-GRH-C) is a sub-module for the Community Solid Server, that can be integrated into the modulare structure of the [CSS](https://github.com/CommunitySolidServer/CommunitySolidServer) with help of the component.js dependency injection framework. Later during this description we will take up how this integration works in detail. In the following, a figure shows where this module is intrgrated to the Solid Architecture.

![Overview](./ClassDiagramOverviewGitHttpBackend.drawio.svg)

The standard [CSS](https://github.com/CommunitySolidServer/CommunitySolidServer) does not support [Git](https://git-scm.com/) commands, but applying the basic concept of Git with the default Solid Protocol primitives is possible. With this module the most important Git commands like cloning, fetching, pulling, pushing, and token authentification over the url, can be sent to the [CSS](https://github.com/CommunitySolidServer/CommunitySolidServer) over the HTTP protocol and will be handled.

### Running and Testing

To get started with this module, one can simply clone this repository and install the dependencies with ```npm i ```. The extended CSS can then be started with ```npm start```. 

To test some simple Git commands, first we need to create a new Git Repository. This can be done by switching to the myData folder and type: ```git init --bare myTestRepository.git```. The name can be chosen arbitrarely but the ending requieres to be **.git** . Now we need to go into the repository and change some configs to do so use ```git update-server-info ``` and ```git config http.receivepack true```. Now it is possible to clone this repo locally from any directory. With default settings it is possible to clone with an insecure Token by using ```git clone http://alice:insecureToken@localhost/myData/myTestRepository.git``` afterward you can use other git commands to make changes to the repository. For example create a new file and push it to the repository.

```
echo "hello world" > hello.txt
git add .
git commit -m "my commit message"
git push origin master
```

## Detailed Description

[CSS](https://github.com/CommunitySolidServer/CommunitySolidServer) Module which allows sending Git Commands to the CSS which are then Handled and passed on to the [node-git-http-backend](https://github.com/FUUbi/node-git-http-backend).

The module consists of two important classes. 

* *UrlDpopWebIdExtractor*: An Authentification handler which extracts authenification tokens from Urls. E.g. http://<strong>token-type:token</strong>@dybli.com

* *GitRequestHandler*: An LDP handler which checks if it is a Git request and handles it if so. 



## Integration into the Community Solid Server

This Module is intended to be intergrated into the backend of the CSS.

* *UrlDpopWebIdExtractor*: Is an Authentification handler an needs to be configured in config/ldp/authentification an Example configuration can be seen in the file urldpop-dpop-bearer.json

* *GitRequestHandler*: Is an Http handler an needs to be configured in config/http/handler an Example configuration can be seen in the backend under config/http/handler/git.json. The GitRequestHandler itself is defined an configured in config/http/handler/handlers/git-request-handler.json
