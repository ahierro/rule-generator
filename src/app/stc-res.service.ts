import { Injectable } from '@angular/core';
import { Rule } from './model/rule';
import { RuleGeneratorService } from './services/rule-generator.service';
import { RuleCondition } from './model/rule-condition';

@Injectable({
  providedIn: 'root'
})
export class StcResService {

  fieldNames = new Map();

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
  }

  generateRule(rule: Rule, ruleGeneratorService: RuleGeneratorService): string {
    const stcResolutionInputStr = ruleGeneratorService.getFieldList(rule.ruleConditions, "StcResolutionInput", this.fieldNames);
    const episode = ruleGeneratorService.concatSepAtTheEnd(ruleGeneratorService.concatSepAtTheBeginning(ruleGeneratorService.getFieldList(rule.ruleConditions, "episode", this.fieldNames), '\n        DalMap('), '\n        ) from $episode\n');

    const benefitStr = ruleGeneratorService.concatSepAtTheEnd(ruleGeneratorService.concatSepAtTheBeginning(ruleGeneratorService.getFieldList(rule.ruleConditions, "Benefit", this.fieldNames), ','), ',') || ',';
    const stc = rule.ruleConditions.find(ruleCond => ruleCond.fieldName == 'stc');
    const message = rule.ruleConditions.find(ruleCond => ruleCond.fieldName == 'message');
    const setMsg = this.getSetMsg(message);
    const planDesc = this.getPlanDesc(rule.ruleConditions.find(ruleCond => ruleCond.fieldName == 'planDesc'), ruleGeneratorService);
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
  getPlanDesc(ruleCondition: RuleCondition | undefined, ruleGeneratorService: RuleGeneratorService) {
    if (ruleCondition == undefined) {
      return '';
    }
    const planCvgeDesc = ruleGeneratorService.formatFieldValue(ruleCondition.value, false, ruleCondition.negate, ruleGeneratorService.isRgex.get(ruleCondition.fieldName));
    return `
        DalMap(
            this["SvcTypeCode"] == "30",
            this["BnftInfoCode"] == BenefitTypeCode.ActiveCoverage.code,
            this["PlanCvgeDesc"]${planCvgeDesc}
        ) from $benefits
`;
  }
  private getSetMsg(ruleCondition: RuleCondition | undefined) {
    if (ruleCondition == undefined) {
      return '';
    }
    return `
        $sri.setMessage("${ruleCondition.value}");`;
  }
  addConditionTypes(conditionTypesByRuleType: Map<string, any>) {
    conditionTypesByRuleType.set("STC", new Map<string, string>());
    conditionTypesByRuleType.get("STC").set("customerAbbr", "StcResolutionInput");
    conditionTypesByRuleType.get("STC").set("payerId", "StcResolutionInput");
    conditionTypesByRuleType.get("STC").set("recoPayerId", "StcResolutionInput");
    conditionTypesByRuleType.get("STC").set("revCode", "StcResolutionInput");
    conditionTypesByRuleType.get("STC").set("providerType", "StcResolutionInput");
    conditionTypesByRuleType.get("STC").set("providerId", "StcResolutionInput");
    conditionTypesByRuleType.get("STC").set("providerCode", "StcResolutionInput");
    conditionTypesByRuleType.get("STC").set("procedureCode", "StcResolutionInput");
    conditionTypesByRuleType.get("STC").set("patientType", "StcResolutionInput");
    conditionTypesByRuleType.get("STC").set("refId", "Benefit");
    conditionTypesByRuleType.get("STC").set("iiis", "Benefit");
    conditionTypesByRuleType.get("STC").set("bnftCvgeLevelCode", "Benefit");
    conditionTypesByRuleType.get("STC").set("medicalService", "StcResolutionInput");
    conditionTypesByRuleType.get("STC").set("memberNum", "episode");
    conditionTypesByRuleType.get("STC").set("groupNum", "episode");
    conditionTypesByRuleType.get("STC").set("planDesc", "planDesc");
    conditionTypesByRuleType.get("STC").set("inNetworkInd", "Benefit");
    conditionTypesByRuleType.get("STC").set("message", "Benefit");
    conditionTypesByRuleType.get("STC").set("stc", "stc");
  }
  getNumberFields(): string[] {
    return ["revCode"];
  }
}
