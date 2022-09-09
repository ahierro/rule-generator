import {Component, OnInit} from '@angular/core';
import {RuleGeneratorService} from "./services/rule-generator.service";
import {ExpectedResults} from "./model/expectedResults";
import {FormBuilder, FormControl, FormGroup, Validators} from "@angular/forms";
import {Rule} from "./model/rule";

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
      ded: new FormControl('')
    });
  }

  ngOnInit(): void {
  }
  generateRule(): void{
    const rule = {
      ticketNumber: this.ruleForm.value.ticketNumber
    } as Rule;
    this.rule = this.ruleGeneratorService.generateRule(rule);
  }
  generateTest(): void {
    if (this.ruleForm.valid) {
      let ded = undefined;
      if(this.ruleForm.value.ded == "true"){
        ded = true;
      }
      if(this.ruleForm.value.ded == "false"){
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
