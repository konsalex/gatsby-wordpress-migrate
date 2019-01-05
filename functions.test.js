const cli = require("./functions");

function StartTesting(XMLData) {
  test("ToBeAdded", () => {
    expect(3).toBe(3);
  });
}

function StartProcedure() {
  fs.readFile("./example/wordpressdata.xml", function(err, data) {
    parser.parseString(data, function(err, result) {
      StartTesting(result);
    });
  });
}
