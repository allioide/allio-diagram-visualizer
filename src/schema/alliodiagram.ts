/* eslint-disable */
/**
 * This file was automatically generated by json-schema-to-typescript.
 * DO NOT MODIFY IT BY HAND. Instead, modify the source JSONSchema file,
 * and run json-schema-to-typescript to regenerate this file.
 */

export interface ALLIODiagram {
  devices: {
    name: string;
    type: string;
  }[];
  diagrams: {
    name?: string;
    content: (Begin | Command | Transition | BackToBegin | End)[];
  }[];
}
export interface Begin {
  type: "begin";
  id?: string;
}
export interface Command {
  type: "command";
  id?: string;
  name?: string;
  actions?: Action[];
}
export interface Action {
  device: string;
  action: string;
  parameters?: Parameter[];
}
export interface Parameter {
  name: string;
  value: string | number | Expression;
}
export interface Expression {
  /**
   * @minItems 1
   */
  expression: [string | number | Operator | Value, ...(string | number | Operator | Value)[]];
}
export interface Operator {
  operator: "+" | "-" | "*" | "/" | "%";
}
export interface Value {
  device: string;
  value: string;
}
export interface Transition {
  type: "transition";
  id?: string;
  name?: string;
  from: string;
  to: string;
  conditions?: (Condition | Expression1)[];
}
export interface Condition {
  device: string;
  condition: string;
  parameters?: Parameter[];
}
export interface Expression1 {
  /**
   * @minItems 1
   */
  expression: [string | number | Operator | Value, ...(string | number | Operator | Value)[]];
}
export interface BackToBegin {
  type: "back to begin";
  id?: string;
}
export interface End {
  type: "end";
  id?: string;
}