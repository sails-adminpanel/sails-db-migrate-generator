import { ModelsTree } from "../interfaces/types";
import Base from "db-migrate-base";
export declare class ModelsHelper {
    static buildTree(): {
        modelsTree: ModelsTree;
        modelsPrimaryKeysTypes: {
            [key: string]: string;
        };
    };
    static processTree(modelsTree: any, modelsPrimaryKeysTypes: any): Base.ColumnSpec;
}
