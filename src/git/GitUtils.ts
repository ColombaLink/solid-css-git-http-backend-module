import type { Quad } from 'rdf-js';
import { namedNode, triple } from '@rdfjs/data-model';
import { AS, LDP } from '@inrupt/vocab-common-rdf';

export class GitUtils {
  public static blobToQuad(data: string, oid: string, uri: string): Quad[] {
    const quads: Quad[] = [];
    const trip = triple(namedNode(oid), namedNode(LDP.NonRDFSource), namedNode(uri));

    quads.push(trip);
    return quads;
  }

  public static treeToQuad(data: Buffer, path: string): Quad[] {
    const indexOfBackslash = [];
    let index = 0;
    while (true) {
      index = data.indexOf('\0', index + 1);
      if (index > 0) {
        indexOfBackslash.push(index);
      } else {
        break;
      }
    }
    const oidArray = [];
    // We need to ignore first occurence and following ones with a distance shorter than 20
    for (let i = 1; i < indexOfBackslash.length; i++) {
      const indexi = indexOfBackslash[i];
      if (i > 1 && indexi - 20 < indexOfBackslash[i - 1]) {
        // E.g indexi=30 last index 15 -> 30-20 < 15 === true
        // const rm = indexOfBackslash.splice(i, 1);
        i -= 1;
        // The array size get reduced so we reduce loop counter as well
        continue;
      }
      // Plus 1 because index of returns start of occurence
      const blobSlice = data.slice(indexi + 1, indexi + 21);
      oidArray.push(blobSlice.toString('hex'));
    }

    // Let syncTxt = data.toString('utf-8');

    const indexOfSpaces = [];
    let indexSpace = 0;
    while (true) {
      indexSpace = data.indexOf(' ', indexSpace + 1);
      if (indexSpace > 0) {
        indexOfSpaces.push(indexSpace);
      } else {
        break;
      }
    }

    // 0644 = file  0000=Directory
    const modeArray = [];
    const fileNamesArray = [];
    for (let i = 1; i < indexOfSpaces.length; i++) {
      const indi = indexOfSpaces[i];
      if (i > 1 && indexOfBackslash[i - 1] + 20 > indi) {
        // Ignore space encodings in the hash
        // let rm = indexOfSpaces.splice(i, 1);
        // Console.log(`Found Space encoding in Hash, ignored at index: ${rm}`);
        i -= 1;
        continue;
      }

      const name = data.slice(indi + 1, indexOfBackslash[i]).toString();
      fileNamesArray.push(name);
      const mode = data.slice(indi - 4, indi).toString();
      modeArray.push(mode);
    }

    const quads: Quad[] = [];

    for (const [i, element] of oidArray.entries()) {
      if (modeArray[i] === '0644') {
        const pathToNewTree = `${path.slice(0, path.indexOf('objects') + 8) + element.slice(0, 2)}/${element.slice(2)}`;
        const tr = triple(namedNode(fileNamesArray[i]), namedNode(LDP.NonRDFSource), namedNode(pathToNewTree));
        quads.push(tr);
      } else if (modeArray[i] === '0000') {
        const pathToNewTree = `${path.slice(0, path.indexOf('objects') + 8) + element.slice(0, 2)}/${element.slice(2)}`;
        const tr = triple(namedNode(fileNamesArray[i]), namedNode(LDP.BasicContainer), namedNode(pathToNewTree));
        quads.push(tr);
      } else {
        // Console.log('udefined element in tree');
      }
    }
    return quads;
  }

  public static commitToQuad(data: string, id: string, path: string): any {
    const quads: Quad[] = [];

    // Sting is parsed by new line = \n
    let indexOld = 0;
    const indexArrayNewLine = [];
    while (true) {
      const index = data.indexOf('\n', indexOld + 1);
      if (index < 0) {
        break;
      }
      indexArrayNewLine.push(index);
      indexOld = index;
    }
    // Find out the tree this commit points to
    const startOfHash = data.indexOf('tree') + 4;
    const hashOfTree: string = data.slice(startOfHash, startOfHash + 41);

    // Get parents (0 first commit / normally not more than 2 if there are no merges)
    const parentArray = [];
    let indexOldParent = 0;
    while (true) {
      const indexParent = data.indexOf('parent', indexOldParent + 1);
      if (indexParent < 0) {
        break;
      }
      const parentHash: string = data.slice(indexParent + 7, indexParent + 47);
      parentArray.push(parentHash);
      indexOldParent = indexParent;
    }
    // Find Author
    const authorindex = data.indexOf('author');
    const endIndex = data.indexOf(' ', authorindex + 7);
    const authorOfCommit: string = data.slice(authorindex + 7, endIndex);

    // Find Author Mail
    // const mailIndex = data.indexOf('<', endIndex);
    // const mailEnd = data.indexOf('>', endIndex);
    // Const mail = data.slice(mailIndex + 1, mailEnd);

    // Find Comitter name
    const committerStart = data.indexOf('committer');
    const committerEnd = data.indexOf(' ', committerStart + 10);
    const committerOfCommit: string = data.slice(committerStart + 10, committerEnd);

    // Find Committer Mail
    // const mailComIndex = data.indexOf('<', committerEnd);
    // const mailComEnd = data.indexOf('>', committerEnd);
    // Const mailCom = data.slice(mailComIndex + 1, mailComEnd);

    // Find Commit msg
    const startCommitMsg = data.indexOf('\n\n');
    const msg = data.slice(startCommitMsg + 2);

    // Loop over parents
    for (const element of parentArray) {
      const pr = triple(namedNode(id), namedNode(AS.prev), namedNode(element));
      quads.push(pr);
    }

    const tr = triple(namedNode(id), namedNode(AS.target), namedNode(hashOfTree));
    quads.push(tr);
    const au = triple(namedNode(id), namedNode(AS.author), namedNode(authorOfCommit));
    quads.push(au);
    const co = triple(namedNode(id), namedNode(AS.actor), namedNode(committerOfCommit));
    quads.push(co);
    const me = triple(namedNode(id), namedNode(AS.Event), namedNode(msg));
    quads.push(me);

    return quads;
  }
}
