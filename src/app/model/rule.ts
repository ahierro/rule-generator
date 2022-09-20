import {RuleCondition} from "./rule-condition";

export interface Rule {
  name: string;
  ticketNumber: string;
  ruleConditions: RuleCondition[];
}
