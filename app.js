//const alert=require('alert');
const express=require('express');
const cookieParser=require("cookie-parser");
const sessions=require('express-session');
const http=require('http');
var parseUrl=require('body-parser');
const app=express();
const ejs=require('ejs');
app.use(express.static("public"));
const translate = require('google-translate-api');
const targetLanguage = 'en';



var mysql=require('mysql');
const{encode}=require('punycode');
let tryCount = 0;

var crypto=require('crypto');

app.set('view engine', 'ejs');
app.set('views', __dirname+'/public/views');

app.use(parseUrl.json());

// Store the cart items in an array in memory (in production, you would typically use a database to store the cart data)
let cartItems = [];

let encodeUrl=parseUrl.urlencoded({extended:false});

//session middleware
app.use(sessions({
    secret:"thisismysecrctekey",
    saveUninitialized:true,
    cookie:{maxAge:1000*60*60*1}, // 1 hours
    resave:false
}));

app.use(cookieParser());

app.use(parseUrl.urlencoded({ extended: true }));
// app.use(bodyParser.json());

var con=mysql.createConnection({
    host:"localhost",
    user:"root", // my username
    password:"", // my password
    database:"agronow"
});

/* English pages */
app.get('/', function(req, res) {
    res.sendFile(__dirname + '/public/en/index-en.html');
});

app.get("/about-en",(req,res)=>{
    res.sendFile(__dirname+"/public/en/about-en.html");
});

app.get("/customer-account-en",(req,res)=>{
    if (req.session.user.category === 0) {
        res.render('customer-account-en', {sgdata: "Log out"})}
    else {
        res.redirect('/signin-en');
    }
});
app.get("/farmer-account-en",(req,res)=>{
    if (req.session.user.category === 1) {
        res.render('farmer-account-en', {sgdata: "Log out"});
    }
    else {
        res.redirect('/signin-en');
    }
});

app.get("/signin-en",(req,res)=>{
    res.sendFile(__dirname+"/public/en/signin-en.html");
    
});

app.get("/shop-en",(req,res)=>{
    con.query('SELECT * FROM stock',function(err,rows){
        if (err) {
              console.error('Error fetching data from MySQL:', err);
              res.status(500).send('Error fetching data from MySQL');
              return;
            }
        res.render('shop-en',{data:rows});
    });
    //res.sendFile(__dirname+"/shop.ejs");
});

app.get('/register-en', function(req, res) {
    res.sendFile(__dirname + '/public/en/register-en.html');
});

app.get("/profile-en", function (req, res){
    const data=req.session.user;
    con.query(`SELECT * FROM userprofile WHERE user_email='${data['username']}'`, (err, results) => {
        console.log(results[0]['firstname']);
        const json = JSON.stringify(results[0]);
        console.log(json);
        if (err) {
            console.error('Error', err);
            res.status(500).send('Error');
            return;
        }
        res.send(`
        ${json}`)
    });
    
});

app.get("/cart-en",(req,res)=>{
    const itemid=req.query.value;
    const eml=req.session.user;
    const productId = req.body.value;
  console.log(productId);
  // Find the product in your database based on the productId
  

    con.query(`select user_id from userprofile where user_email='${eml.username}'`,function(error,result){
                    // if (error){
                    //     // res.sendFile(__dirname+"/signin.html");
                    //     console.log("Error")
                    // }else{
                    //     var uid=result[0].user_id;
                    //     con.query(`select * from orders where user_id='${uid}' and item_id='${itemid}'`,function(erro,res){
                    //         if(Object.keys(res).length>0){
                    //             con.query(`UPDATE orders SET units=units+1 WHERE user_id='${uid}' and item_id='${itemid}'`,function(err,res){
                    //             });
                    //         }else{
                    //             con.query(`INSERT INTO orders(DOO,DOD,user_id,item_id,units,status) VALUES(curdate(),curdate()+1,${uid},${itemid},1,0)`,function(err,res){
                                    
                    //             });
                    //         }
                    //     });
                        con.query(`SELECT * FROM stock WHERE item_id=${productId}`, (err, results) => {
                            // console.log(results[0]['rate']);
                            const json = JSON.stringify(results[0]);
                            if (err) {
                                console.error('Error', err);
                                res.status(500).send('Error');
                                return;
                            }
                        });
                        if(results.length > 0){
                            res.render('cart-en', {data:results[0]});
                        } else 
                        {
                            res.render('cart-en', {data:[]})
                        }
                        
                    
                });
   
   
});

app.get("/list-prod-en", function (req, res) {
    if(req.session.user){
        if(req.session.user.category === 1){
        res.sendFile(__dirname + "/public/en/listProducts-en.html");
        }
    } else {
        res.redirect("/signin-en")
    }
});

