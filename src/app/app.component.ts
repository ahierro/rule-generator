import {Component, OnInit} from '@angular/core';
import {RuleGeneratorService} from "./services/rule-generator.service";
import {ExpectedResults} from "./model/expectedResults";
import {FormBuilder, FormControl, FormGroup, Validators} from "@angular/forms";
import {Rule} from "./model/rule";
import {RuleCondition} from "./model/rule-condition";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {

  test = '';
  rule = '';
  ruleForm!: FormGroup;

  constructor(private ruleGeneratorService: RuleGeneratorService,
              private fb: FormBuilder) {
    this.ruleForm = this.fb.group({
      ticketNumber: new FormControl('', [Validators.required]),
      copay: new FormControl(''),
      coins: new FormControl(''),
      stc: new FormControl(''),
      ded: new FormControl(''),
      ruleName: new FormControl(''),
      custAbbr: new FormControl(''),
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
  }
  testData(){
    this.ruleForm = this.fb.group({
      ticketNumber: new FormControl('35098456', [Validators.required]),
      copay: new FormControl('150.0'),
      coins: new FormControl('0.1'),
      stc: new FormControl('50'),
      ded: new FormControl(''),
      ruleName: new FormControl('Default to stc 50 for payerId LALALA'),
      custAbbr: new FormControl('nkanse,nkansm'),
      payerId: new FormControl('LALALA'),
      recoPayerId: new FormControl('REC0013'),
      revCode: new FormControl('401,383'),
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
  clearForm(){
    this.ruleForm.reset();
  }
  ngOnInit(): void {
  }

  generateRule(): void {
    if (this.ruleForm.invalid){
      this.ruleForm.markAllAsTouched();
      return;
    }
    const ruleConditions: RuleCondition[] = [];
    if (!!this.ruleForm.value.custAbbr) {
      ruleConditions.push({
        fieldName: 'customerAbbr',
        isNumber: false,
        conditionType: "StcResolutionInput",
        value: this.ruleForm.value.custAbbr
      } as RuleCondition);
    }
    if (!!this.ruleForm.value.payerId) {
      ruleConditions.push({
        fieldName: 'payerId',
        isNumber: false,
        conditionType: "StcResolutionInput",
        value: this.ruleForm.value.payerId
      } as RuleCondition);
    }
    if (!!this.ruleForm.value.recoPayerId) {
      ruleConditions.push({
        fieldName: 'recoPayerId',
        isNumber: false,
        conditionType: "StcResolutionInput",
        value: this.ruleForm.value.recoPayerId
      } as RuleCondition);
    }
    if (!!this.ruleForm.value.revCode) {
      ruleConditions.push({
        fieldName: 'revCode',
        isNumber: true,
        conditionType: "StcResolutionInput",
        value: this.ruleForm.value.revCode
      } as RuleCondition);
    }
    if (!!this.ruleForm.value.providerType) {
      ruleConditions.push({
        fieldName: 'providerType',
        isNumber: false,
        conditionType: "StcResolutionInput",
        value: this.ruleForm.value.providerType
      } as RuleCondition);
    }
    if (!!this.ruleForm.value.providerId) {
      ruleConditions.push({
        fieldName: 'providerId',
        isNumber: false,
        conditionType: "StcResolutionInput",
        value: this.ruleForm.value.providerId
      } as RuleCondition);
    }
    if (!!this.ruleForm.value.providerCode) {
      ruleConditions.push({
        fieldName: 'providerCode',
        isNumber: false,
        conditionType: "StcResolutionInput",
        value: this.ruleForm.value.providerCode
      } as RuleCondition);
    }
    if (!!this.ruleForm.value.procedureCode) {
      ruleConditions.push({
        fieldName: 'procedureCode',
        isNumber: false,
        conditionType: "StcResolutionInput",
        value: this.ruleForm.value.procedureCode
      } as RuleCondition);
    }
    if (!!this.ruleForm.value.patientType) {
      ruleConditions.push({
        fieldName: 'patientType',
        isNumber: false,
        conditionType: "StcResolutionInput",
        value: this.ruleForm.value.patientType
      } as RuleCondition);
    }
    if (!!this.ruleForm.value.refId) {
      ruleConditions.push({
        fieldName: 'refId',
        isNumber: false,
        conditionType: "Benefit",
        value: this.ruleForm.value.refId
      } as RuleCondition);
    }
    if (!!this.ruleForm.value.iiis) {
      ruleConditions.push({
        fieldName: 'iiis',
        isNumber: false,
        conditionType: "Benefit",
        value: this.ruleForm.value.iiis
      } as RuleCondition);
    }
    if (!!this.ruleForm.value.bnftCvgeLevelCode) {
      ruleConditions.push({
        fieldName: 'bnftCvgeLevelCode',
        isNumber: false,
        conditionType: "Benefit",
        value: this.ruleForm.value.bnftCvgeLevelCode
      } as RuleCondition);
    }
    if (!!this.ruleForm.value.medicalService) {
      ruleConditions.push({
        fieldName: 'medicalService',
        isNumber: false,
        conditionType: "StcResolutionInput",
        value: this.ruleForm.value.medicalService
      } as RuleCondition);
    }

    if (!!this.ruleForm.value.memberNum) {
      ruleConditions.push({
        fieldName: 'memberNum',
        isNumber: false,
        conditionType: "episode",
        value: this.ruleForm.value.memberNum
      } as RuleCondition);
    }
    if (!!this.ruleForm.value.groupNum) {
      ruleConditions.push({
        fieldName: 'groupNum',
        isNumber: false,
        conditionType: "episode",
        value: this.ruleForm.value.groupNum
      } as RuleCondition);
    }
    if (!!this.ruleForm.value.planDesc) {
      ruleConditions.push({
        fieldName: 'planDesc',
        isNumber: false,
        conditionType: "planDesc",
        value: this.ruleForm.value.planDesc
      } as RuleCondition);
    }
    if (!!this.ruleForm.value.inNetworkInd) {
      ruleConditions.push({
        fieldName: 'inNetworkInd',
        isNumber: false,
        conditionType: "Benefit",
        value: this.ruleForm.value.inNetworkInd
      } as RuleCondition);
    }
    if (!!this.ruleForm.value.message) {
      ruleConditions.push({
        fieldName: 'message',
        isNumber: false,
        conditionType: "Benefit",
        value: this.ruleForm.value.message
      } as RuleCondition);
    }
    if (!!this.ruleForm.value.stc) {
      ruleConditions.push({
        fieldName: 'stc',
        isNumber: false,
        conditionType: "stc",
        value: this.ruleForm.value.stc
      } as RuleCondition);
    }
    const rule = {
      ticketNumber: this.ruleForm.value.ticketNumber,
      name: this.ruleForm.value.ruleName,
      ruleConditions: ruleConditions
    } as Rule;
    this.rule = this.ruleGeneratorService.generateRule(rule);
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
      this.test = this.ruleGeneratorService.generateTest(expectedResults);
    } else {
      this.ruleForm.markAllAsTouched();
    }

  }


}
