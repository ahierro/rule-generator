import { Injectable } from '@angular/core';
import { ExpectedResults } from "./model/expectedResults";

@Injectable({
  providedIn: 'root'
})
export class TestingService {

  constructor() { }

  generateTest(expectedResults: ExpectedResults): string {
    const ded = this.getDed(expectedResults.ded);
    const copay = this.getCopay(expectedResults.copay);
    const coins = this.getCoins(expectedResults.coins);
    return `public IRunnableTest test${expectedResults.ticketNumber}(){
  RunnableTest test = new RunnableJsonTest();
  test.setTestId("${expectedResults.ticketNumber}");${copay} ${coins} ${ded}
  return test;
}`;
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

  private getCoins(coins: string) {
    if (!!coins) {
      return `
  test.assertAllCoinsurance(${coins});`;
    } else {
      return '';
    }
  }
  private getCopay(copay: string) {
    if (!!copay) {
      return `
  test.assertAllCopay(${copay});`;
    } else {
      return '';
    }
  }

}