app.get("/checkout-en",(req,res)=>{
    if(req.session.user){
        res.render('checkout-en', {sgdata: "Log out"})
    } else {
        res.redirect("/signin-en")
    }
});


app.get('/logout-en',  function (req, res, next)  {
    if (req.session) {
      // delete session object
      req.session.destroy(function (err) {
        if (err) {
          return next(err);
        } else {
          return res.redirect('/');
        }
      });
    }
  });

// POST

app.post('/register-en',encodeUrl,(req,res)=>{
    var hash=crypto.createHash('sha256');
    var email=req.body.email;
    var password=req.body.enterpass;
    var pass=req.body.confirmpass;
    if(password===pass){
    password=hash.update(password); 
    password=hash.digest(password);
    }
    var category=req.body.accounttype;
    if(category==='farmer')
    {
        category=true;
    }
    else if(category==='customer')
    {
        category=false;
    }
    else {
        res.redirect("/register-en");
    }

    con.connect(function(err) {
        if (err){
            console.log(err);
        };
        // checking user already registered or no
        con.query(`SELECT * FROM users WHERE user_email='${email}'`,function(err,result){
            if(err){
                console.log(err);
            };
            if(Object.keys(result).length>0){
                //alert("Existing User");
            }else{
            //creating user page in userPage function
            function userPage(){
                // We create a session for the dashboard (user page) page and save the user data to this session:
                req.session.user={
                    email:email,
                    password:password 
                };

                res.sendFile(// <!DOCTYPE html>
                // <html lang="en">
                // <head>
                //     <title>Login and register form with Node.js, Express.js and MySQL</title>
                //     <meta charset="UTF-8">
                //     <meta name="viewport" content="width=device-width, initial-scale=1">
                //     <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet">
                // </head>
                // <body>
                //     <div class="container">
                //         <h3>Hi, ${req.session.user.firstname} ${req.session.user.lastname}</h3>
                //         <a href="/logout">Log out</a>
                //     </div>
                // </body>
                // </html>
                __dirname + '/public/en/profile-edit-en.html');
            }
                // inserting new user data
                var sql=`INSERT INTO users(user_email,user_pass,category) VALUES('${email}','${password.toString('hex')}',${category})`;
                con.query(sql,function(err,result){
                    if (err){
                        console.log(err);
                    }else{
                        // using userPage function for creating user page
                        userPage();
                    };
                });
        }
        });
    });
});

app.post('/register/profile-en',encodeUrl,(req,res)=>{
    var firstname = req.body.firstname;
    var lastname = req.body.lastname;
    var phonenumber = req.body.phonenumber;
    var address = req.body.address;
    var city = req.body.city;
    var state = req.body.state;
    var pincode = req.body.pincode;
    // i = i + 1;

    const data = req.session.user;
    con.connect(function(err) {
        if (err){
            console.log(err);
        };
        // inserting new user data
        var sql=`INSERT INTO userprofile(user_email,firstname, lastname, phone_no, address, city, state, pincode) VALUES('${data['email']}','${firstname}','${lastname}',${phonenumber},'${address}','${city}','${state}',${pincode})`;
        con.query(sql,function(err,result){
            if (err){
                console.log(err);
            } else {
                console.log(result);
            }
        });
        res.redirect("/signin-en");
    });
});

app.post("/login-en",encodeUrl,(req,res)=>{
    var hash=crypto.createHash('sha256');
    var userName = req.body.username;
    var password=req.body.password;
    password=hash.update(password);
    password=hash.digest(password);
    
    con.connect(function(err){
        if(err){
            console.log(err);
        };
        con.query(`SELECT * FROM users WHERE user_email='${userName}' AND user_pass='${password.toString('hex')}'`,function(err,result){
            console.log(result[0])
           
          if(err){
            console.log(err);
          };

          function userPage(){
            const json = result[0];
            const category = json.category;
            // We create a session for the dashboard (user page) page and save the user data to this session:
            req.session.user={
                firstname:result[0].firstname,
                lastname:result[0].lastname,
                username:userName,
                password:password,
                category: category
            };

            if (category === 1){
                res.redirect("/farmer-account-en");
            } else {
                res.redirect("/customer-account-en");
            }
        }

        if(Object.keys(result).length>0){
            userPage();
        }else{
            tryCount++;
            console.log(tryCount);
            if (tryCount >= 3) {
            res.sendFile(__dirname+'/public/en/failReg-en.html');
            tryCount = 0;
            } else {
                res.redirect("/signin-en");
            }
        }
        });
    });
});

