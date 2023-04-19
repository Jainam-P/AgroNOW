const express=require('express');
const cookieParser=require("cookie-parser");
const sessions=require('express-session');
const http=require('http');
var parseUrl=require('body-parser');
const app=express();
const ejs=require('ejs');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
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
    if(req.session.user){
        res.render('index-en', { sgdata: "Log out"});
    } else {
        res.render('index-en', { sgdata: "Sign In"});
    }
});

app.get("/about-en",(req,res)=>{
    if(req.session.user){
        res.render('about-en', { sgdata: "Log out"});
    } else {
        res.render('about-en', { sgdata: "Sign In"});
    }
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
    if(!(req.session.user)){
        res.render('signin-en');
    }
});

app.get("/shop-en",(req,res)=>{
    con.query('SELECT * FROM stock',function(err,rows){
        if (err) {
              console.error('Error fetching data from MySQL:', err);
              res.status(500).send('Error fetching data from MySQL');
              return;
            }
        if(req.session.user){
            res.render('shop-en',{sgdata:"Log out", productId: -1, data:rows});
        } else {
            res.render('shop-en',{sgdata:"Sign In", productId: -1, data:rows});
        }
        
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

app.get("/add-cart-en",(req,res)=>{

    const itemid=req.query.value;
    const eml=req.session.user;
    const productId = req.body.value;
  console.log(productId);
  // Find the product in your database based on the productId
  if(req.session.user){
    con.query(`select user_id from userprofile where user_email='${eml.username}'`,function(error,result){
        if (error){
            res.redirect('/signin-en');
        }else{
            var uid=result[0].user_id;
            con.query(`select * from orders where user_id='${uid}' and item_id='${itemid}' and status=0`,function(erro,res){
                if(Object.keys(res).length>0){
                    con.query(`UPDATE orders SET units=units+1 WHERE user_id='${uid}' and item_id='${itemid}' and status=0`,function(err,res){
                    });
                }else{
                    con.query(`INSERT INTO orders(DOO,DOD,user_id,item_id,units,status) VALUES(curdate(),curdate()+1,${uid},${itemid},1,0)`,function(err,res){
                    });
                }
                console.log("done");
            });
        }
            /*con.query(`SELECT * FROM stock WHERE item_id=${productId}`, (err, results) => {
                // console.log(results[0]['rate']);
                const json = JSON.stringify(results[0]);
                if (err) {
                    console.error('Error', err);
                    res.status(500).send('Error');
                    return;
                }
            });
            if(results.length > 0){
                res.render('cart', {data:results[0]});
            } else
            {
                res.render('cart', {data:[]})
            }*/
            res.redirect("shop-en")
    });
    
} else {
    res.redirect('/signin-en');
}
   
});

app.get("/get-cart-en", function(req, res) {
    const eml=req.session.user;
    const productId = req.body.value;
   
  console.log(productId);
    if(req.session.user) {
        con.query(`select user_id from userprofile where user_email='${eml.username}'`,function(error,result){
            var uid=result[0].user_id;
        con.query(`select * from (SELECT orders.user_id,orders.item_id,stock.item_name,stock.rate,orders.units,orders.status FROM orders inner JOIN stock ON orders.item_id=stock.item_id) as merge where merge.user_id='${uid}' and merge.status=${0};`,function(err,rows){
            if(err){
                  console.error('Error fetching data from MySQL:',err);
                  res.status(500).send('Error fetching data from MySQL');
                  return;
                }
           
                res.render('cart-en',{sgdata: "Log out", data1:rows});
           
        });
       });
    } else {
        res.redirect('/signin-en');
    }
});


app.get("/failReg-en", function(req, res) {
    res.render('failReg-en', { sgdata: "Sign In" });
});

app.get("/list-prod-en", function (req, res) {
    if(req.session.user){
        if(req.session.user.category === 1){
            res.render('listProducts-en',{data2:req.session.user.username});
        // res.sendFile(__dirname + "/public/listProducts.html");
        }
    } else {
        res.redirect("/signin-en")
    }
});

app.get("/remove/:id", function(req, res){
    const id=req.params.id;
    con.query(`DELETE FROM orders WHERE item_id = ${id};`, function(err) {
        if(err){
            console.error('Error fetching data from MySQL:',err);
            res.status(500).send('Error fetching data from MySQL');
            return;
          }
              res.redirect('/get-cart-en');
    });
});

app.get("/checkout-en",(req,res)=>{
    const eml=req.session.user;

    if(req.session.user) {
        con.query(`select user_id from userprofile where user_email='${eml.username}'`,function(error,result){
            var uid=result[0].user_id;
        con.query(`select * from (SELECT orders.user_id,orders.item_id,stock.item_name,stock.rate,orders.units,orders.status FROM orders inner JOIN stock ON orders.item_id=stock.item_id) as merge where merge.user_id='${uid}' and merge.status=${0};`,function(err,rows){
            if(err){
                  console.error('Error fetching data from MySQL:',err);
                  res.status(500).send('Error fetching data from MySQL');
                  return;
                }
                    res.render('checkout-en',{sgdata: "Log out", data2:rows});
           
        });
       });
    } else {
        res.redirect('/signin-en');
    }
});

app.get("/place-order-en", function(req, res){
    const eml = req.session.user;
    console.log(eml.user_id);
    if(eml){
        con.query(`select user_id from userprofile where user_email='${eml.username}'`,function(error,result){
            var uid=result[0].user_id;
            con.query(`UPDATE orders SET status = ${1} WHERE user_id = ${uid};`, function(err,rows){
                if(err){
                    console.error('Error updating data in MySQL:',err);
                    res.status(500).send('Error updated data in MySQL');
                    return;
            }
        });

        res.redirect("/orders-en");

    });
    } else {
        res.redirect("/signin-en");
    }
});

app.get("/orders-en",(req,res)=>{
    const eml = req.session.user;

    if(eml){
        tempquery = `SELECT * FROM orders, userprofile where orders.user_id = userprofile.user_id and userprofile.user_email= '${eml.username}' and orders.status=${1};`
        con.query(tempquery,function(err,rows){
        if (err) {
              console.error('Error fetching data from MySQL:', err);
              res.status(500).send('Error fetching data from MySQL');
              return;
            }
        res.render('orders-en',{sgdata:"Log out", data:rows});
    });
    } else {
        res.redirect("/signin-en");
    }
    
    //res.sendFile(__dirname+"/shop.ejs");
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

app.post("/search-en", function(req, res){
    const searchText = req.body.searchText;
    if(searchText === "")
    {
        res.redirect("/shop-en");
    } else{
        con.query(`SELECT * FROM stock WHERE item_name = '${searchText}'`,function(err,rows){
            if (err) {
                  console.error('Error fetching data from MySQL:', err);
                  res.status(500).send('Error fetching data from MySQL');
                  return;
                }
            if(req.session.user){
                res.render('shop-en',{sgdata:"Log out", productId: -1, data:rows});
            } else {
                res.render('shop-en',{sgdata:"Sign In", productId: -1, data:rows});
            }
            
        });
    }
   
});

// Add an item to the cart
app.post('/add', (req, res) => {
    const productId = req.body.value;
    console.log(productId);
    // Find the product in your database based on the productId
    cartItems.push(productId);
    console.log(cartItems);
    console.log("added");
    // alert("added");

    con.query('SELECT * FROM stock',function(err,rows){
        if (err) {
              console.error('Error fetching data from MySQL:', err);
              res.status(500).send('Error fetching data from MySQL');
              return;
            }
        if(req.session.user){
            res.render('shop-en',{productId: cartItems[cartItems.length - 1], sgdata:"Log out", data:rows});
        } else {
            res.render('shop-en',{productId: cartItems[cartItems.length - 1], sgdata:"Sign In", data:rows});
        }
    });
    
//     con.query(`SELECT * FROM stock WHERE item_id=${productId}`, (err, results) => {
//       // console.log(results[0]['rate']);
//       const json = JSON.stringify(results[0]);
//       if (err) {
//           console.error('Error', err);
//           res.status(500).send('Error');
//           return;app.get('/register', function(req, res) {
//             res.sendFile(__dirname + '/public/register.html');
//         });
//       }
  
//       // const eml=req.session.user;
//       // con.query(`select user_id from userprofile where user_email='${eml.username}'`,function(error,result){
//       //                 if (error){
//       //                     // res.sendFile(__dirname+"/signin.html");
//       //                     console.error('Error', err);
//       //     res.status(500).send('Error');
//       //     return;
//       //                 }else{
//       //                     var uid=result[0].user_id;
//       //                     con.query(`select * from orders where user_id='${uid}' and item_id='${itemid}'`,function(erro,res){
//       //                         if(Object.keys(res).length>0){
//       //                             con.query(`UPDATE orders SET units=units+1 WHERE user_id='${uid}' and item_id='${itemid}'`,function(err,res){
//       //                                 console.log("Success");
//       //                             });
//       //                         }else{
//       //                             con.query(`INSERT INTO orders(DOO,DOD,user_id,item_id,units,status) VALUES(curdate(),curdate()+1,${uid},${itemid},1,0)`,function(err,res){
//       //                                 console.log("Success");
//       //                             });
//       //                         }
//       //                     });
                         
//       //                 };
                      
//       //             });
//       res.render('cart-en', {data:results[0]});
//   });
  //   const product = { id: results[0]['item_id', name: results[0]['item_name'], price: results[0]['rate'], quantity: results[0]['unit_av'] };
  
    // Add the product to the cart
  //   cartItems.push(product);
  
    // Respond with the updated cart items
  //   res.json(cartItems);
  // res.redirect("/cart");
  });

  app.post('/addProduct',encodeUrl,upload.single('inputFile'),(req,res)=>{
    var hash=crypto.createHash('sha256');
    var productName = req.body.productName;
    var Weight = req.body.Weight;
    var rate = req.body.rate;
    var date = req.body.expDate;
    date.replaceAll("/","-");
    var data = fs.readFileSync(req.file.path);
    var pass = req.body.enterpass;
    pass=hash.update(pass);
    pass=hash.digest(pass);

    con.connect(function(err) {
        if (err){
            console.log(err);
        };
        // inserting new user data
        con.query(`SELECT user_id FROM userprofile WHERE user_email=(SELECT user_email FROM users WHERE user_email='${req.session.user.username}' AND user_pass='${pass.toString('hex')}')`,function(er,resu){
            if(er){
                console.log(er);
            } else {
                if(Object.keys(resu).length>0){
                        var sql=`INSERT INTO stock(item_name,img,rate,unit_av,DOM,DOE,user_id) VALUES('${productName}',?,${rate},${Weight},curdate(),'${date}','${resu[0].user_id}')`;
                        console.log(sql);
                        con.query(sql,[data],function(error,result1){
                            if (error){
                                console.log(error);
                            } else {
                                res.redirect("/shop-en");
                            }
                        });
                }else{
                    res.redirect("/signin-en");
                }
            }
        });
       
    });
});
  

// end

/* Kannada pages*/
app.get("/kn", function(req, res) {
    if(req.session.user){
        res.render('index-kn', { sgdata: "ಲಾಗ್ ಔಟ್"});
    } else {
        res.render('index-kn', { sgdata: "ಸೈನ್ ಇನ್"});
    }
});

app.get("/about-kn",(req,res)=>{
    if(req.session.user){
        res.render('about-kn', { sgdata: "ಲಾಗ್ ಔಟ್"});
    } else {
        res.render('about-kn', { sgdata: "ಸೈನ್ ಇನ್"});
    }
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
        res.render('signin-kn');
    }
});

app.get("/shop-kn",(req,res)=>{
    con.query('SELECT * FROM stock',function(err,rows){
        if (err) {
              console.error('Error fetching data from MySQL:', err);
              res.status(500).send('Error fetching data from MySQL');
              return;
            }
        res.render('shop-kn',{productId: -1, data:rows});
    });
    //res.sendFile(__dirname+"/shop.ejs");
});

app.get('/register-kn', function(req, res) {
    res.render('register-kn');
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

app.get("/add-cart-kn",(req,res)=>{

    const itemid=req.query.value;
    const eml=req.session.user;
    const productId = req.body.value;
  console.log(productId);
  // Find the product in your database based on the productId
  if(req.session.user){
    con.query(`select user_id from userprofile where user_email='${eml.username}'`,function(error,result){
        if (error){
            res.redirect('/signin-en');
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
                console.log("done");
            });
        }
            /*con.query(`SELECT * FROM stock WHERE item_id=${productId}`, (err, results) => {
                // console.log(results[0]['rate']);
                const json = JSON.stringify(results[0]);
                if (err) {
                    console.error('Error', err);
                    res.status(500).send('Error');
                    return;
                }
            });
            if(results.length > 0){
                res.render('cart', {data:results[0]});
            } else
            {
                res.render('cart', {data:[]})
            }*/
            res.redirect("shop-kn")
    });
    
} else {
    res.redirect('/signin-en');
    }
});

app.get("/get-cart-kn", function(req, res) {
    const eml=req.session.user;
    const productId = req.body.value;
  console.log(productId);
    if(req.session.user) {
        con.query(`select user_id from userprofile where user_email='${eml.username}'`,function(error,result){
            var uid=result[0].user_id;
        con.query(`select * from (SELECT orders.user_id,orders.item_id,stock.item_name,stock.rate,orders.units FROM orders inner JOIN stock ON orders.item_id=stock.item_id) as merge where merge.user_id='${uid}';`,function(err,rows){
            if(err){
                  console.error('Error fetching data from MySQL:',err);
                  res.status(500).send('Error fetching data from MySQL');
                  return;
                }
                    res.render('cart-kn',{sgdata: "Log out", data1:rows});
           
        });
       });
    } else {
        res.redirect('/signin-kn');
    }
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

app.get("/failReg-kn", function(req, res) {
    res.render('failReg-kn', { sgdata: "ಸೈನ್ ಇನ್" });
});

app.get("/list-prod-kn", function (req, res) {
    if(req.session.user){
        if(req.session.user.category === 1){
        res.render('listProducts-kn');
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

                res.render(// <!DOCTYPE html>
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
                'profile-edit-kn');
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
            res.render('failReg-kn');
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

app.listen(8000,()=>{
    console.log("Server running on port 8000");
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
