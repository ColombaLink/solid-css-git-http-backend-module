import fs from 'fs';
import {
  RegexBasedExtensionMapper,
} from '../../src/storage/mapping/RegexBasedExtensionMapper';
import {
  BadRequestHttpError,
  NotFoundHttpError,
  NotImplementedHttpError,
  trimTrailingSlashes,
} from '@solid/community-server';

jest.mock('fs');

describe('An RegexBasedMapper', (): void => {
  const base = 'http://test.com/';
  const rootFilepath = 'uploads/';
  const regex = '\\/\\w\\w\\/\\w{38}$';
  const contentTypeOfRegex = 'application/git';
  const mapper = new RegexBasedExtensionMapper(base, rootFilepath, regex, contentTypeOfRegex);
  let fsPromises: Record<string, jest.Mock>;

  beforeEach(async(): Promise<void> => {
    jest.clearAllMocks();
    fs.promises = {
      readdir: jest.fn(),
    } as any;
    fsPromises = fs.promises as any;
  });

  describe('mapUrlToFilePath', (): void => {
    it('throws 404 if the input path does not contain the base.', async(): Promise<void> => {
      await expect(mapper.mapUrlToFilePath({ path: 'invalid' }, false)).rejects.toThrow(NotFoundHttpError);
    });

    it('throws 404 if the relative path does not start with a slash.', async(): Promise<void> => {
      const result = mapper.mapUrlToFilePath({ path: `${trimTrailingSlashes(base)}test` }, false);
      await expect(result).rejects.toThrow(BadRequestHttpError);
      await expect(result).rejects.toThrow('URL needs a / after the base');
    });

    it('throws 400 if the input path contains relative parts.', async(): Promise<void> => {
      const result = mapper.mapUrlToFilePath({ path: `${base}test/../test2` }, false);
      await expect(result).rejects.toThrow(BadRequestHttpError);
      await expect(result).rejects.toThrow('Disallowed /.. segment in URL');
    });

    it('returns the corresponding file path for container identifiers.', async(): Promise<void> => {
      await expect(mapper.mapUrlToFilePath({ path: `${base}container/` }, false)).resolves.toEqual({
        identifier: { path: `${base}container/` },
        filePath: `${rootFilepath}container/`,
        isMetadata: false,
      });
    });

    it('rejects URLs that end with "$.{extension}".', async(): Promise<void> => {
      const result = mapper.mapUrlToFilePath({ path: `${base}test$.txt` }, false);
      await expect(result).rejects.toThrow(NotImplementedHttpError);
      await expect(result).rejects.toThrow('Identifiers cannot contain a dollar sign before their extension');
    });

    it('determines content-type by extension when looking in a folder that does not exist.', async(): Promise<void> => {
      fsPromises.readdir.mockImplementation((): void => {
        throw new Error('does not exist');
      });
      await expect(mapper.mapUrlToFilePath({ path: `${base}no/test.txt` }, false)).resolves.toEqual({
        identifier: { path: `${base}no/test.txt` },
        filePath: `${rootFilepath}no/test.txt`,
        contentType: 'text/plain',
        isMetadata: false,
      });
    });

    it('determines content-type by extension when looking for a file that does not exist.', async(): Promise<void> => {
      fsPromises.readdir.mockReturnValue(['test.ttl']);
      await expect(mapper.mapUrlToFilePath({ path: `${base}test.txt` }, false)).resolves.toEqual({
        identifier: { path: `${base}test.txt` },
        filePath: `${rootFilepath}test.txt`,
        contentType: 'text/plain',
        isMetadata: false,
      });
    });

    it('determines the content-type based on the extension.', async(): Promise<void> => {
      fsPromises.readdir.mockReturnValue(['test.txt']);
      await expect(mapper.mapUrlToFilePath({ path: `${base}test.txt` }, false)).resolves.toEqual({
        identifier: { path: `${base}test.txt` },
        filePath: `${rootFilepath}test.txt`,
        contentType: 'text/plain',
        isMetadata: false,
      });
    });

    it('determines the content-type correctly for metadata files.', async(): Promise<void> => {
      fsPromises.readdir.mockReturnValue(['test.meta']);
      await expect(mapper.mapUrlToFilePath({ path: `${base}test` }, true)).resolves.toEqual({
        identifier: { path: `${base}test` },
        filePath: `${rootFilepath}test.meta`,
        contentType: 'text/turtle',
        isMetadata: true,
      });
    });
    //
    // It('matches even if the content-type does not match the extension.', async(): Promise<void> => {
    // fsPromises.readdir.mockReturnValue([ 'test.txt$.ttl' ]);
    // await expect(mapper.mapUrlToFilePath({ path: `${base}test.txt` }, false)).resolves.toEqual({
    //     identifier: { path: `${base}test.txt` },
    //     filePath: `${rootFilepath}test.txt$.ttl`,
    //     contentType: 'text/turtle',
    //     isMetadata: false,
    // });
    // });
    //
    it('generates a file path if the content-type was provided.', async(): Promise<void> => {
      await expect(mapper.mapUrlToFilePath({ path: `${base}test.txt` }, false, 'text/plain')).resolves.toEqual({
        identifier: { path: `${base}test.txt` },
        filePath: `${rootFilepath}test.txt`,
        contentType: 'text/plain',
        isMetadata: false,
      });
    });

    it('adds an extension if the given extension does not match the given content-type.', async(): Promise<void> => {
      await expect(mapper.mapUrlToFilePath({ path: `${base}test.txt` }, false, 'text/turtle')).resolves.toEqual({
        identifier: { path: `${base}test.txt` },
        filePath: `${rootFilepath}test.txt$.ttl`,
        contentType: 'text/turtle',
        isMetadata: false,
      });
    });

    it('throws 501 if the given content-type is not recognized.', async(): Promise<void> => {
      const result = mapper.mapUrlToFilePath({ path: `${base}test.txt` }, false, 'fake/data');
      await expect(result).rejects.toThrow(NotImplementedHttpError);
      await expect(result).rejects.toThrow('Unsupported content type fake/data');
    });

    it('supports custom types.', async(): Promise<void> => {
      const customMapper = new RegexBasedExtensionMapper(base, rootFilepath, regex, contentTypeOfRegex, { cstm: 'text/custom' });
      await expect(customMapper.mapUrlToFilePath({ path: `${base}test.cstm` }, false)).
        resolves.toEqual({
          identifier: { path: `${base}test.cstm` },
          filePath: `${rootFilepath}test.cstm`,
          contentType: 'text/custom',
          isMetadata: false,
        });
    });

    it('supports custom extensions.', async(): Promise<void> => {
      const customMapper = new RegexBasedExtensionMapper(base, rootFilepath, regex, contentTypeOfRegex, { cstm: 'text/custom' });
      await expect(customMapper.mapUrlToFilePath({ path: `${base}test` }, false, 'text/custom')).
        resolves.toEqual({
          identifier: { path: `${base}test` },
          filePath: `${rootFilepath}test$.cstm`,
          contentType: 'text/custom',
          isMetadata: false,
        });
    });
  });

  describe('mapFilePathToUrl', (): void => {
    it('throws an error if the input path does not contain the root file path.', async(): Promise<void> => {
      await expect(mapper.mapFilePathToUrl('invalid', true)).rejects.toThrow(Error);
    });

    it('returns a generated identifier for directories.', async() => {
      await expect(mapper.mapFilePathToUrl(`${rootFilepath}container/`, true)).resolves.toEqual({
        identifier: { path: `${base}container/` },
        filePath: `${rootFilepath}container/`,
        isMetadata: false,
      });
    });

    it('returns a generated identifier for files with corresponding content-type.', async(): Promise<void> => {
      await expect(mapper.mapFilePathToUrl(`${rootFilepath}test.txt`, false)).resolves.toEqual({
        identifier: { path: `${base}test.txt` },
        filePath: `${rootFilepath}test.txt`,
        contentType: 'text/plain',
        isMetadata: false,
      });
    });

    it('returns a generated identifier for metadata files.', async(): Promise<void> => {
      await expect(mapper.mapFilePathToUrl(`${rootFilepath}test.meta`, false)).resolves.toEqual({
        identifier: { path: `${base}test` },
        filePath: `${rootFilepath}test.meta`,
        contentType: 'text/turtle',
        isMetadata: true,
      });
    });

    it('removes appended extensions.', async(): Promise<void> => {
      await expect(mapper.mapFilePathToUrl(`${rootFilepath}test.txt$.ttl`, false)).resolves.toEqual({
        identifier: { path: `${base}test.txt` },
        filePath: `${rootFilepath}test.txt$.ttl`,
        contentType: 'text/turtle',
        isMetadata: false,
      });
    });

    it('sets the content-type to application/octet-stream if there is no extension.', async(): Promise<void> => {
      await expect(mapper.mapFilePathToUrl(`${rootFilepath}test`, false)).resolves.toEqual({
        identifier: { path: `${base}test` },
        filePath: `${rootFilepath}test`,
        contentType: 'application/octet-stream',
        isMetadata: false,
      });
    });

    it('supports custom extensions.', async(): Promise<void> => {
      const customMapper = new RegexBasedExtensionMapper(base, rootFilepath, regex, contentTypeOfRegex, { cstm: 'text/custom' });
      await expect(customMapper.mapFilePathToUrl(`${rootFilepath}test$.cstm`, false)).
        resolves.toEqual({
          identifier: { path: `${base}test` },
          filePath: `${rootFilepath}test$.cstm`,
          contentType: 'text/custom',
          isMetadata: false,
        });
    });
  });

  it('map regex suffix to content type', async(): Promise<void> => {
    const customMapper = new RegexBasedExtensionMapper(base, rootFilepath, regex, contentTypeOfRegex);
    await expect(customMapper.mapUrlToFilePath({ path: `${base}a/resource/12/97fc1e89a6b174c7a5f4a48001f78789a89f4c` }, false)).
      resolves.toEqual({
        identifier: { path: `${base}a/resource/12/97fc1e89a6b174c7a5f4a48001f78789a89f4c` },
        filePath: `${rootFilepath}a/resource/12/97fc1e89a6b174c7a5f4a48001f78789a89f4c`,
        contentType: 'application/git',
        isMetadata: false,
      });
  });
});