// Add an item to the cart
app.post('/add', (req, res) => {
    const productId = req.body.value;
    console.log(productId);
    // Find the product in your database based on the productId
    con.query(`SELECT * FROM stock WHERE item_id=${productId}`, (err, results) => {
      // console.log(results[0]['rate']);
      const json = JSON.stringify(results[0]);
      if (err) {
          console.error('Error', err);
          res.status(500).send('Error');
          return;app.get('/register', function(req, res) {
            res.sendFile(__dirname + '/public/register.html');
        });
      }
  
      // const eml=req.session.user;
      // con.query(`select user_id from userprofile where user_email='${eml.username}'`,function(error,result){
      //                 if (error){
      //                     // res.sendFile(__dirname+"/signin.html");
      //                     console.error('Error', err);
      //     res.status(500).send('Error');
      //     return;
      //                 }else{
      //                     var uid=result[0].user_id;
      //                     con.query(`select * from orders where user_id='${uid}' and item_id='${itemid}'`,function(erro,res){
      //                         if(Object.keys(res).length>0){
      //                             con.query(`UPDATE orders SET units=units+1 WHERE user_id='${uid}' and item_id='${itemid}'`,function(err,res){
      //                                 console.log("Success");
      //                             });
      //                         }else{
      //                             con.query(`INSERT INTO orders(DOO,DOD,user_id,item_id,units,status) VALUES(curdate(),curdate()+1,${uid},${itemid},1,0)`,function(err,res){
      //                                 console.log("Success");
      //                             });
      //                         }
      //                     });
                         
      //                 };
                      
      //             });
      res.render('cart-en', {data:results[0]});
  });
  //   const product = { id: results[0]['item_id', name: results[0]['item_name'], price: results[0]['rate'], quantity: results[0]['unit_av'] };
  
    // Add the product to the cart
  //   cartItems.push(product);
  
    // Respond with the updated cart items
  //   res.json(cartItems);
  // res.redirect("/cart");
  });
  

// end

/* Kannada pages*/
app.get("/kn", function(req, res) {
    res.sendFile(__dirname+"/public/kn/index-kn.html");
});

app.get("/about-kn",(req,res)=>{
    res.sendFile(__dirname+"/public/kn/about-kn.html");
});

app.get("/farmer-account-kn",(req,res)=>{
    if (req.session.user.category === 1) {
        res.render('farmer-account-kn', {sgdata: "ಲಾಗ್ ಔಟ್"})}
    else {
        res.redirect('/signin-kn');
    }
});

app.get("/customer-account-kn",(req,res)=>{
    if (req.session.user.category === 0) {
        // res.sendFile(__dirname+"/public/kn/customer-account-kn.html");
        res.render('customer-account-kn', {sgdata: "ಲಾಗ್ ಔಟ್"})
    }
    else {
        res.redirect('/signin-kn');
    }
});

app.get("/signin-kn",(req,res)=>{
    if (req.session.user) {
        if (req.session.user.category === 0){
            res.redirect("/customer-account-kn");
        } else {
            res.redirect("/farmer-account-kn");
        }
    } else {
        res.sendFile(__dirname+"/public/kn/signin-kn.html");
    }
});

app.get("/shop-kn",(req,res)=>{
    con.query('SELECT * FROM stock',function(err,rows){
        if (err) {
              console.error('Error fetching data from MySQL:', err);
              res.status(500).send('Error fetching data from MySQL');
              return;
            }
        res.render('shop-kn',{data:rows});
    });
    //res.sendFile(__dirname+"/shop.ejs");
});

app.get('/register-kn', function(req, res) {
    res.sendFile(__dirname + '/public/kn/register-kn.html');
});

app.get("/profile-kn", function (req, res){
    const data=req.session.user;
    con.query(`SELECT * FROM userprofile WHERE user_email='${data['username']}'`, (err, results) => {
        const json = JSON.stringify(results[0]);
        console.log(json);
        if (err) {
            console.error('Error', err);
            res.status(500).send('Error');
            return;
        }
        // translate(json, { to: targetLanguage })
        // .then(translation => {
        //     console.log(translation.text);
        // })
        // .catch(error => {
        //     console.error(error);
        // });
        res.send(`
        ${json}`)
    });
    
});



