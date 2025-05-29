import { Injectable } from '@angular/core';
import { Rule } from './model/rule';
import { RuleGeneratorService } from './services/rule-generator.service';
import { RuleCondition } from './model/rule-condition';

@Injectable({
  providedIn: 'root'
})
export class BenfilService {

  fieldNames = new Map();

  constructor() {
    this.fieldNames.set("inNetworkInd", `isInNetwork`);
    this.fieldNames.set("groupNum", `groupNumber`);
    this.fieldNames.set("memberNum", `memberNumber`);
    this.fieldNames.set("patientType", `encounterInfo.patientType`);
    this.fieldNames.set("medicalService", `encounterInfo.medicalService`);
    this.fieldNames.set("providerGroupCode", `encounterInfo.providerGroupCode`);
    this.fieldNames.set("iiis", `industryCode.code`);
    this.fieldNames.set("revCode", `revenueCode`);
    this.fieldNames.set("recoPayerId", `recoPayerCode`);
  }

  generateRule(rule: Rule, ruleGeneratorService: RuleGeneratorService): string {

    const benefitsResolutionDTO = ruleGeneratorService.wrap(ruleGeneratorService.getFieldList(rule.ruleConditions, "BenefitsResolutionDTO", this.fieldNames), `BenefitsResolutionDTO(`, `) from $dto
        `);
    const insuranceInfo = ruleGeneratorService.wrap(ruleGeneratorService.getFieldList(rule.ruleConditions, "InsuranceInfo", this.fieldNames), `
    InsuranceInfo(
           $procedures: procedureInfoList != null,`, `) from $insurances
        `);
    const recoPayerCodeInfo = ruleGeneratorService.wrap(ruleGeneratorService.getFieldList(rule.ruleConditions, "RecoPayerIdOverride", this.fieldNames), `
    RecoPayerIdOverride(input == $dto,`, `)
        `);
    let procedureInfo = ruleGeneratorService.wrap(ruleGeneratorService.getFieldList(rule.ruleConditions, "ProcedureInfo", this.fieldNames), `
    ProcedureInfo(`, `) from $procedures
        `);

    if(!insuranceInfo && procedureInfo){
      procedureInfo = ruleGeneratorService.concatSepAtTheBeginning(procedureInfo,` 
    InsuranceInfo($procedures: procedureInfoList != null) from $insurances
        `);
    }

    const message = rule.ruleConditions.find(ruleCond => ruleCond.fieldName == 'message');
    const stc = rule.ruleConditions.find(ruleCond => ruleCond.fieldName == 'stc');

    return `//${rule.ticketNumber}
rule "${rule.name}" extends "BenefitFiltering DTO BASE"
    when
       ${benefitsResolutionDTO} ${insuranceInfo} ${recoPayerCodeInfo} ${procedureInfo}
    $badBen : Benefit(
           benefitType != null,
           serviceTypeCode == ServiceTypeCode.${stc?.value},
           $badIndustryCode : additionalInfos != null,
           $badMsg : msgs != null
       )from $benefits

       String(this matches "(?i).*(${message?.value}).*") from $badMsg

    then
       outputCollector.addRuleOutput(FilterBenefitOutput.newFilter()
           .filterBenefit($badBen)
           .onDto($dto)
           .fromRule(drools.getRule().getName())
   );
end`
  }

  getNumberFields(): string[] {
    return [];
  }
  addConditionTypes(conditionTypesByRuleType: Map<string, any>) {
    conditionTypesByRuleType.set("benefitfiltering", new Map<string,string>());

    // const formControlNames = [
    //   "customerAbbr",
    //   "medicalService",
    //   "patientType",
    //   "payerId",
    //   "ded",
    //   "ruleName",
    //   "recoPayerId",
    //   "revCode",
    //   "inNetworkInd",
    //   "groupNum",
    //   "planDesc",
    //   "message",
    //   "providerType",
    //   "providerId",
    //   "providerCode",
    //   "procedureCode",
    //   "memberNum",
    //   "refId",
    //   "iiis",
    //   "bnftCvgeLevelCode",
    //   "stc",
    // ];

    conditionTypesByRuleType.get("benefitfiltering").set("customerAbbr", "BenefitsResolutionDTO");
    conditionTypesByRuleType.get("benefitfiltering").set("medicalService", "BenefitsResolutionDTO");
    conditionTypesByRuleType.get("benefitfiltering").set("patientType", "BenefitsResolutionDTO");
    conditionTypesByRuleType.get("benefitfiltering").set("providerGroupCode", "BenefitsResolutionDTO");

    conditionTypesByRuleType.get("benefitfiltering").set("groupNum", "InsuranceInfo");
    conditionTypesByRuleType.get("benefitfiltering").set("memberNum", "InsuranceInfo");
    conditionTypesByRuleType.get("benefitfiltering").set("payerId", "InsuranceInfo");
    conditionTypesByRuleType.get("benefitfiltering").set("inNetworkInd", "InsuranceInfo");
    conditionTypesByRuleType.get("benefitfiltering").set("planDesc", "InsuranceInfo");

    conditionTypesByRuleType.get("benefitfiltering").set("procedureCode", "ProcedureInfo");
    conditionTypesByRuleType.get("benefitfiltering").set("revCode", "ProcedureInfo");
    conditionTypesByRuleType.get("benefitfiltering").set("recoPayerId", "RecoPayerIdOverride");

  }
}
