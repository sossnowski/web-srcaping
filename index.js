/*
 * the program checking if in given url website are there changes. If there are program starting searching keywords and if fing save the file and keywords
 *
 *
 */
const request = require('request');
var rp = require('request-promise');
//const cheerio = require('cheerio');
const cheerio = require('cheerio');
const extractor = require('unfluff');
const puppeteer = require('puppeteer');
const fs = require('fs');
const mkdirp = require('mkdirp');
const mysql = require('mysql');
const Site = require('./site.js');

//mysql
var connection = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "scrap"
});

connection.connect();

var mainPages = [];


var keyWords = new Array();
keyWords[0] = "word 1";
keyWords[1] = "word 2";
keyWords[2] = "word 3";

var found = [];
var find = false;




async function takeContent(url, site) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  var content = '';
  try {
    await page.goto(url);
    content = await page.content();
  } catch (e) {
    console.log(e);
  }

  await browser.close();
  return content;
}


async function checkWords(content, mainName, subName) {

  //console.log(content.length)
  $ = cheerio.load(content);
  //console.log($)
  var text = $('body').text();
  var pureText = text.replace(/\s+/g, '');
  //console.log(text)
  //read file wheather there are diffrences
  connection.query("INSERT INTO contents SET ?", {
    mainName: mainName,
    subName: subName,
    content: pureText
  }, function(err, result) {
    if (err) {
      console.log(err);
    }
  });
  for (var i = 0; i < text.length; i++) {
    for (var z = 0; z < keyWords.length; z++) {
      var isCorrectWord = '';

      for (var j = i; j < i + keyWords[z].length; j++) {
        isCorrectWord += text[j];
      }
      //console.log(isCorrectWord);
      if (keyWords[z] == isCorrectWord) {
        find = true;
        if (!found.includes(isCorrectWord)) {
          found.push(isCorrectWord);
          var allPhrase = '';
          var counter = i;
          while (text[counter] != '\n') {
            counter--;
          }
          counter++;
          while (text[counter] != '\n') {
            allPhrase += text[counter];
            counter++;
          }
          //console.log("---" + allPhrase);
          //save to db
          connection.query("INSERT INTO keyWords SET ?", {
            word: isCorrectWord,
            domain: subName,
            text: allPhrase
          }, function(err, result) {
            if (err) {
              console.log(err);
            }
          });
        }
      }
    }
  }
  return true;
}


function save(found) {
  /*fs.writeFile(root+'keyWords.txt', found[0], function(err) {
    if(err) {
        return console.log(err);
    }

    //console.log("The file was saved!");
});*/
}

//linki do podstron na stronie zapisz do pliku
async function sitesCheck(page) {
  var site = Site;
  site.name = page
  site.subPages = [];
  site.subPagesContent = [];
  //console.log(site.name)
  let html = await rp(site.name);
  //console.log(html)
  var $ = cheerio.load(html);
  var href = $("a").each(function() {
    var a = $(this).attr('href');
    site.subPages.push(a);
  });
  //console.log('------------------')
  site.subPages.push(site.name);
  var link;
  var amount = site.subPages.length;
  var stringOne = '';
  var stringTwo = '';
  var howManyTimes = 0;
  for (const item of site.subPages) {
    stringOne += '*';
    howManyTimes++;
    stringTwo = '';
    for (var amounCounter = 0; amounCounter < amount - howManyTimes; amounCounter++) {
      stringTwo += '-';
    }
    console.log('\033[2J');
    console.log('[' + stringOne + stringTwo + ']')
    if (site.visited.includes(item)) continue;
    if (item == undefined || item.includes('.pdf')) continue;
    if (!(item.includes('http://') || item.includes('https://'))) {
      //console.log('ert')
      if (!item.includes('www')) {
        if (!item.includes('.')) {
          if (!(item.includes('(') || item.includes(')') || item.includes(';') || item.includes(',') || item.includes('#'))) {
            link = site.name + item;
          } else {
            continue;
          }
        } else {
          if (item.includes('.html') || item.includes('.php') || item.includes('.ejs')) {
            link = site.name + item;
          } else {
            link = 'www.' + item;
          }
        }
      }
    } else {
      link = item;
    }

    //console.log(link);

    await takeContent(link).then(val => checkWords(val, page, link))
    site.visited.push(link);
  }
  return 0;


  //await rp(site.name, async function(err, response, html) {



  //});
}


connection.query("SELECT name FROM mainPages", async function(err, result, fields) {
  Object.keys(result).forEach(function(key) {
    var row = result[key];
    mainPages.push(row.name);
  });
  var count = 0;
  work(count);
  //sitesCheck(mainPages[count])
});

async function work(count) {
  //console.log(count)
  if (count == mainPages.length) {

  } else {
    await sitesCheck(mainPages[count]).then(val => work(count = count + 1));
    if (found.length > 0) {
      console.log('znalezione słowa:');
      connection.query("SELECT word, domain, text FROM keyWords", function(err, result, fields) {
        Object.keys(result).forEach(function(key) {
          var row = result[key];
          console.log("fraza: " + row.word);
          console.log("została odnaleziona na stronie: " + row.domain);
          console.log("w akapicie: " + row.text);
        });
      });
    } else {
      console.log("Nie znaleziono słow kluczowych na podanych stronach");
    }
    //process.exit();

    //return sitesCheck(mainPages[count]);
  }
}
