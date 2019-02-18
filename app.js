const mysql = require('mysql');
var express = require('express');
var app = express();

//mysql
var connection = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "scrap"
});

connection.connect();


app.get('/result', async function(req, res){
//res.writeHead(200)
res.writeHead(200, {
  'Content-Type': 'text/plain; charset=utf-8'
});
  res.write('Znalezione słowa: \n')
  res.write('\n');
  connection.query("SELECT word, domain, text FROM keyWords WHERE shown = 0", function(err, result, fields) {
    Object.keys(result).forEach(function(key) {
      var row = result[key];
      res.write("fraza: " + row.word + '\n');
      res.write("została odnaleziona na stronie: " + row.domain + '\n');
      res.write("w akapicie: " + row.text+ '\n');
      res.write('\n');
    });
    res.end();
  });
  connection.query("UPDATE keywords SET shown = 1 WHERE shown = 0");
})
app.listen(3000);
