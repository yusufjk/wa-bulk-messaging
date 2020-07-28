const puppeteer = require('puppeteer');
const config = require('./config')
const fs = require('fs')
const XLSX = require('xlsx');

const start = async () => {
const loginSelector = '._1QUKR';
const sendButtonSelector = '._1U1xa';
const invalidButtonSelector = '.S7_rT FV2Qy';

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
    const precontent = getContent(contactName)
    let content = encodeURI(precontent)
    await page.goto('https://web.whatsapp.com/send?phone='+contactNo+'&text='+content).catch(error => {
      console.log("Error while calling API. \n", error)
    })
    await page.on('dialog', async dialog => {
      await dialog.accept()
    }) 
	
	try {
		await page.waitForSelector(sendButtonSelector,{timeout:10000});
		await page.click(sendButtonSelector);
		console.log('sent message successfully to :: '+contactNo);
		reportData.push([contactNo,contactName,"Delivered"]);
	}catch(e){
    console.log(e);
		console.log('could not send message :: '+contactNo)
		reportData.push([contactNo,contactName,"Not Delivered"]);
	}
	await page.waitFor(1000)
  }
  
  await page.waitFor(1000)
  browser.close()

  var worksheet = XLSX.utils.aoa_to_sheet(reportData);

/* Add the worksheet to the workbook */

XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
XLSX.writeFile(workbook, 'DeliveryReport.xlsx');

  console.log("Report Generated");
}

start()

const getContact = (path) => {
  const contact = fs.readFileSync(path, {encoding: 'utf-8'})
  return contact;
}

const getContent = (name) => {
  const content = `*Afzalus Salaam*,
  _${name}_,
  As per your response on the feedback form for HSB-Bangalore, we invite you to our official group on telegram for better communication with out esteemed members. Please join with below given link.`
  return content;
}