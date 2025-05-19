import { Component, OnInit } from '@angular/core';
import { RuleGeneratorService } from "./services/rule-generator.service";
import { ExpectedResults } from "./model/expectedResults";
import { FormBuilder, FormControl, FormGroup, Validators } from "@angular/forms";
import { Rule } from "./model/rule";
import { RuleCondition } from "./model/rule-condition";
import { TestingService } from './testing.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {

  test = '';
  rule = '';
  ruleForm!: FormGroup;
  conditionTypesByRuleType = new Map<string,Map<string,string>>();
  fieldNames: string[] = [
    'customerAbbr',
    'payerId',
    'recoPayerId',
    'revCode',
    'providerType',
    'providerId',
    'providerCode',
    'procedureCode',
    'patientType',
    'refId',
    'iiis',
    'bnftCvgeLevelCode',
    'medicalService',
    'memberNum',
    'groupNum',
    'planDesc',
    'inNetworkInd',
    'message',
    'stc'
  ];
  constructor(private ruleGeneratorService: RuleGeneratorService,private testingService: TestingService,
    private fb: FormBuilder) {
    this.ruleForm = this.fb.group({
      ticketNumber: new FormControl('', [Validators.required]),
      copay: new FormControl(''),
      coins: new FormControl(''),
      stc: new FormControl(''),
      ded: new FormControl(''),
      ruleName: new FormControl(''),
      customerAbbr: new FormControl(''),
      payerId: new FormControl(''),
      recoPayerId: new FormControl(''),
      revCode: new FormControl(''),
      providerType: new FormControl(''),
      patientType: new FormControl(''),
      providerId: new FormControl(''),
      medicalService: new FormControl(''),
      providerCode: new FormControl(''),
      memberNum: new FormControl(''),
      groupNum: new FormControl(''),
      planDesc: new FormControl(''),
      inNetworkInd: new FormControl(''),
      message: new FormControl(''),
      procedureCode: new FormControl(''),
      refId: new FormControl(''),
      iiis: new FormControl(''),
      bnftCvgeLevelCode: new FormControl('')
    });

    this.conditionTypesByRuleType = this.ruleGeneratorService.getConditionTypes();

  }
  testData() {
    this.ruleForm = this.fb.group({
      ticketNumber: new FormControl('35098456', [Validators.required]),
      copay: new FormControl('150.0'),
      coins: new FormControl('0.1'),
      stc: new FormControl('50'),
      ded: new FormControl(''),
      ruleName: new FormControl('Default to stc 50 for payerId LALALA'),
      customerAbbr: new FormControl('nkanse,nkansm'),
      payerId: new FormControl('LALALA'),
      recoPayerId: new FormControl('REC0013'),
      revCode: new FormControl('320-329,404,500-599,921'),
      providerType: new FormControl('34221'),
      patientType: new FormControl('Outpatient'),
      providerId: new FormControl('9976563'),
      medicalService: new FormControl('Hospital'),
      providerCode: new FormControl('23232'),
      memberNum: new FormControl('63123'),
      groupNum: new FormControl('999887'),
      planDesc: new FormControl('HOLA MUNDO'),
      inNetworkInd: new FormControl('Y'),
      message: new FormControl('Mensaje de prueba'),
      procedureCode: new FormControl('123'),
      refId: new FormControl('543'),
      iiis: new FormControl('768'),
      bnftCvgeLevelCode: new FormControl('10098')

    });
  }
  clearForm() {
    this.ruleForm.reset();
  }
  ngOnInit(): void {
  }

  generateRule(scope: string): void {
    if (this.ruleForm.invalid) {
      this.ruleForm.markAllAsTouched();
      return;
    }
    const ruleConditions: RuleCondition[] = [];


    this.fieldNames.forEach(fieldName => {
      if (!!this.ruleForm.value[fieldName]) {
        ruleConditions.push({
          fieldName: fieldName,
          isNumber: fieldName.match(/(revCode)/) != null,
          conditionType: this.conditionTypesByRuleType.get(scope)?.get(fieldName),
          value: this.ruleForm.value[fieldName]
        } as RuleCondition);
      }
    });

    const rule = {
      ticketNumber: this.ruleForm.value.ticketNumber,
      name: this.ruleForm.value.ruleName,
      ruleConditions: ruleConditions
    } as Rule;
    this.rule = this.ruleGeneratorService.generateRule(rule,scope);
  }

  generateTest(): void {
    if (this.ruleForm.valid) {
      let ded = undefined;
      if (this.ruleForm.value.ded == "true") {
        ded = true;
      }
      if (this.ruleForm.value.ded == "false") {
        ded = false;
      }
      const expectedResults = {
        ticketNumber: this.ruleForm.value.ticketNumber,
        copay: this.ruleForm.value.copay,
        coins: this.ruleForm.value.coins,
        stc: this.ruleForm.value.stc,
        ded
      } as ExpectedResults;
      this.test = this.testingService.generateTest(expectedResults);
    } else {
      this.ruleForm.markAllAsTouched();
    }

  }


}
