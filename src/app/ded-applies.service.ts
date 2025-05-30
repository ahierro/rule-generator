import { Injectable } from '@angular/core';
import { Rule } from './model/rule';
import { RuleGeneratorService } from './services/rule-generator.service';

@Injectable({
  providedIn: 'root'
})
export class DedAppliesService {
  fieldNames = new Map();

  constructor() {
    // this.fieldNames.set('customerAbbr', '');
    // this.fieldNames.set('medicalService', '');
    // this.fieldNames.set('patientType', '');
    // this.fieldNames.set('payerId', 'payerId');
    this.fieldNames.set('recoPayerId', 'recoPayerId');
    this.fieldNames.set('revCode', 'revCode');
    this.fieldNames.set('inNetworkInd', 'inNetwork');
    this.fieldNames.set('groupNum', 'request[EncounterConsts.Episode.EpisodeInsurance.GroupNum]');
    this.fieldNames.set('planDesc', 'this["PlanDesc"]');
    // this.fieldNames.set('message', 'message');
    this.fieldNames.set('procedureCode', 'procedureCode');
    this.fieldNames.set('memberNum', 'request["EPISODE.EPISODE_INSURANCE.MemberNum"]');
  }

  generateRule(rule: Rule, ruleGeneratorService: RuleGeneratorService): string {
    const benefitResolverProcedureInput = ruleGeneratorService.concatSepAtTheBeginning(
      ruleGeneratorService.getFieldList(rule.ruleConditions, "BenefitResolverProcedureInput", this.fieldNames)
      , `,`);

    const planDesc = rule.ruleConditions.find(ruleCond => ruleCond.fieldName == 'planDesc');
    const ded = rule.ruleConditions.find(ruleCond => ruleCond.fieldName == 'ded');

    return `//${rule.ticketNumber}
rule "${rule.name}" 
    when
        $pbri : BenefitResolverProcedureInput( 
           request != null${benefitResolverProcedureInput}${planDesc?.value ? `,
           $insurances: request["EPISODE_INSURANCE"] != null`: ''}) 
         ${planDesc?.value ? `
        DalMap( 
            this["PlanDesc"] == "${planDesc?.value}" 
        ) from $insurances
          ` : ''}
    then 
        $pbri.setDedApplies(${ded?.value}); 
        retract($pbri); 
end`;
  }

  getNumberFields(): string[] {
    // Return the list of number fields for dedApplies
    return ['revCode'];
  }

  addConditionTypes(conditionTypesByRuleType: Map<string, any>) {
    conditionTypesByRuleType.set('dedApplies', new Map<string, string>());
    // Add all relevant field mappings for dedApplies
    const map = conditionTypesByRuleType.get('dedApplies');
    map.set('recoPayerId', 'BenefitResolverProcedureInput');
    map.set('memberNum', 'BenefitResolverProcedureInput');
    map.set('groupNum', 'BenefitResolverProcedureInput');
    map.set('inNetworkInd', 'BenefitResolverProcedureInput');
    map.set('procedureCode', 'BenefitResolverProcedureInput');
    map.set('payerId', 'BenefitResolverProcedureInput');
    map.set('revCode', 'BenefitResolverProcedureInput');
    map.set('planDesc', 'DalMap');
  }
}
