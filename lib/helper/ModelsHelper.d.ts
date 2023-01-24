import { ModelsTree } from "../interfaces/types";
export declare class ModelsHelper {
    static buildTree(): {
        modelsTree: ModelsTree;
        modelsPrimaryKeysTypes: {
            [key: string]: string;
        };
    };
    static processTree(modelsTree: any, modelsPrimaryKeysTypes: any, migrationsSchema: any): ModelsTree;
}
