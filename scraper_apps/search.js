////////// use this to find coordinates (currently is written for the map tool) //////////
// function printMousePosDoc(event) {
//   console.log("X: " + ((event.clientX)-781) + " /// Y: " + ((event.clientY)-395));
//   console.log("X: " + (event.clientX) + " /// Y: " + (event.clientY);
// }
// document.querySelector('#counties').addEventListener("click", printMousePosDoc); 
// printMousePosDoc();
////////// use this to find coordinates (currently is written for the map tool) ////////// 

const fs = require("fs");
const { performance } = require('perf_hooks');
const { Builder, By } = require("selenium-webdriver");
const chrome = require('selenium-webdriver/chrome');
const { findSafariDriver } = require("selenium-webdriver/safari");
const excel = require("exceljs");
function sleep(time) {
    return new Promise((resolve) => {
      setTimeout(()=> {
        resolve();
      }, time); 
    });
};

async function open(){
    let driver = await new Builder().forBrowser("chrome").build();
    await driver.get("https://shiny-apps.ceh.ac.uk/pollutionremoval/");
    setTimeout(() => {
        driver.findElement(By.xpath('//*[@id="shiny-modal"]/div/div/div[3]/button')).click().then(
            setTimeout(() => {
                driver.findElement(By.xpath('//*[@id="counties"]/div[2]/div[1]/div/a[2]')).click();  
            }, 2000) // 2 seconds
            ) 
    }, 5000); // 5 seconds 
};

async function search() {
    var startTime = performance.now();
    var time = new Date();
    console.log(`started at: ${time.getHours()}:${time.getMinutes()}`);

    // let driver = await new Builder().forBrowser("chrome").setChromeOptions(new chrome.Options().headless()).build();
    let driver = await new Builder().forBrowser("chrome").build();
    await driver.get("https://shiny-apps.ceh.ac.uk/pollutionremoval/");
    
    let locations = [];
    //i need to delay this operation because the button that is to be clicked does not show up right away
    setTimeout(() => {
        driver.findElement(By.xpath('//*[@id="shiny-modal"]/div/div/div[3]/button')).click().then(
            setTimeout(() => {
                driver.findElement(By.xpath('//*[@id="counties"]/div[2]/div[1]/div/a[2]')).click();
                let map = driver.findElement(By.xpath('//*[@id="counties"]'));

                class Location {
                    constructor(x, y, name, areaOfWoodland, totalArea, population, pmRmvedByWoodland, pmRemovalRate, assetVal, assetValperHa, existingWoodland, woodlandPlanted, changeInAssetValue){
                        this.x = x;
                        this.y = y;
                        this.name = name;
                        this.areaOfWoodland = areaOfWoodland;
                        this.totalArea = totalArea;
                        this.population = population;
                        this.pmRmvedByWoodland = pmRmvedByWoodland;
                        this.pmRemovalRate = pmRemovalRate;
                        this.assetVal = assetVal;
                        this.assetValperHa = assetValperHa;
                        this.existingWoodland = existingWoodland;
                        this.woodlandPlanted = woodlandPlanted;
                        this.changeInAssetValue = changeInAssetValue;
                    };
                };
                
                let locationNames = [];
                setTimeout( async () => {
                    
                    let t1 = 0;
                    let t2 = 1;
                    let t3 = 2;

                    let searchGrids = require('./searchGrids');

                    for(i = 0; i < searchGrids.length; i++){
                        for(xc = searchGrids[i].leftx; xc <= searchGrids[i].rightx; xc++){
                            for(yc = searchGrids[i].topy; yc <= searchGrids[i].bottomy; yc++){
                                driver.actions().move({x: xc, y: yc, origin: map}).click().perform();
                               
                                while(true){
                                    try{
                                        const [localAuthorityVar,areaOfWoodVar,totalAreaVar,popVar,pmrmvdbottomyWoodVar,pmrmvRateVar,assetValVar,assetValperHaVar,existingWoodVar,woodPlantedVar,assetValChangeVar] = 
                                        await Promise.all([
                                            driver.findElement(By.xpath(`//*[@id="DataTables_Table_${t1}"]/tbody/tr[1]/td[2]`)).getText(),
                                            driver.findElement(By.xpath(`//*[@id="DataTables_Table_${t1}"]/tbody/tr[2]/td[2]`)).getText(),
                                            driver.findElement(By.xpath(`//*[@id="DataTables_Table_${t1}"]/tbody/tr[3]/td[2]`)).getText(),
                                            driver.findElement(By.xpath(`//*[@id="DataTables_Table_${t1}"]/tbody/tr[4]/td[2]`)).getText(),                        
                                            driver.findElement(By.xpath(`//*[@id="DataTables_Table_${t3}"]/tbody/tr/td[2]`)).getText(),
                                            driver.findElement(By.xpath(`//*[@id="DataTables_Table_${t3}"]/tbody/tr/td[3]`)).getText(),
                                            driver.findElement(By.xpath(`//*[@id="DataTables_Table_${t3}"]/tbody/tr/td[4]`)).getText(),
                                            driver.findElement(By.xpath(`//*[@id="DataTables_Table_${t3}"]/tbody/tr/td[5]`)).getText(),                       
                                            driver.findElement(By.xpath(`//*[@id="DataTables_Table_${t2}"]/tbody/tr[1]/td[2]`)).getText(),
                                            driver.findElement(By.xpath(`//*[@id="DataTables_Table_${t2}"]/tbody/tr[2]/td[2]`)).getText(),
                                            driver.findElement(By.xpath(`//*[@id="DataTables_Table_${t2}"]/tbody/tr[3]/td[2]`)).getText()
                                        ]);
                                        t1 = t1+3;
                                        t2 = t2+3;
                                        t3 = t3+3;                                        
                                        location = new Location(xc, yc, localAuthorityVar,areaOfWoodVar,totalAreaVar,popVar,pmrmvdbottomyWoodVar,pmrmvRateVar,assetValVar,assetValperHaVar,existingWoodVar,woodPlantedVar,assetValChangeVar);
                                        if(locationNames.includes(location.name)){
                                            break;
                                        } else {
                                            locations.push(location);
                                            locationNames.push(location.name);
                                            console.log(`(${i}) ${location.name} -- id: ${searchGrids[i].id}`);
                                        };
                                        break;
                                    } catch {
                                        sleep(50);
                                    };
                                };
                            };
                        }; // this is for the for loop for the grid
                    }  // this is the for loop for each search   
                    console.log('\nnumber of locations written to pm25 file: '+locations.length);
                    console.log('number of names written to allNames file: '+locationNames.length);
                    var endTime = performance.now();
                    console.log(`all of the searches took ${(endTime - startTime)/60000} minutes`);
                      
                    fs.writeFileSync('allNames.txt', JSON.stringify(locationNames), 'utf-8');
                    fs.writeFileSync('pm25data.txt', JSON.stringify(locations, null, "\t"), 'utf-8');   
                    
                    // write to excel
                    let workbook = new excel.Workbook();
                    let worksheet = workbook.addWorksheet('2019');   
                    worksheet.columns = [
                        { header: 'Local Authority'},
                        { header: 'Area of Woodland (ha)'},
                        { header: 'Total area of Local Authority (ha)'},
                        { header: 'Population'},
                        { header: 'PM2.5 removed by woodland (kg/year)'},
                        { header: 'PM2.5 removal rate per ha woodland (kg/ha year)'},
                        { header: 'Asset value of PM2.5 removal (£ million, 2019 prices)'},
                        { header: 'Asset value of PM2.5 removal per ha (£/ha, 2019 prices)'},
                        { header: 'Existing Woodland (ha)'},
                        { header: 'Change in asset value per ha (£, PV 100, 2019 prices)'}
                    ];
                    worksheet.columns.forEach((column) => {
                        column.width = column.header.length < 12 ? 12 : column.header.length;
                      });
                    worksheet.getRow(1).font = { bold: true };
                    locations.forEach(e => {
                        worksheet.addRow(
                            [
                                e.name, 
                                e.areaOfWoodland, 
                                e.totalArea, 
                                e.population, 
                                e.pmRmvedByWoodland, 
                                e.pmRemovalRate, 
                                e.assetVal, 
                                e.assetValperHa, 
                                e.existingWoodland, 
                                e.changeInAssetValue
                            ]);
                        worksheet.addTable;
                    });
                    workbook.xlsx.writeFile('Pollution Removal by Vegetation');
                }, 2000);
            }, 2000) // 2 seconds
        ) 
    }, 5000); // 5 seconds
// await driver.quit(); //right now this is activated before the above click can happen -- need to find a way to execute this only when everything is done
};

