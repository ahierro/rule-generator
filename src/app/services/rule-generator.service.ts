import {Injectable} from '@angular/core';
import {ExpectedResults} from "../model/expectedResults";
import {Rule} from "../model/rule";

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
    this.aliases.set("providerCode", "$provider");

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
    return ` ${alias} : ${fieldName} ${formattedVal}`
  }

  generateRule(rule: Rule): string {
    return `//${rule.ticketNumber}
rule "${rule.name}"
    when
        $sri : StcResolutionInput(
            $episode : episode != null,
            $custAbbr : episode ["CustomerAbbr"] == "ASD",
            $payer : payerId == "ASD",
            $recoPayerId : recoPayerId == "ASD",
            $revCode : revCode == 121,
            $providerType : providerType == "HOSPITAL",
            $pType : patientType == "HOSPITAL",
            $provider : providerId == "",
            $mService : medicalService == "HOSPITAL",
            $provider : providerCode == "",
            $benefits : ebDalMaps != null
        )

        DalMap(
            $memNum : this["EPISODE_INSURANCE.MemberNum"] == ""
        )

        DalMap(
            this["SvcTypeCode"] == "30",
            this["BnftInfoCode"] == BenefitTypeCode.ActiveCoverage.code,
            $planDesc : this["PlanCvgeDesc"] == ""
        ) from $benefits

        $benefit : DalMap(
            $stc : this["SvcTypeCode"] == "4",
            $bic : this["BnftInfoCode"] in (BenefitTypeCode.CoInsurance.code, BenefitTypeCode.Copayment.code),
            $inNetwork : this["InNetworkInd"] == "Y",
            $msg : this["ALLMSG"] == "",
            $copay : this["BnftAmt"] != null ||
            $coins : this["BnftPercent"] != null
        ) from $benefits


    then
        $sri.setStc("4");
        $sri.setMessage("ASDAS");
        retract($sri):
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

}
