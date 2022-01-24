export interface Named {
  startof_mnNameOffset: number;
  mnNameOffset: number;
}

export interface TableInfo extends Named {
  mnNameHash: number;
  startof_mnSchemaOffset: number;
  mnSchemaOffset: number;
  mnDataType: number;
  mnRowSize: number;
  mnRowOffset: number;
  mnRowCount: number;
}

export interface SchemaColumn extends Named {
  mnNameHash: number;
  mnDataType: number;
  mnFlags: number;
  mnOffset: number;
  mnSchemaOffset: number;
}

export interface Schema extends Named {
  mnNameHash: number;
  mnSchemaHash: number;
  mnSchemaSize: number;
  startof_mnColumnOffset: number;
  mnColumnOffset: number;
  mnNumColumns: number;
  mColumn: SchemaColumn[];
}

export interface StringTable {
  mStringEntry: string[];
}

export interface Row {
  [key: string]: any;
}

export interface TableData {
  mValue?: any[];
  mRow?: Row[];
}

export interface BinaryTuningDto {
  mnVersion: number;
  mUnused: number;
  mSchema: Schema[];
  mTable: TableInfo[];
  mTableData: TableData[];
  mStringTable: StringTable;
}