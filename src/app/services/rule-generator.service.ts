import {Injectable} from '@angular/core';
import {ExpectedResults} from "../model/expectedResults";
import {Rule} from "../model/rule";
import {RuleCondition} from "../model/rule-condition";

@Injectable({
  providedIn: 'root'
})
export class RuleGeneratorService {

  aliases = new Map();

  constructor() {

    this.aliases.set("payerId", "$payer");
    this.aliases.set("recoPayerId", "$recoPayerId");
    this.aliases.set("revCode", "$revCode");
    this.aliases.set("providerType", "$providerType");
    this.aliases.set("patientType", "$pType");
    this.aliases.set("providerId", "$provider");
    this.aliases.set("medicalService", "$mService");
    this.aliases.set("providerCode", "$providerCode");
    this.aliases.set("procedureCode", "$procCode");

  }

  private formatFieldValue(fieldValue: string, isNumber: boolean, negate: boolean) {
    if (fieldValue.includes(",") && fieldValue.length > 3) {
      return (negate) ? " not in " : " in " + "(" + fieldValue.split(",")
        .map(fieldVal => this.formatSingleValue(fieldVal, isNumber)
        ).join(",") + ")";
    }
    return (negate) ? " != " : " == " + this.formatSingleValue(fieldValue, isNumber);
  }

  private formatSingleValue(fieldValue: string, isNumber: boolean) {
    if (isNumber) {
      return fieldValue.trim();
    } else {
      return `"${fieldValue.trim()}"`
    }
  }

  getCommonCondition(fieldName: string, fieldValue: any, isNumber: boolean, negate: boolean) {
    const formattedVal = this.formatFieldValue(fieldValue, isNumber, negate);
    const alias = this.aliases.get(fieldName);
    return ` ${alias} : ${this.getFieldName(fieldName)}${formattedVal}`
  }

  generateRule(rule: Rule): string {
    let stcResolutionInput:string[] = [];
    if(rule.ruleConditions && rule.ruleConditions.length){
      stcResolutionInput = rule.ruleConditions.filter(ruleCond => ruleCond.conditionType == "StcResolutionInput")
        .map(ruleCond => this.getCommonCondition(ruleCond.fieldName,ruleCond.value,ruleCond.isNumber,ruleCond.negate))

    }
    const stcResolutionInputStr = stcResolutionInput.join(`,
          `);
    const stc = rule.ruleConditions.find(ruleCond => ruleCond.fieldName == 'stc');
    const message = rule.ruleConditions.find(ruleCond => ruleCond.fieldName == 'message');
    const allMsg = this.getAllMsg(message);
    const setMsg = this.getSetMsg(message);
    const inNetworkInd = this.getInNetWork(rule.ruleConditions.find(ruleCond => ruleCond.fieldName == 'inNetworkInd'));
    const planDesc = this.getPlanDesc(rule.ruleConditions.find(ruleCond => ruleCond.fieldName == 'planDesc'));
    const memberNum = this.getMemberNum(rule.ruleConditions.find(ruleCond => ruleCond.fieldName == 'memberNum'));
    const groupNum = this.getGroupNum(rule.ruleConditions.find(ruleCond => ruleCond.fieldName == 'groupNum'));

    const procCode = this.getMemberNum(rule.ruleConditions.find(ruleCond => ruleCond.fieldName == 'procedureCode'));
    let delivery = '';
    if(procCode){
      delivery = `
           $delivery : dalDelivery != null,`
    }
    return `//${rule.ticketNumber}
rule "${rule.name}"
    when
        $sri : StcResolutionInput(
           $benefits : ebDalMaps != null,
           $episode : episode != null,${delivery}
           $custAbbr : episode ["CustomerAbbr"]${this.formatFieldValue(rule.customerAbbr,false,false)},
          ${stcResolutionInputStr}
        )
        ${planDesc} ${memberNum} ${groupNum}
        $benefit : DalMap(
            $stc : this["SvcTypeCode"] == "${stc?.value}",
            $bic : this["BnftInfoCode"] in (BenefitTypeCode.CoInsurance.code, BenefitTypeCode.CoPayment.code),${inNetworkInd} ${allMsg}
            $copay : this["BnftAmt"] != null ||
            $coins : this["BnftPercent"] != null
        ) from $benefits

    then
        $sri.setStc("${stc?.value}");${setMsg}
        retract($sri);
end`
  }

  generateTest(expectedResults: ExpectedResults): string {
    const ded = this.getDed(expectedResults.ded);
    const stc = this.getStc(expectedResults.stc);

    return `public IRunnableTest test${expectedResults.ticketNumber}(){
  RunnableTest test = new RunnableJsonTest();
  test.setTestId("${expectedResults.ticketNumber}");

  test.assertAllCopay(${expectedResults.copay});
  test.assertAllCoinsurance(${expectedResults.coins});${ded} ${stc}

  return test;
}`;
  }
  private getStc(stc: string) {
    if (!!stc) {
      return `
  test.assertAllStc("${stc}");`;
    }else{
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

  private getInNetWork(ruleCondition: RuleCondition | undefined) {
    if(ruleCondition==undefined){
      return '';
    }
    return `
            $inNetwork : this["InNetworkInd"] == "${ruleCondition.value}",`;
  }
  private getAllMsg(ruleCondition: RuleCondition | undefined) {
    if(ruleCondition==undefined){
      return '';
    }
    return `
            $msg : this["ALLMSG"] == "${ruleCondition.value}",`;
  }
  private getSetMsg(ruleCondition: RuleCondition | undefined) {
    if(ruleCondition==undefined){
      return '';
    }
    return `
        $sri.setMessage("${ruleCondition.value}");`;
  }

  private getPlanDesc(ruleCondition: RuleCondition | undefined) {
    if(ruleCondition==undefined){
      return '';
    }
    return `
        DalMap(
            this["SvcTypeCode"] == "30",
            this["BnftInfoCode"] == BenefitTypeCode.ActiveCoverage.code,
            $planDesc : this["PlanCvgeDesc"] == "${ruleCondition.value}"
        ) from $benefits
`;
  }

  private getMemberNum(ruleCondition: RuleCondition | undefined) {
    if(ruleCondition==undefined){
      return '';
    }
    const value = this.formatFieldValue(ruleCondition.value,ruleCondition.isNumber,ruleCondition.negate);
    return `
        DalMap(
            $memNum : this["EPISODE_INSURANCE.MemberNum"]${value}
        ) from $episode
`;
  }

  private getFieldName(fieldName: string) {
    if(fieldName == 'procedureCode'){
      return `dalDelivery["ProcedureCode"]`;
    }else{
      return fieldName;
    }
  }

  private getGroupNum(ruleCondition: RuleCondition | undefined) {
    if(ruleCondition==undefined){
      return '';
    }
    const value = this.formatFieldValue(ruleCondition.value,ruleCondition.isNumber,ruleCondition.negate);
    return `
        DalMap(
            $groupNum : this["EPISODE_INSURANCE.GroupNum"]${value}
        ) from $episode
`;
  }
}
