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
	await page.waitFor(2000)
  }

  await page.waitFor(2000)
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
  const content = `*Baad As Salaam il Jameel* _${name}_,

*MSB Educational Institute Bangalore* has been the second home of its students for more than three decades now, the family increasing in its count each year, crossing the figure of a hundreds of alumni.

The Alumni of MSB worldwide are proudly called *Hizb us Saifiya til Burhaniyah*, not only because they have spent foundation-days of their lives in MSB Educational Institute, but because they still hold the values that they have acquired here closely guarded in their hearts, on their faces, in their Deeni Shi'aar, in their actions, in their words and most importantly in their thoughts.

With Raza Mubarak of *Aqa Maula* TUS *Hizb us Saifiya til Burhaniyah* committee has been appointed in all the centres and they participate in various khidmats and activities.

MSB Bangalore is further structuring its HSB family. To keep all its members abreast of the latest happenings, it is imperative to have a strong and effective communication system.

With that aim in mind the HSB body has formulated the following system and we would like every member of the HSB to be part of it :

*Telegram* is the communication application we will be using going forward for all communications and co-ordination activities amongst HSB members in Bangalore.

Please join our Telegram group via -  https://t.me/joinchat/Fjt0qVVSKNUNKQngn-ZXvg

In the coming days we will be gradually inviting HSB members who have shared their contact information with us in the survey.
To streamline group management we request you to please *not share* the invite with other HSB members. We are in process to build a registration system for HSB members and we will be inviting as many members on this platform in the coming days.

*Wassalam*`

  return content;
}