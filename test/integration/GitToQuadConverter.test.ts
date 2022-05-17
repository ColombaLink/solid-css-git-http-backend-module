'use strict';
import fetch from 'node-fetch';
import { GitObjectFactory } from '../../src/git/GitObjectFactory';
import fs from 'fs';
import { getDefaultVariables, getTestConfigPath, instantiateFromConfig, removeFolder } from './Config';

Object.defineProperty(exports, '__esModule', { value: true });
const port = 3_001;
const baseUrl = `http://localhost:${port}/`;
describe('GitToQuadConverter Integration Test', () => {
  let app: any;
  beforeAll(async() => {
    app = await instantiateFromConfig('urn:solid-server:default:App', getTestConfigPath('default.json'), getDefaultVariables(port, baseUrl));
    await app.start();
  });
  afterAll(async() => {
    await app.stop();
    removeFolder('.test-folder');
  });
  it(' int test', async() => {
    const path = '.test-folder';
    const arrayOfIds = await GitObjectFactory.createBasicGitObjects(path);

    // Define which object we want here [0][x] =blob [1][x]=tree [2][x] = commit
    const stringOfIDPrefix = arrayOfIds[0][0].toString();
    const pathToGit = `${path}/objects/${stringOfIDPrefix.slice(0, 2)}/${stringOfIDPrefix.slice(2)}`;
    const read = await fs.readFileSync(pathToGit);

    try {
      const put1 = await fetch(`${baseUrl}${pathToGit}`, {
        method: 'PUT',
        headers: {
          'content-type': 'application/octet-stream',
        },
        body: read,
      });

      console.log(put1.status);
    } catch (ex) {
      console.log(ex);
    }

    async function timeout(delay: number) {
      return new Promise(r => setTimeout(r, delay));
    }

    const getRes = await fetch(`${baseUrl}${pathToGit}`, {
      method: 'GET',
      headers: { accept: 'application/git' },
    });

    const contentType = getRes.headers.get('content-type');
    expect(contentType).toBe('application/git');
  });
});
