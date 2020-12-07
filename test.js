const { Builder, By, Key, util } = require("selenium-webdriver");
require("chromedriver");

async function testCase() {
  let driver = await new Builder().forBrowser("chrome").build();
  await driver.get("http://localhost:3000/");
  await driver.findElement(By.name("q")).sendKeys("Selenium Test", Key.RETURN);
}

testCase();