search();
// open();

// function createExcel(){
//     let workbook = new excel.Workbook();
//     let worksheet = workbook.addWorksheet('2019');   
//     worksheet.columns = [
//         { header: 'Local Authority'},
//         { header: 'Area of Woodland (ha)'},
//         { header: 'Total area of Local Authority (ha)'},
//         { header: 'Population'},
//         { header: 'PM2.5 removed by woodland (kg/year)'},
//         { header: 'PM2.5 removal rate per ha woodland (kg/ha year)'},
//         { header: 'Asset value of PM2.5 removal (£ million, 2019 prices)'},
//         { header: 'Asset value of PM2.5 removal per ha (£/ha, 2019 prices)'},
//         { header: 'Existing Woodland (ha)'},
//         { header: 'Change in asset value per ha (£, PV 100, 2019 prices)'}
//     ];
//     worksheet.columns.forEach((column) => {
//         column.width = column.header.length < 12 ? 12 : column.header.length;
//         });
//     worksheet.getRow(1).font = { bold: true };
//     arr.forEach(e => {
//         worksheet.addRow(
//             [
//                 e.name, 
//                 e.areaOfWoodland, 
//                 e.totalArea, 
//                 e.population, 
//                 e.pmRemovedbottomyWoodland, 
//                 e.pmRemovalRate, 
//                 e.assetVal, 
//                 e.assetValperHa, 
//                 e.existingWoodland, 
//                 e.changeInAssetValue
//             ]);
//         worksheet.addTable;
//     });
//     workbook.xlsx.writeFile('Pollution Removal by Vegetation');
// };


// createExcel();