app.get("/cart-kn",(req,res)=>{
    const itemid=req.query.value;
    const eml=req.session.user;
    const productId = req.body.value;
  console.log(productId);
  // Find the product in your database based on the productId
  

    con.query(`select user_id from userprofile where user_email='${eml.username}'`,function(error,result){
                    if (error){
                        // res.sendFile(__dirname+"/signin.html");
                        console.log("Error")
                    }else{
                        var uid=result[0].user_id;
                        con.query(`select * from orders where user_id='${uid}' and item_id='${itemid}'`,function(erro,res){
                            if(Object.keys(res).length>0){
                                con.query(`UPDATE orders SET units=units+1 WHERE user_id='${uid}' and item_id='${itemid}'`,function(err,res){
                                });
                            }else{
                                con.query(`INSERT INTO orders(DOO,DOD,user_id,item_id,units,status) VALUES(curdate(),curdate()+1,${uid},${itemid},1,0)`,function(err,res){
                                    
                                });
                            }
                        });
                        con.query(`SELECT * FROM stock WHERE item_id=${productId}`, (err, results) => {
                            // console.log(results[0]['rate']);
                            const json = JSON.stringify(results[0]);
                            if (err) {
                                console.error('Error', err);
                                res.status(500).send('Error');
                                return;
                            }
                        });
                        res.render('cart-kn', {data:results[0]});
                    };
                });
   
   
});

app.get("/list-prod-kn", function (req, res) {
    if(req.session.user){
        if(req.session.user.category === 1){
        res.sendFile(__dirname + "/public/kn/listProducts-kn.html");
        }
    } else {
        res.redirect("/signin-kn")
    }
});

app.get("/checkout-kn",(req,res)=>{
    if(req.session.user){
        res.render('checkout-kn', {sgdata: "ಲಾಗ್ ಔಟ್"})
    } else {
        res.redirect("/signin-kn");
    }
});

app.get('/logout-kn',  function (req, res, next)  {
    if (req.session) {
      // delete session object
      req.session.destroy(function (err) {
        if (err) {
          return next(err);
        } else {
          return res.redirect('/kn');
        }
      });
    }
  });



// POST 

app.post('/register-kn',encodeUrl,(req,res)=>{
    var hash=crypto.createHash('sha256');
    var email=req.body.email;
    var password=req.body.enterpass;
    var pass=req.body.confirmpass;
    if(password===pass){
    password=hash.update(password); 
    password=hash.digest(password);
    }
    var category=req.body.accounttype;
    if(category==='farmer')
    {
        category=true;
    }
    else if(category==='customer')
    {
        category=false;
    }
    else {
        res.redirect("/register-kn");
    }

    con.connect(function(err) {
        if (err){
            console.log(err);
        };
        // checking user already registered or no
        con.query(`SELECT * FROM users WHERE user_email='${email}'`,function(err,result){
            if(err){
                console.log(err);
            };
            if(Object.keys(result).length>0){
                //alert("Existing User");
            }else{
            //creating user page in userPage function
            function userPage(){
                // We create a session for the dashboard (user page) page and save the user data to this session:
                req.session.user={
                    email:email,
                    password:password 
                };

                res.sendFile(// <!DOCTYPE html>
                // <html lang="en">
                // <head>
                //     <title>Login and register form with Node.js, Express.js and MySQL</title>
                //     <meta charset="UTF-8">
                //     <meta name="viewport" content="width=device-width, initial-scale=1">
                //     <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet">
                // </head>
                // <body>
                //     <div class="container">
                //         <h3>Hi, ${req.session.user.firstname} ${req.session.user.lastname}</h3>
                //         <a href="/logout">Log out</a>
                //     </div>
                // </body>
                // </html>
                __dirname + '/public/kn/profile-edit-kn.html');
            }
                // inserting new user data
                var sql=`INSERT INTO users(user_email,user_pass,category) VALUES('${email}','${password.toString('hex')}',${category})`;
                con.query(sql,function(err,result){
                    if (err){
                        console.log(err);
                    }else{
                        // using userPage function for creating user page
                        userPage();
                    };
                });
        }
        });
    });
});

app.post('/register/profile-kn',encodeUrl,(req,res)=>{
    var firstname = req.body.firstname;
    var lastname = req.body.lastname;
    var phonenumber = req.body.phonenumber;
    var address = req.body.address;
    var city = req.body.city;
    var state = req.body.state;
    var pincode = req.body.pincode;
    // i = i + 1;

    const data = req.session.user;
    con.connect(function(err) {
        if (err){
            console.log(err);
        };
        // inserting new user data
        var sql=`INSERT INTO userprofile(user_email,firstname, lastname, phone_no, address, city, state, pincode) VALUES('${data['email']}','${firstname}','${lastname}',${phonenumber},'${address}','${city}','${state}',${pincode})`;
        con.query(sql,function(err,result){
            if (err){
                console.log(err);
            } else {
                console.log(result);
            }
        });
        res.redirect("/signin-kn");
    });
});

