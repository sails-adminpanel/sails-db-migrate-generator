import { ModelsTree } from "../interfaces/types";
import Base from "db-migrate-base";
export declare class ModelsHelper {
    static buildTree(): {
        modelsTree: ModelsTree;
        modelsPrimaryKeysTypes: {
            [key: string]: string;
        };
    };
    static processTree(modelsTree: ModelsTree, modelsPrimaryKeysTypes: {
        [key: string]: string;
    }): Base.ColumnSpec;
}
