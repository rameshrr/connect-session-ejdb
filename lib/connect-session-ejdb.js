var Store = require("connect").session.Store;

var EJS = module.exports = function(ejdb, cname, opts) {
    if (ejdb == null) {
        throw new Error("Missing required 'ejdb' arg");
    }
    cname = cname || "connect-sessions";
    this.cname = cname;
    this.ejdb = ejdb;
    ejdb.ensureStringIndex(cname, "s");
};

/**
 * Inherit from `Store.prototype`.
 */

EJS.prototype.__proto__ = Store.prototype;

EJS.prototype.set = function(sid, sess, cb) {
    this.ejdb.update(this.cname,
            {s : sid,
                $upsert : {
                    s : sid, //Session ID
                    t : +new Date(), //Update session time
                    d : sess //Session data
                }
            }, cb);
};

EJS.prototype.get = function(sid, cb) {
    var me = this;
    this.ejdb.findOne(this.cname, {s : sid}, function(err, obj) {
        if (err) {
            cb && cb(err);
            return;
        }
        var d = obj ? obj.d : null;
        if (d) {
            var expires = (d.cookie && (typeof d.cookie.expires === "string")) ?
                          new Date(d.cookie.expires) : d.cookie.expires;
            if (!expires || new Date < expires) {
                cb && cb(null, d);
            } else {
                me.destroy(sid, cb);
            }
        } else if (cb) {
            cb();
        }
    });
};


EJS.prototype.destroy = function(sid, cb) {
    this.ejdb.update(this.cname, {s : sid, $dropall : true}, cb);
};

EJS.prototype.length = function(cb) {
    this.ejdb.count(this.cname, {}, cb);
};

EJS.prototype.clear = function(cb) {
    this.ejdb.update(this.cname, {$dropall : true}, cb);
};

EJS.prototype.all = function(cb) {
    if (!cb) {
        return;
    }
    this.ejdb.find(this.cname, {}, function(err, cursor, count) {
        if (err) {
            cb(err);
            return;
        }
        var res = new Array(count);
        for (var i = 0; cursor.next(); ++i) {
            res[i] = cursor.field("d");
        }
        cb(null, res);
    });
};










