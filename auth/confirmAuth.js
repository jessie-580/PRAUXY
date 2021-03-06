let cachedTokens = [];
const _PERMISSION = new (require("./permissions"))();
const _LOGGER = require('../helpers/logging');
const _DATE = require('../helpers/date');
const _MongoConfig = require('../helpers/mongo');

const MongoClient = require('mongodb').MongoClient;
// const url = "mongodb://127.0.0.1:27017/";
const url = _MongoConfig.url;

function parseCookies (request) {
    var list = {},
        rc = request.headers.cookie;

    rc && rc.split(';').forEach(function( cookie ) {
        var parts = cookie.split('=');
        list[parts.shift().trim()] = decodeURI(parts.join('='));
    });

    return list;
}


class Authenticator {
    constructor(redis) {
        this.id = Math.floor(Math.random() * 1000)
        this._REDIS = redis;

    }

    isAdmin(req, res, next = undefined) {
        const cookies = parseCookies(req);

        let groupLevel = parseInt(cookies.prauxyToken.split(":")[2]);

        if(groupLevel == NaN || groupLevel <= 5) {
            res.status(401).json({error: "You do not have a high enough group to do this."})
            return false;
        } else {
            if(next != undefined) next();

            return true;
        }
    }

    confirmAccessLevel(app, user, current) {
        const _this = this;
        return new Promise((resolve, reject) => {
            MongoClient.connect(url, { useNewUrlParser: true }, function(err, db) {
                var dbo = db.db(process.env.NODE_ENV == 'test' ? "prauxy-test" : "homerouter");
                dbo.collection("applications").findOne({shortName: app}, (err, appResult) => {
                    if(appResult != null) {
                        if(appResult.requiresAuthentication) {
                            if(appResult.users.indexOf(user) >= 0 || appResult.group <= current) {
                                resolve(true)
                            } else {
                                resolve(false)
                            }
                        } else {
                            resolve(true)
                        }
                    } else {
                        resolve(true)
                    }
                })
            });
        });
    }

    authenticate(tempToken, appName = false) {

        if(tempToken == undefined) tempToken = "x.x"
    
        let token = tempToken.split(":")[0];
        let user = tempToken.split(":")[1];
        let groupLevel = tempToken.split(":")[2];

        const _this = this;


        if(_PERMISSION == undefined) return false;
    
        return new Promise((resolve, reject) => {
            _this._REDIS.get(`APP:${appName}`).then(requiresAuth => {
                requiresAuth = JSON.parse(requiresAuth) != null ? JSON.parse(requiresAuth).requiresAuth : true;
                if(requiresAuth == false) {
                    return resolve(true);
                }

                _this._REDIS.get(`${user}:${token}:${groupLevel}`).then(hasCache => {
                    if(token !== undefined) {
                        const confirm = () => {
                            _this.confirmAccessLevel(appName, user, groupLevel).then(r => {
                                resolve(r);
                            })
                        }

                        if(hasCache) {
                            confirm()
                        } else {
                            MongoClient.connect(url, { useNewUrlParser: true }, function(err, db) {
                                if (err) throw err;
                                var dbo = db.db(process.env.NODE_ENV == 'test' ? "prauxy-test" : "homerouter");
            
                                dbo.collection("users").findOne({username: user, token: token}, (err, u) => {
                                    if(err) throw err;
                                    dbo.collection("users").findOne({username: user}, (err, u2) => {
                                        if(u != null) {
                                            _LOGGER.log(`${user}:${token}:${groupLevel} logged in (${_DATE.pretty()})`, "Authorization")

                                            _this._REDIS.set(`${user}:${token}:${groupLevel}`, true, 60 * 60 * 24 * 3)

                                            confirm();
                                        } else {
                                            _LOGGER.error(`${user} ${token} ${groupLevel} (${u2 != null ? u2.token : "NULL"}) did not log in (${_DATE.pretty()})`, "Authorization")

                                            resolve(false);
                                        }
                                    })
            
                                })
                            });
                        }
                    }
                })
            })
        })
    }
}

module.exports = Authenticator;