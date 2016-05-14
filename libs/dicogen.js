function connect_to_db() {
  // First you need to create a connection to the db
  var con = mysql.createConnection({
    host: "130.211.110.8",
    user: "root",
    password: "loup280892",
    database: "dictionnaire"
  });

  con.connect(function(err){
    if(err){
      console.log('Error connecting to Db');
      return;
    }
    console.log('Connection established');
  });

  return con;
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

function get_avancement(db) {

  var avancement = 1;

  db.query("SELECT Count(*) FROM INFORMATION_SCHEMA.Tables WHERE TABLE_NAME REGEXP '([[:digit:]]_char)+'", function(err, rows) {
    if(err) throw err;

    avancement = rows.Count;

    console.log(avancement);
  });

  return avancement;
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
  })
}

function launch_generation(db, avancement, char_length) {

  while (avancement < char_length) {
    if (table_exist(avancement, db)) {
      break;
    }
    else {
      create_table(avancement, db);
      generate(avancement, db);
    }
    avancement++;
  }

}
