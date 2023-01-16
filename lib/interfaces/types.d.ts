import Base from "db-migrate-base";

export interface IMSchema {
  [key:string]: {
    [key:string]: Base.ColumnSpec
  } | {}
}

export interface ModelsTree {
  [key: string]: ModelSpec
}

export interface ModelSpec {
  [key: string]: AttributeSpec
}

export interface AttributeSpec {
  type?: string | undefined
  model?: string | undefined
  collection?: string | undefined
  via?: string | undefined
  required?: boolean | undefined
  defaultsTo?: string | undefined
  allowNull?: boolean | undefined
  notNull?: boolean | undefined
  primaryKey?: boolean | undefined
  autoIncrement?: boolean | undefined
  unique?: boolean | undefined
  isIn?: string[] | undefined
  columnName?: string | undefined
  columnType?: string | undefined
  encrypt?: boolean | undefined
}
