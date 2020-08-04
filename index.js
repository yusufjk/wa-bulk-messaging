const puppeteer = require('puppeteer');
const config = require('./config')
const XLSX = require('xlsx');
const { exit } = require('process');
const { getContent , getContact } =  require('./utils');

const start = async () => {
  const loginSelector = '._1QUKR';
  const sendButtonSelector = '._1U1xa';
  const textKeyboardSelector = '._3FRCZ.copyable-text.selectable-text';
  
  const browser = await puppeteer.launch({
    headless: false,
    userDataDir: './user_data'
  })
  var page = await browser.newPage();
  const userAgent = 'Mozilla/5.0 (X11; Linux x86_64)' +
  'AppleWebKit/537.36 (KHTML, like Gecko) Chrome/64.0.3282.39 Safari/537.36';
  await page.setUserAgent(userAgent).catch(error => {
    console.log("Error while setting agent. \n",error)
  });
  await page.goto('http://web.whatsapp.com').catch(error => {
  console.log("Error while loading whatsapp web. \n",error)
})
await page.waitForSelector (loginSelector, {timeout: 60000}).catch(error => {
  console.log("Error while logging in to whatsapp. \n", error)
})

let contactlist = getContact(config.contact)
contactlist = contactlist.split(/\r?\n/)

var workbook = XLSX.utils.book_new();
var sheetName = "Delivery Report";

/* make worksheet */
var reportData = [
  [ "Number", "Name", "Delivery Status" ]
];

for (const contact of contactlist) {
  const contactNo = contact.split(",")[0];
  const contactName = contact.split(",")[1] || '';
  const precontent = getContent(config.content,contactName)
  let content = encodeURI(precontent)

  try {
    await page.goto('https://web.whatsapp.com/send?phone='+contactNo+'&text='+content);
  }
  catch(e){
    console.log("Error while calling API. \n", e)
    console.log('\n could not send message :: '+contactNo);
    reportData.push([contactNo,contactName,"Not Delivered"]);
    continue;
  }


await page.once('dialog', async dialog => {
  await dialog.accept()
})


try {
  await page.waitForSelector (sendButtonSelector, {timeout: 10000}).catch(error => {
    console.log("Count not find send button selector \n", error)
    process.exit(1);
  })
  await page.waitFor(3000);
  await page.click(sendButtonSelector);
  console.log('sent message successfully to :: '+contactNo);
  reportData.push([contactNo,contactName,"Delivered"]);
}catch(e){
  console.log(e);
  console.log('could not send message :: '+contactNo)
  reportData.push([contactNo,contactName,"Not Delivered"]);
}
await page.waitFor(7000)
}

await page.waitFor(3000)
browser.close()

var worksheet = XLSX.utils.aoa_to_sheet(reportData);

/* Add the worksheet to the workbook */

XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
XLSX.writeFile(workbook, 'DeliveryReport.xlsx');

console.log("Report Generated");
}

start();