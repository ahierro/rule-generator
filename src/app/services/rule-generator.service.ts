import { Injectable } from '@angular/core';
import { ExpectedResults } from "../model/expectedResults";
import { Rule } from "../model/rule";
import { RuleCondition } from "../model/rule-condition";

@Injectable({
  providedIn: 'root'
})
export class RuleGeneratorService {

  fieldNames = new Map();
  isRgex = new Map();
  constructor() {

    this.fieldNames.set("procedureCode", `dalDelivery["ProcedureCode"]`);
    this.fieldNames.set("iiis", `this["III02List"]`);
    this.fieldNames.set("bnftCvgeLevelCode", `this[BenefitsConsts.BenefitResponseEligibility.BnftCvgeLevelCode]`);
    this.fieldNames.set("refId", `this[BenefitsConsts.BenefitResponseEligibility.ReferenceIdentification.RefId]`);
    this.fieldNames.set("message", `this["ALLMSG"]`);
    this.fieldNames.set("inNetworkInd", `this["InNetworkInd"]`);
    this.fieldNames.set("customerAbbr", `episode["CustomerAbbr"]`);

    this.fieldNames.set("groupNum", `this["EPISODE_INSURANCE.GroupNum"]`);
    this.fieldNames.set("memberNum", `this["EPISODE_INSURANCE.MemberNum"]`);

    this.isRgex.set("message", "CASE_INSENSITIVE");
    this.isRgex.set("planDesc", "CASE_INSENSITIVE");
    this.isRgex.set("memberNum", "MEMBER_NUM");
  }

  private formatFieldValue(fieldValue: string, isNumber: boolean, negate: boolean, isRegex: string) {
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
      expressions.push(`(${fieldName} in (${singleValues.join(', ')}))`);
    }

    return expressions.join(' || ');
  }
  private formatSingleValue(fieldValue: string, isNumber: boolean) {
    if (isNumber) {
      return parseInt(fieldValue.trim());
    } else {
      return `"${fieldValue.trim()}"`
    }
  }

  getCommonCondition(fieldName: string, fieldValue: any, isNumber: boolean, negate: boolean) {
    if (isNumber && fieldValue.includes("-")) {
      return this.formatRange(fieldValue, fieldName);
    }
    const formattedVal = this.formatFieldValue(fieldValue, isNumber, negate, this.isRgex.get(fieldName));
    return ` ${this.getFieldName(fieldName)}${formattedVal}`
  }
  getFieldList(ruleConditions: RuleCondition[], conditionType: string) {
    let stcResolutionInput: string[] = [];
    if (ruleConditions && ruleConditions.length) {
      stcResolutionInput = ruleConditions.filter(ruleCond => ruleCond.conditionType == conditionType)
        .map(ruleCond => this.getCommonCondition(ruleCond.fieldName, ruleCond.value, ruleCond.isNumber, ruleCond.negate))

    }
    const sep = `,
          `;
    const init = `
          `;
    return this.concatSepAtTheBeginning(stcResolutionInput.join(sep), init);
  }
  concatSepAtTheBeginning(str: string, sep: string) {
    return str ? `${sep}${str}` : '';
  }
  concatSepAtTheEnd(str: string, sep: string) {
    return str ? `${str}${sep}` : '';
  }
  generateRule(rule: Rule): string {
    const stcResolutionInputStr = this.getFieldList(rule.ruleConditions, "StcResolutionInput");
    const episode = this.concatSepAtTheEnd(this.concatSepAtTheBeginning(this.getFieldList(rule.ruleConditions, "episode"), '\n        DalMap('), '\n        ) from $episode\n');

    const benefitStr = this.concatSepAtTheEnd(this.concatSepAtTheBeginning(this.getFieldList(rule.ruleConditions, "Benefit"), ','), ',') || ',';
    const stc = rule.ruleConditions.find(ruleCond => ruleCond.fieldName == 'stc');
    const message = rule.ruleConditions.find(ruleCond => ruleCond.fieldName == 'message');
    const setMsg = this.getSetMsg(message);
    const planDesc = this.getPlanDesc(rule.ruleConditions.find(ruleCond => ruleCond.fieldName == 'planDesc'));
    const procCode = rule.ruleConditions.find(ruleCond => ruleCond.fieldName == 'procedureCode');

    let delivery = '';
    if (procCode) {
      delivery = `
           $delivery : dalDelivery != null,`
    }
    return `//${rule.ticketNumber}
rule "${rule.name}"
    when
        $sri : StcResolutionInput(
           $benefits : ebDalMaps != null,
           $episode : episode != null,${delivery} ${stcResolutionInputStr}
        )
        ${planDesc} ${episode}
        $benefit : DalMap(
           this["SvcTypeCode"] == "${stc?.value}",
           this["BnftInfoCode"] in (BenefitTypeCode.CoInsurance.code, BenefitTypeCode.CoPayment.code)${benefitStr}
           this["BnftAmt"] != null || this["BnftPercent"] != null
        ) from $benefits

    then
        $sri.setStc("${stc?.value}");${setMsg}
        retract($sri);
end`
  }

  generateTest(expectedResults: ExpectedResults): string {
    const ded = this.getDed(expectedResults.ded);
    const stc = this.getStc(expectedResults.stc);
    const copay = this.getCopay(expectedResults.copay);
    const coins = this.getCoins(expectedResults.coins);
    return `public IRunnableTest test${expectedResults.ticketNumber}(){
  RunnableTest test = new RunnableJsonTest();
  test.setTestId("${expectedResults.ticketNumber}");${copay} ${coins} ${ded} ${stc}
  return test;
}`;
  }
  getCoins(coins: string) {
    if (!!coins) {
      return `
  test.assertAllCoinsurance(${coins});`;
    } else {
      return '';
    }
  }
  private getCopay(copay: string) {
    if (!!copay) {
      return `
  test.assertAllCopay(${copay});`;
    } else {
      return '';
    }
  }
  private getStc(stc: string) {
    if (!!stc) {
      return `
  test.assertAllStc("${stc}");`;
    } else {
      return '';
    }
  }
  private getDed(ded: boolean) {
    if (ded == undefined) {
      return '';
    }
    if (ded) {
      return `
  test.assertAllDedApplies();`;
    } else {
      return `
  test.assertAllDedApplies(false);`;
    }
  }

  private getSetMsg(ruleCondition: RuleCondition | undefined) {
    if (ruleCondition == undefined) {
      return '';
    }
    return `
        $sri.setMessage("${ruleCondition.value}");`;
  }

  private getPlanDesc(ruleCondition: RuleCondition | undefined) {
    if (ruleCondition == undefined) {
      return '';
    }
    const planCvgeDesc = this.formatFieldValue(ruleCondition.value, false, ruleCondition.negate, this.isRgex.get(ruleCondition.fieldName));
    return `
        DalMap(
            this["SvcTypeCode"] == "30",
            this["BnftInfoCode"] == BenefitTypeCode.ActiveCoverage.code,
            this["PlanCvgeDesc"]${planCvgeDesc}
        ) from $benefits
`;
  }

  private getFieldName(fieldName: string) {
    return this.fieldNames.get(fieldName) || fieldName;
  }

}
