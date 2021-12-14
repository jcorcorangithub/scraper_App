const fs = require("fs");

const puppeteer = require("puppeteer");
const excel = require("exceljs");
const { get } = require("http");
const { error } = require("console");
const { toUnicode } = require("punycode");
const urlDiscountRates =
  "https://www.gov.uk/government/publications/the-green-book-appraisal-and-evaluation-in-central-governent/the-green-book-2020";
const urlDiscountRatesPDF =
  "https://assets.publishing.service.gov.uk/government/uploads/system/uploads/attachment_data/file/938046/The_Green_Book_2020.pdf";

// async function getPDF() {
//   const browser = await puppeteer.launch();
//   const page = await browser.newPage();
//   await page.goto(urlDiscountRatesPDF);
//   await page.pdf({ path: "discountRates.pdf", format: "a4" });
//   await browser.close();
// }
// getPDF();

// let file = fs.readFileSync(getPDF());
// let file = fs.readFileSync(urlDiscountRatesPDF);

// pdf(file).then(function(data) {
//     console.log(data.version);
//     console.log(data.text);
// });
////////////////////////////////////////////////////////


async function scrapeProduct(
  url,
  tableHeaderId,
  tableContent,
  nameOfTable,
  nameOfWorksheet,
  nameOfFile
) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto(url);

  //table header
  const [h] = await page.$x(`${tableHeaderId}`);
  const header = await h.getProperty("textContent");
  const headerTxt = await header.jsonValue();

  //table content (including column headers)
  const [t] = await page.$x(`${tableContent}`);
  const table = await t.getProperty("innerText");
  const tableData = await table.jsonValue();

  let columnHeaderStr = tableData.split("\n")[0]; // this makes the row into one big string -- the index of 0 is the first row of tableData
  let columnHeaderArray = columnHeaderStr.split("\t"); // this separates each word in the string - one word for one column

  ////////////// figure out how to not re-write the file after the first search
  //// i might have to look at the file (if it is there) and see if there is a table already, if so create a new worksheet
  function setWorksheetName(worksheet) {
    return (object[worksheet] = `${nameOfWorksheet}`);
  }
  let workbook = new excel.Workbook();
  let worksheet = workbook.addWorksheet(`${nameOfTable}`);
  setWorksheetName(worksheet);

  /////////    I need to eventually find a way to find number of columns then create those columns as opposed to manually 
  ////////      inputting the number of columns 
  // let columns = [];
  // columnHeaderArray.forEach(el => {
  //     columns.append({header: `${el}`});
  // });
  // worksheet.addColumn

  worksheet.columns = [
    { header: `${columnHeaderArray[0]}` },
    { header: `${columnHeaderArray[1]}` },
    { header: `${columnHeaderArray[2]}` },
  ];

  worksheet.columns.forEach((column) => {
    column.width = column.header.length < 12 ? 12 : column.header.length;
  });
  worksheet.getRow(1).font = { bold: true };

  arrayOfRows = tableData.split("\n");
  arrayOfRows.shift();

  let arrOfArrays = [];
  let array1 = [];
  let array2 = [];
  let counter = 1;
  arrayOfRows.forEach((e, index) => {
    //break up each row into an array -- in effect separating each string
    let arr = arrayOfRows[index].split("\t"); // each row will be split by word and placed into arr
    // console.log(arr[0].length);

    let arr1 = [];
    let arr2 = [];

    //iterate through each row/arr item of arr
    for (i = 0; i < arr.length; i++) {
      //if the word comes up while the counter is at 1 2 or 3 then add to array1, otherwise padd to array2
      if (counter < 4) {
        arr1.push(arr[i]);
        counter++;
      } else if (counter > 3 && counter < 7) {
        arr2.push(arr[i]);
        counter++;
      }

      if (counter == 7) {
        array1.push(arr1);
        array2.push(arr2);
        counter = 1;
        arr1 = [];
        arr2 = [];
      }
    }
  });

  //now each array in arrOfArray will eventually be a row in the excel file and we will place each element / arrOfArray[i] under their respective columns
  arrOfArrays = arrOfArrays.concat(array1);
  arrOfArrays = arrOfArrays.concat(array2);

  arrOfArrays.forEach((row) => {
    worksheet.addRow([row[0], row[1], row[2]]);
    worksheet.addTable;
  });

  workbook.xlsx.writeFile(`${nameOfFile}`);
  browser.close();
}

// scrapeProduct(urlDiscountRates, '//*[@id="table-8-health-discount-rates-and-associated-discount-factors"]', '//*[@id="contents"]/div[3]/div/div/div/table[12]', 'Health Discount Rates Table 8', 'Table 8', 'appraisal-and-evaluation-in-central-governent.xlsx');
// scrapeProduct(urlDiscountRates, '//*[@id="table-7-standard-discount-rates-and-associated-discount-factors"]', '//*[@id="contents"]/div[3]/div/div/div/table[11]', 'Standard Discount Rates Table 7', 'Table 7', 'appraisal-and-evaluation-in-central-governent.xlsx');
