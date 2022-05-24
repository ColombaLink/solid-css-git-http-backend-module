# [Community Solid Server (CSS)](https://github.com/CommunitySolidServer/CommunitySolidServer) [GIT](https://git-scm.com/) Converter Component ([Component.js](https://componentjs.com/))

[CSS](https://github.com/CommunitySolidServer/CommunitySolidServer) Module which allows requesting Git Objects from the CSS in any any available format.

To get started in seconds, clone the repo and:
```
npm i
npm start
```


Clients can make GET request to the CSS to retrieve Git Objects in all available formats.

Examples:

get content type = internal/quads

get content type = text/html



# Push 

requests: 

1. Every thing up to data.  
{
"GIT_PROJECT_ROOT": "/home/parfab00/Repositories/node-git-http-backend/dev",
"PATH_TRANSLATED": "/home/parfab00/Repositories/node-git-http-backend/dev/test.git/info/refs",
"PATH_INFO": "/test.git/info/refs",
"REQUEST_METHOD": "GET",
"GIT_HTTP_EXPORT_ALL": "1",
"QUERY_STRING": "service=git-receive-pack"
}

With changes: 
1. 
/test.git...... 
{
"GIT_PROJECT_ROOT": "/home/parfab00/Repositories/node-git-http-backend/dev/",
"PATH_TRANSLATED": "/home/parfab00/Repositories/node-git-http-backend/dev/test.git/info/refs",
"PATH_INFO": "/test.git/info/refs",
"REQUEST_METHOD": "GET",
"GIT_HTTP_EXPORT_ALL": "1",
"QUERY_STRING": "service=git-receive-pack"
}


2. 
{
"CONTENT_TYPE": "application/x-git-receive-pack-request",
"CONTENT_LENGTH": "408",
"GIT_PROJECT_ROOT": "/home/parfab00/Repositories/node-git-http-backend/dev",
"PATH_TRANSLATED": "/home/parfab00/Repositories/node-git-http-backend/dev/test.git/git-receive-pack",
"PATH_INFO": "/test.git/git-receive-pack",
"REQUEST_METHOD": "POST",
"GIT_HTTP_EXPORT_ALL": "1",
"QUERY_STRING": null
}


Not working headers: 

1. {
   "CONTENT_TYPE": "text/xml",
   "CONTENT_LENGTH": "166",
   "GIT_PROJECT_ROOT": "/home/parfab00/Repositories/colomba.link/dev/dybli/css/modules/css-git-http-backend-module/myData/test",
   "PATH_TRANSLATED": "/home/parfab00/Repositories/colomba.link/dev/dybli/css/modules/css-git-http-backend-module/myData/test/test/test.git/",
   "PATH_INFO": "/test/test.git/",
   "REQUEST_METHOD": "PROPFIND",
   "GIT_HTTP_EXPORT_ALL": "1",
   "QUERY_STRING": null
   }
   