app.post("/login-kn",encodeUrl,(req,res)=>{
    var hash=crypto.createHash('sha256');
    var userName = req.body.username;
    var password=req.body.password;
    password=hash.update(password);
    password=hash.digest(password);
    
    con.connect(function(err){
        if(err){
            console.log(err);
        };
        con.query(`SELECT * FROM users WHERE user_email='${userName}' AND user_pass='${password.toString('hex')}'`,function(err,result){
            console.log(result[0])
           
          if(err){
            console.log(err);
          };

          function userPage(){
            const json = result[0];
            const category = json.category;
            // We create a session for the dashboard (user page) page and save the user data to this session:
            req.session.user={
                firstname:result[0].firstname,
                lastname:result[0].lastname,
                username:userName,
                password:password,
                category: category
            };

            if (category === 1){
                res.redirect("/farmer-account-kn");
            } else {
                res.redirect("/customer-account-kn");
            }
        }

        if(Object.keys(result).length>0){
            userPage();
        }else{
            tryCount++;
            console.log(tryCount);
            if (tryCount >= 3) {
            res.sendFile(__dirname+'/public/kn/failReg-kn.html');
            tryCount = 0;
            } else {
                res.redirect("/signin-kn");
            }
        }
        });
    });
});

// Add an item to the cart
app.post('/add', (req, res) => {
    const productId = req.body.value;
    console.log(productId);
    // Find the product in your database based on the productId
    con.query(`SELECT * FROM stock WHERE item_id=${productId}`, (err, results) => {
      // console.log(results[0]['rate']);
      const json = JSON.stringify(results[0]);
      if (err) {
          console.error('Error', err);
          res.status(500).send('Error');
          return;
      }
  
      // const eml=req.session.user;
      // con.query(`select user_id from userprofile where user_email='${eml.username}'`,function(error,result){
      //                 if (error){
      //                     // res.sendFile(__dirname+"/signin.html");
      //                     console.error('Error', err);
      //     res.status(500).send('Error');
      //     return;
      //                 }else{
      //                     var uid=result[0].user_id;
      //                     con.query(`select * from orders where user_id='${uid}' and item_id='${itemid}'`,function(erro,res){
      //                         if(Object.keys(res).length>0){
      //                             con.query(`UPDATE orders SET units=units+1 WHERE user_id='${uid}' and item_id='${itemid}'`,function(err,res){
      //                                 console.log("Success");
      //                             });
      //                         }else{
      //                             con.query(`INSERT INTO orders(DOO,DOD,user_id,item_id,units,status) VALUES(curdate(),curdate()+1,${uid},${itemid},1,0)`,function(err,res){
      //                                 console.log("Success");
      //                             });
      //                         }
      //                     });
                         
      //                 };
                      
      //             });
      res.render('cart-kn', {data:results[0]});
  });
  //   const product = { id: results[0]['item_id', name: results[0]['item_name'], price: results[0]['rate'], quantity: results[0]['unit_av'] };
  
    // Add the product to the cart
  //   cartItems.push(product);
  
    // Respond with the updated cart items
  //   res.json(cartItems);
  // res.redirect("/cart");
  });
  


// end

app.get('/account', function(req, res) {
    res.sendFile(__dirname + '/public/farmer-account.html');
});


























app.get("/test", function (req, res) {
    res.sendFile(__dirname + "/public/test.html");
});






app.get("/contact",(req,res)=>{
    res.sendFile(__dirname+"/public/contact-us.html");
});


app.use(express.static(__dirname));

// app.set('views',__dirname);




app.get("/shop/:id",(req,res)=>{
  const id=req.params.id;
  const query=`SELECT img FROM stock WHERE item_id=${id}`;
  con.query(query,(error,results)=>{
    if(error) throw error;
    const imageData=results[0].img;
    res.contentType("image/jpeg");
    res.send(imageData);
  });
});








// app.post("/contact",(req,res)=>{
//     var name = req.body.name;
//     var email = req.body.email;
//     var subject = req.body.subject;
//     var message = req.body.message;

// });

app.listen(5000,()=>{
    console.log("Server running on port 5000");
});
/*app.get('/',function(req,res) {
  res.sendFile(__dirname+'/.html');
});

app.post('/add-to-cart',function(req,res) {
  var productId=req.body.productId;
  var sql="SELECT * FROM products WHERE id=";
  con.query(sql,[productId],function(error,results,fields){
    if(error) throw error;
    var product=results[0];
    var cart=req.session.cart||[];
    cart.push(product);
    req.session.cart=cart;
    res.send({status:'success',message:'Product added to cart'});
  });
});*/
