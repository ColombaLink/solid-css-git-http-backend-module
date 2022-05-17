import { Blob, Repository, Signature, Treebuilder, TreeEntry } from 'nodegit';
import type { Commit, Oid } from 'nodegit';
import fs from 'fs';

// Import {rmSync} from "fs-extra";

export class GitObjectFactory {
  /**
     *  Creates a Git Repository and Adds some Objects to it for testing
     * @param path where the git repository should be created
     *
     * returns [][] of Oid where [0][x] =blob [1][x]=tree [2][x] = commit
     */
  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
  public static async createBasicGitObjects(path: string) {
    try {
      // eslint-disable-next-line no-sync
      fs.rmSync('.test-folder/', { recursive: true });
      // eslint-disable-next-line no-empty
    } catch {}

    const repo = await Repository.init(path, 1);
    await Signature.default(repo);

    const x = await this.createTree(repo);
    // Returns array of Oid first two are Blobs 3. inner tree 4. outer Tree
    const y = await this.createTree(repo);

    const author = Signature.now('alice', 'alice@git.com');
    const parentArray: (string | Oid | Commit)[] = [];

    const commitOid0 = await repo.createCommit(
      'HEAD',
      author,
      author,
      'add firtst event',
      y[3],
      parentArray,
    );
    parentArray.push(commitOid0);

    const commitOid = await repo.createCommit(
      'HEAD',
      author,
      author,
      'add event',
      x[3],
      parentArray,
    );

    const gitObjectOidArray = [[x[0], x[1], y[0], y[1]], [x[2], x[3], y[2], y[3]], [commitOid0, commitOid]];

    return gitObjectOidArray;
  }

  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
  public static async createTree(repo: Repository) {
    await Signature.default(repo);

    const txt1 = JSON.stringify({ measurement: Math.random() * 9 * 1 * 1, unit: 'Celsius' });
    const blob = Buffer.from(txt1);
    const blobHash = await Blob.createFromBuffer(repo, blob, blob.length);
    const txt2 = JSON.stringify({ measurement: Math.random() * 10 * 1 * 1, unit: 'Celsius' });
    const blob2 = Buffer.from(txt2);
    const blobHash2 = await Blob.createFromBuffer(repo, blob2, blob2.length);

    // eslint-disable-next-line unicorn/no-useless-undefined
    const secondTreeBuilder = await Treebuilder.create(repo, undefined);
    // eslint-disable-next-line unicorn/no-useless-undefined
    const currentTreeBuilder = await Treebuilder.create(repo, undefined);
    await currentTreeBuilder.insert('filename', blobHash, TreeEntry.FILEMODE.BLOB);

    await secondTreeBuilder.insert('filename2', blobHash2, 33_188);
    const secondTreeHash = await secondTreeBuilder.write();
    await currentTreeBuilder.insert('treeName', secondTreeHash, TreeEntry.FILEMODE.TREE);
    const currentTreeOid = await currentTreeBuilder.write();

    const OidArray = [blobHash, blobHash2, secondTreeHash, currentTreeOid];

    return OidArray;
  }

  //
  // public static readFromPodAsBuffer(urlToRepo: string, file: Oid): Buffer {
  // const prefix = file.toString().slice(0, 2);
  // const ending = file.toString().slice(3);
  // const path = urlToRepo + prefix + ending;
  // const tect = fs.readFileSync(path);
  // return tect;
  // }
}
