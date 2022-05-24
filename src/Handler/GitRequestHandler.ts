import escapeStringRegexp from 'escape-string-regexp';
import type { HttpHandlerInput, HttpRequest } from '@solid/community-server';
import {
  HttpHandler,
  getLoggerFor,
  NotImplementedHttpError,
  BaseFileIdentifierMapper,
} from '@solid/community-server';

import { requestHandler, defaultConfig } from '@fuubi/node-git-http-backend';

/**
 * Handler that serves static resources on specific paths.
 * Relative file paths are assumed to be relative to cwd.
 * Relative file paths can be preceded by `@css:`, e.g. `@css:foo/bar`,
 * in case they need to be relative to the module root.
 */
export class GitRequestHandler extends HttpHandler {
  private readonly logger = getLoggerFor(this);

  /**
     * Creates a handler for the provided static resources.
     * @param assets - A mapping from URL paths to paths,
     *  where URL paths ending in a slash are interpreted as entire folders.
     * @param options - Cache expiration time in seconds.
     */
  public constructor() {
    super();
  }

  /**
     * Creates a regular expression that matches the URL paths.
     */
  private createPathMatcher(assets: Record<string, string>): RegExp {
    // Sort longest paths first to ensure the longest match has priority
    const paths = Object.keys(assets).sort((pathA, pathB): number => pathB.length - pathA.length);

    // Collect regular expressions for files and folders separately
    const files = ['.^'];
    const folders = ['.^'];
    for (const path of paths) {
      (path.endsWith('/') ? folders : files).push(escapeStringRegexp(path));
    }

    // Either match an exact document or a file within a folder (stripping the query string)
    return new RegExp(`^(?:(${files.join('|')})|(${folders.join('|')})([^?]+))(?:\\?.*)?$`, 'u');
  }

  public async gitRegexFinder({ url }: HttpRequest): Promise<boolean> {
    const exp = /\/*.git\/$/u;
    const match = exp.exec(url ?? '');
    if (!match) {
      return false;
    }
    return true;
  }

  public async canHandle({ request }: HttpHandlerInput): Promise<void> {
    if (request.method !== 'GET' && request.method !== 'POST') {
      throw new NotImplementedHttpError('Only GET and HEAD requests are supported');
    }
    const isGit = await this.gitRegexFinder(request);
    if (!isGit) {
      throw new NotImplementedHttpError('Not Git');
    }
  }

  public async handle({ request, response }: HttpHandlerInput): Promise<void> {
    // Determine the asset to serve
    const rex = await this.gitRegexFinder(request);
    // eslint-disable-next-line @typescript-eslint/no-base-to-string, no-console
    console.log('is is git request ?');
    // eslint-disable-next-line @typescript-eslint/no-base-to-string, no-console
    console.log(rex);

    if (request.method === 'POST' && rex) {
      // eslint-disable-next-line @typescript-eslint/no-base-to-string, no-console
      console.log(`GitRequestHandler handle POST`);
      //
      const fileMapper = new BaseFileIdentifierMapper('http://localhost:3000', 'C:/Users/timoc/Desktop/css-git-http-backend-module/myData/');
      const filePath = await fileMapper.mapUrlToFilePath({ path: `${request.url}` }, false);
      // eslint-disable-next-line @typescript-eslint/no-base-to-string, no-console
      console.log(filePath);
      const config = defaultConfig('C:\\Program Files\\Git\\mingw64\\libexec\\git-core\\git-http-backend', 'C:\\Users\\timoc\\Desktop\\css-git-http-backend-module\\myData\\test_folder/');
      const gitBackendHandler = requestHandler(config);
      gitBackendHandler(request, response);
    }
    if (request.method === 'GET' && rex) {
      // eslint-disable-next-line @typescript-eslint/no-base-to-string, no-console
      console.log(`GitRequestHandler handle GET ${request.url}`);
      const fileMapper = new BaseFileIdentifierMapper('http://localhost:3000', 'C:/Users/timoc/Desktop/css-git-http-backend-module/myData/');
      const filePath = await fileMapper.mapUrlToFilePath({ path: `http://localhost:3000${request.url}` }, false);
      // eslint-disable-next-line @typescript-eslint/no-base-to-string, no-console
      console.log(filePath);
      const config = defaultConfig('C:\\Program Files\\Git\\mingw64\\libexec\\git-core\\git-http-backend', 'C:\\Users\\timoc\\Desktop\\css-git-http-backend-module\\myData\\repo.git');
      const gitBackendHandler = requestHandler(config);
      gitBackendHandler(request, response);
    }

    // eslint-disable-next-line @typescript-eslint/no-base-to-string, no-console
    console.log(`handle GitHandler  end ${rex}`);
    response.end();
  }
}
