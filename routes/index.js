var express = require('express');
var router = express.Router();


function connect_to_db(callback) {
  // First you need to create a connection to the db
  var con = mysql.createConnection({
    host: "130.211.110.80",
    user: "root",
    password: "loup280892", // Weak password findable on https://haveibeenpwned.com
    database: "dictionnaire"
  });

  con.connect(function(err){
    if(err){
      console.log('Error connecting to Db');
      return;
    }
    console.log('Connection established');
  });

  callback(con);
}

function close_db(db) {
  db.end(function(err) {

  });
}

function generate(avancement, db) {

  var base = [];
  db.query('SELECT * FROM 1_char', function(err, rows) {
    if(err) throw err;

    for(rowIndex in rows) {
      base += rows[rowIndex].string;
    }
  });

  db.query('SELECT * FROM ' + avancement + '_char', function(err, rows) {
    if(err) throw err;

    var new_con = connect_to_db();

    for(rowIndex in rows) {
      for(index in base) {
        var string = rows[rowIndex].string + base[index];
        new_con.query('INSERT INTO ' + (avancement + 1) + '_char (string) VALUES (?)', string, function(err, res) {
          if(err) throw err;
        });
      }
    }

    close_db(new_con);
  });

}

function get_avancement(db, callback) {

  //var avancement = 0;

  db.query("SELECT COUNT(*) FROM INFORMATION_SCHEMA.Tables WHERE TABLE_NAME REGEXP '([[:digit:]]_char)+'", function(err, rows) {
    if(err) throw err;

    var rawPacket = rows[0];
    for(valueIndex in rawPacket) {
      avancement = rawPacket[valueIndex];
    }
    callback(avancement);
  });
}

function create_table(avancement, db) {
  avancement = avancement + 1;
  db.query("CREATE TABLE " + avancement + "_char (id INT NOT NULL AUTO_INCREMENT, string TEXT, PRIMARY KEY(id))", function(err, res) {
    if(err) throw err;
    console.log('table <' + avancement + '_char> created');
  });
}

function table_exist(avancement, db) {
  db.query('SELECT * FROM ' + avancement + '_char', function(err, res) {
    if(err) {
      if(err.code === 'ER_NO_SUCH_TABLE') {
        return false;
      }
      else {
        console.log(err);
      }
    }
    else {
      return true;
    }
  });
}

function launch_generation(db, avancement, char_length) {
  console.log('Launching generation');
  
  while (avancement < char_length) {
    if (table_exist(avancement, db)) {
      console.log('Table already exists...');
      break;
    }
    else {
      create_table(avancement, db);
      generate(avancement, db);
    }
    avancement++;
  }

}

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { generating: false });
});

router.post('/generate', function(req, res) {
  var char_length = req.body.user_char_length;
  var mysql = require("mysql");

  connect_to_db(function(db) {
    get_avancement(db, function(avancement) {
      connect_to_db(function(db2) {
        console.log('Avancement de départ : ' + avancement);
        launch_generation(db2, avancement, char_length);
        close_db(db2);
      });
    });
    close_db(db);
  });

  res.render('index', {generating: true});
});

module.exports = router;
