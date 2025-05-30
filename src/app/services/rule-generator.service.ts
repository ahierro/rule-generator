import { Injectable } from '@angular/core';
import { Rule } from "../model/rule";
import { RuleCondition } from "../model/rule-condition";
import { StcResService } from '../stc-res.service';
import { BenfilService } from '../benfil.service';
import { DedAppliesService } from '../ded-applies.service';
import { CustomOverrideService } from '../custom-override.service';

@Injectable({
  providedIn: 'root'
})
export class RuleGeneratorService {
  sep = `,
          `;
  init = `
          `;
  isRgex = new Map();
  constructor(
    private stcResService: StcResService,
    private benfilService: BenfilService,
    private dedAppliesService: DedAppliesService,
    private customOverrideService: CustomOverrideService
  ) {
    this.isRgex.set("message", "CASE_INSENSITIVE");
    this.isRgex.set("planDesc", "CASE_INSENSITIVE");
    this.isRgex.set("memberNum", "MEMBER_NUM");
  }
  getNumberFieldsByScope(scope: string): string[] {
    switch (scope) {
      case 'STC':
        return this.stcResService.getNumberFields();
      case 'benefitfiltering':
        return this.benfilService.getNumberFields();
      case 'dedApplies':
        return this.dedAppliesService.getNumberFields();
      case 'customOverride':
        return this.customOverrideService.getNumberFields();
      default:
        return [];
    }
  }

  formatFieldValue(fieldValue: string, isNumber: boolean, negate: boolean, isRegex: string) {
    if (isRegex === 'CASE_INSENSITIVE') {
      return " matches " + `"(?i).*(${fieldValue.trim()}).*"`;
    }
    if (isRegex === 'MEMBER_NUM') {
      return " matches " + `"^(${fieldValue.trim()}).*"`;
    }
    if (fieldValue.includes(",") && fieldValue.length > 3) {
      return (negate) ? " not in " : " in " + "(" + fieldValue.split(",")
        .map(fieldVal => this.formatSingleValue(fieldVal, isNumber))
        .sort((b, a) => {
          if (typeof b == 'number' && typeof a == 'number') {
            return b - a;
          } else {
            if (a > b) {
              return -1;
            }
            if (b > a) {
              return 1;
            }
            return 0;
          }
        })
        .map(x => `${x}`)
        .join(",") + ")";
    }
    return (negate) ? " != " : " == " + this.formatSingleValue(fieldValue, isNumber);
  }
  formatRange(fieldValue: string, fieldName: string) {
    const normalized = fieldValue.replace(/,/g, ' ').trim();
    const tokens = normalized.split(/\s+/);

    const expressions: string[] = [];
    const singleValues: number[] = [];

    for (const token of tokens) {
      if (token.includes('-')) {
        const [start, end] = token.split('-').map(Number);
        if (!isNaN(start) && !isNaN(end)) {
          expressions.push(`(${fieldName} >= ${start} && ${fieldName} <= ${end})`);
        }
      } else {
        const value = Number(token);
        if (!isNaN(value)) {
          singleValues.push(value);
        }
      }
    }

    if (singleValues.length > 0) {
      expressions.push(`${fieldName} in (${singleValues.join(', ')})`);
    }

    return " " + expressions.join(' || ');
  }
  private formatSingleValue(fieldValue: string, isNumber: boolean) {
    if (isNumber) {
      return parseInt(fieldValue.trim());
    } else {
      return `"${fieldValue.trim()}"`
    }
  }

  getCommonCondition(fieldName: string, fieldValue: any, isNumber: boolean, negate: boolean, fieldNames: Map<string, string>) {
    if (isNumber && fieldValue.includes("-")) {
      return this.formatRange(fieldValue, fieldName);
    }
    const formattedVal = this.formatFieldValue(fieldValue, isNumber, negate, this.isRgex.get(fieldName));
    return ` ${this.getFieldName(fieldName,fieldNames)}${formattedVal}`
  }
  getFieldList(ruleConditions: RuleCondition[], conditionType: string, fieldNames: Map<string, string>): string {
    let fieldName: string[] = [];
    if (ruleConditions && ruleConditions.length) {
      fieldName = ruleConditions.filter(ruleCond => ruleCond.conditionType == conditionType)
        .map(ruleCond => this.getCommonCondition(ruleCond.fieldName, ruleCond.value, ruleCond.isNumber, ruleCond.negate,fieldNames))
    }

    return this.concatSepAtTheBeginning(fieldName.join(this.sep), this.init);
  }
  wrap(str: string, wrapperBegginig: string, wrapperEnd: string) {
    return str ? `${wrapperBegginig}${str}${wrapperEnd}` : '';
  }
  concatSepAtTheBeginning(str: string, sep: string) {
    return str ? `${sep}${str}` : '';
  }
  concatSepAtTheEnd(str: string, sep: string) {
    return str ? `${str}${sep}` : '';
  }
  generateRule(rule: Rule, scope:string): string {

    switch (scope) {
      case 'STC':
        return this.stcResService.generateRule(rule, this);
      case 'benefitfiltering':
        return this.benfilService.generateRule(rule, this);
      case 'dedApplies':
        return this.dedAppliesService.generateRule(rule, this);
      case 'customOverride':
        return this.customOverrideService.generateRule(rule, this);
      default:
        return '';
    }
  }
  getConditionTypes(): Map<string,Map<string,string>> {
    const conditionTypesByRuleType = new Map<string, any>();

    this.stcResService.addConditionTypes(conditionTypesByRuleType);
    this.benfilService.addConditionTypes(conditionTypesByRuleType);
    this.dedAppliesService.addConditionTypes(conditionTypesByRuleType);
    this.customOverrideService.addConditionTypes(conditionTypesByRuleType);

    return conditionTypesByRuleType as Map<string, Map<string, string>>;
  }

  private getFieldName(fieldName: string,fieldNames: Map<string, string>) {
    return fieldNames.get(fieldName) || fieldName;
  }
}
