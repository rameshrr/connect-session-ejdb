var connect = require("connect");
var SessEJDB = require("../");

//Open EJDB
var jb = require("ejdb").open("mysessdb");

connect(
        connect.cookieParser(),
        connect.session({ secret : "mysecret", store : new SessEJDB(jb), cookie : { maxAge : 60000 } }),
        function(req, res) {
            res.end("Hello!\n");
        }).listen(3000);


var exitProgress = false;
function shutdown(nexit, ecode) {
    if (exitProgress) {
        return;
    }
    exitProgress = true;
    if (ecode == null) {
        ecode = 0;
    }
    try {
        console.log("Closing EJDB");
        jb.close();
    } catch (e) {
        console.error(e);
    }
    if (!nexit) {
        process.exit(ecode);
    }
}

process.on("exit", function() {
    shutdown(true);
});

if (process.platform != "win32") {
    //Signal handlers
    process.on("SIGHUP", shutdown); //parent
    process.on("SIGINT", shutdown); //ctrlc
    process.on("SIGTERM", shutdown);
}