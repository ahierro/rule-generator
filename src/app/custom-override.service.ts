import { Injectable } from '@angular/core';
import { Rule } from './model/rule';
import { RuleGeneratorService } from './services/rule-generator.service';
import { RuleCondition } from './model/rule-condition';

@Injectable({
  providedIn: 'root'
})
export class CustomOverrideService {
  fieldNames = new Map();

  constructor() {
    this.fieldNames.set('medicalService', 'encounterInfo.medicalService');
    this.fieldNames.set('patientType', 'encounterInfo.patientType');
    this.fieldNames.set('payerId', 'payerCode');
    this.fieldNames.set('recoPayerId', 'recoPayerCode');
    this.fieldNames.set('revCode', 'revenueCode');
    this.fieldNames.set('groupNum', 'groupNumber');
    this.fieldNames.set('message', '');
    this.fieldNames.set('procedureCode', 'procedureCode');
    this.fieldNames.set('memberNum', 'memberNumber');
  }

  generateRule(rule: Rule, ruleGeneratorService: RuleGeneratorService): string {

    const benefitsResolutionDTO = ruleGeneratorService.concatSepAtTheBeginning(
      ruleGeneratorService.getFieldList(rule.ruleConditions, "BenefitsResolutionDTO", this.fieldNames)
      , `,`);

    const insuranceInfo = ruleGeneratorService.concatSepAtTheBeginning(
      ruleGeneratorService.getFieldList(rule.ruleConditions, "InsuranceInfo", this.fieldNames)
      , `,`);

    const procedureInfo = ruleGeneratorService.getFieldList(rule.ruleConditions, "ProcedureInfo", this.fieldNames);

    const coins = rule.ruleConditions.find(ruleCond => ruleCond.fieldName == 'coins');
    const copay = rule.ruleConditions.find(ruleCond => ruleCond.fieldName == 'copay');
    const ded = rule.ruleConditions.find(ruleCond => ruleCond.fieldName == 'ded');
    let dedLine = ''
    if(ded?.value != undefined){
      dedLine = `
            .withDedApplies(${ded?.value})`;
    }
    return `//${rule.ticketNumber}
rule "${rule.name}" 
    when 
        $dto : BenefitsResolutionDTO( 
           $insurances: insuranceInfoList != null${benefitsResolutionDTO}
        ) 
 
         $insurance: InsuranceInfo(
           $procedures : procedureInfoList != null${insuranceInfo}
         ) from $insurances 
 
        $proc : ProcedureInfo(${procedureInfo}) from $procedures 
 
    then 
        outputCollector.addRuleOutput(ProcedureBenefitOverrideOutput.newOverride() 
            .forProcedure($proc) 
            .withCopay(${copay?.value}) 
            .withCoinsurance(${coins?.value})${dedLine}
            .onDto($dto) 
            .fromRule(drools.getRule().getName()) 
        ); 
end`;
  }

  getNumberFields(): string[] {
    // Return the list of number fields for customOverride
    return [];
  }

  addConditionTypes(conditionTypesByRuleType: Map<string, any>) {
    conditionTypesByRuleType.set('customOverride', new Map<string, string>());
    // Add all relevant field mappings for customOverride
    const map = conditionTypesByRuleType.get('customOverride');
    map.set('customerAbbr', 'BenefitsResolutionDTO');
    map.set('patientType', 'BenefitsResolutionDTO');
    map.set('medicalService', 'BenefitsResolutionDTO');
    map.set('payerId', 'InsuranceInfo');
    map.set('recoPayerId', 'InsuranceInfo');
    map.set('groupNum', 'InsuranceInfo');
    map.set('memberNum', 'InsuranceInfo');
    map.set('planDesc', 'InsuranceInfo');
    map.set('procedureCode', 'ProcedureInfo');
    map.set('revCode', 'ProcedureInfo');
  }
}
