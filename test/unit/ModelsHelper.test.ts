import {expect} from "chai";
import * as path from "path";
import {ModelsHelper} from "../../lib/helper/ModelsHelper";
process.env.MODELS_PATH = path.resolve(__dirname, "./../datamocks/models");
let modelsTree = require("../datamocks/modelsTree.json");

describe('Models helper test', function () {
  it('buildTree method check', async function() {
    let result = ModelsHelper.buildTree();
    expect(result.modelsTree).to.deep.equal(modelsTree)
    expect(result.modelsPrimaryKeysTypes).to.deep.equal({home: 'bigint', user: 'text'})
  });
});
