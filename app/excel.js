var excel = require('node-excel-export');

module.exports = function(data){
// You can define styles as json object 
// More info: https://github.com/protobi/js-xlsx#cell-styles 
var styles = {
  headerBlue: {
    fill: {
      fgColor: {
        rgb: 'FF5BC2EC'
      }
    },
    font: {
      color: {
        rgb: 'FFFFFFFF'
      },
      sz: 14,
      bold: true,
      underline: false
    }
  },
  cellPink: {
    fill: {
      fgColor: {
        rgb: 'FFFFCCFF'
      }
    }
  },
  cellGreen: {
    fill: {
      fgColor: {
        rgb: 'FF00FF00'
      }
    }
  }
};
 
//Array of objects representing heading rows (very top) 
console.log(data);
 
//Here you specify the export structure 
var specification = {
  imei: { // <- the key should match the actual data key 
    displayName: 'IMEI', // <- Here you specify the column header 
    headerStyle: styles.headerBlue, // <- Header style 
    width: 120 // <- width in pixels 
  },
  longVersion: {
    displayName: 'Version(SW)',
    headerStyle: styles.headerBlue,
    //cellFormat: function(value, row) { // <- Renderer function, you can access also any row.property 
//      return (value == 1) ? 'Active' : 'Inactive';
    //},
    width: 120 // <- width in chars (when the number is passed as string) 
  },
  hwVersion: {
    displayName: 'Version(HW)',
    headerStyle: styles.headerBlue,
    //cellStyle: styles.cellPink, // <- Cell style 
    width: 120 // <- width in pixels 
  },
  date: {
    displayName: 'Last Online',
    headerStyle: styles.headerBlue,
    //cellStyle: styles.cellPink, // <- Cell style 
    width: 120 // <- width in pixels 
  }
};
 
// The data set should have the following shape (Array of Objects) 
// The order of the keys is irrelevant, it is also irrelevant if the 
// dataset contains more fields as the report is build based on the 
// specification provided above. But you should have all the fields 
// that are listed in the report specification 
var dataset = [
  {imei: 'IBM', longVersion: 1, hwVersion: 'some hwVersion', misc: 'not shown'},
  {imei: 'HP', longVersion: 0, hwVersion: 'some hwVersion'},
  {imei: 'MS', longVersion: 0, hwVersion: 'some note', misc: 'not shown'}
];
 
// Create the excel report. 
// This function will return Buffer 
var report = excel.buildExport(
  [ // <- Notice that this is an array. Pass multiple sheets to create multi sheet report 
    {
      name: 'Sheet name', // <- Specify sheet name (optional) 
      specification: specification, // <- Report specification 
      data: data // <-- Report data 
    }
  ]
);

return report;
 
};