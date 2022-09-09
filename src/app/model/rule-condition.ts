export interface RuleCondition {
  fieldName: string;
  value: string;
  isNumber: boolean;
  conditionType: string;
  negate: boolean;
}
