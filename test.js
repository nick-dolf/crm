const fse = require("fs-extra");
console.log("running test");

let test = [];

test["name"] ={id: 29938, name: 'name1'};
test["gas"] ={id: 32994, name: 'name1'};

console.log(typeof(test))


fse.writeJsonSync("test.json", test);
