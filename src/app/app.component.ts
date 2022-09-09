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
      ticketNumber: new FormControl('1', [Validators.required]),
      copay: new FormControl('1'),
      coins: new FormControl('1'),
      stc: new FormControl('1'),
      ded: new FormControl('1'),
      ruleName: new FormControl('1'),
      custAbbr: new FormControl('1'),
      payerId: new FormControl('1'),
      recoPayerId: new FormControl('1'),
      revCode: new FormControl('1'),
      providerType: new FormControl('1'),
      patientType: new FormControl('1'),
      providerId: new FormControl('1'),
      medicalService: new FormControl('1'),
      providerCode: new FormControl('1'),
      memberNum: new FormControl('1'),
      planDesc: new FormControl('1'),
      inNetworkInd: new FormControl('1'),
      message: new FormControl('1')
    });
  }

  ngOnInit(): void {
  }

  generateRule(): void {
    const ruleConditions: RuleCondition[] = [];
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
    if (!!this.ruleForm.value.patientType) {
      ruleConditions.push({
        fieldName: 'patientType',
        isNumber: false,
        conditionType: "StcResolutionInput",
        value: this.ruleForm.value.patientType
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
    if (!!this.ruleForm.value.medicalService) {
      ruleConditions.push({
        fieldName: 'medicalService',
        isNumber: false,
        conditionType: "StcResolutionInput",
        value: this.ruleForm.value.medicalService
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

    if (!!this.ruleForm.value.memberNum) {
      ruleConditions.push({
        fieldName: 'memberNum',
        isNumber: false,
        conditionType: "memberNum",
        value: this.ruleForm.value.memberNum
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
        conditionType: "inNetworkInd",
        value: this.ruleForm.value.inNetworkInd
      } as RuleCondition);
    }
    if (!!this.ruleForm.value.message) {
      ruleConditions.push({
        fieldName: 'message',
        isNumber: false,
        conditionType: "message",
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
      customerAbbr: this.ruleForm.value.custAbbr,
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
