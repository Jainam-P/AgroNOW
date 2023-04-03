//const alert=require('alert');
const express=require('express');
const cookieParser=require("cookie-parser");
const sessions=require('express-session');
const http=require('http');
var parseUrl=require('body-parser');
const app=express();
app.use(express.static("public"));

var mysql=require('mysql');
const{encode}=require('punycode');

var crypto=require('crypto');

app.set('view engine', 'ejs');

let encodeUrl=parseUrl.urlencoded({extended:false});

//session middleware
app.use(sessions({
    secret:"thisismysecrctekey",
    saveUninitialized:true,
    cookie:{maxAge:1000*60*60*1}, // 1 hours
    resave:false
}));

app.use(cookieParser());

// app.use(bodyParser.urlencoded({ extended: true }));
// app.use(bodyParser.json());

var con=mysql.createConnection({
    host:"localhost",
    user:"root", // my username
    password:"", // my password
    database:"agronow"
});

app.get('/', function(req, res) {
    res.sendFile(__dirname + '/index.html');
});

app.get('/register', function(req, res) {
    res.sendFile(__dirname + '/register.html');
});

app.post('/register',encodeUrl,(req,res)=>{
    var hash=crypto.createHash('sha256');
    var email=req.body.email;
    var password=req.body.enterpass;
    var pass=req.body.confirmpass;
    if(password==pass){
    password=hash.update(password); 
    password=hash.digest(password);
    }
    var category=req.body.accounttype;
    if(category=='farmer')
    {
        category=true;
    }
    else if(category=='customer')
    {
        category=false;
    }
    else {
        res.redirect("/register");
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
                    username:email
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
                __dirname + '/my-account.html');
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

app.get("/signin",(req,res)=>{
    res.sendFile(__dirname+"/signin.html");
});

app.post("/login",encodeUrl,(req,res)=>{
    var hash=crypto.createHash('sha256');
    var userName=req.body.username;
    var password=req.body.password;
    password=hash.update(password);
    password=hash.digest(password);

    con.connect(function(err){
        if(err){
            console.log(err);
        };
        con.query(`SELECT * FROM users WHERE user_email='${userName}' AND user_pass='${password.toString('hex')}'`,function(err,result){
          if(err){
            console.log(err);
          };

          function userPage(){
            // We create a session for the dashboard (user page) page and save the user data to this session:
            req.session.user={
                username:userName,
                password:password 
            };

            res.sendFile(
            // <!DOCTYPE html>
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
            // 
            __dirname + '/my-account.html');
        }

        if(Object.keys(result).length>0){
            userPage();
        }else{
            res.sendFile(__dirname + '/my-account.html');
        }
        });
    });
});


app.get('/logout',  function (req, res, next)  {
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

//app.listen(3000,function(){
//  console.log('Shopping cart app listening on port 3000!');
//});


app.get("/contact",(req,res)=>{
    res.sendFile(__dirname+"/contact-us.html");
});

app.use(express.static(__dirname));

app.set('views',__dirname);

app.get("/shop",(req,res)=>{
    con.query('SELECT * FROM stock',function(err,rows){
        if (err) {
              console.error('Error fetching data from MySQL:', err);
              res.status(500).send('Error fetching data from MySQL');
              return;
            }
        res.render("shop",{data:rows});
    });
    //res.sendFile(__dirname+"/shop.ejs");
});
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

app.get("/about",(req,res)=>{
    res.sendFile(__dirname+"/about.html");
});

app.get("/cart",(req,res)=>{
    const itemid=req.query.value;
    const eml=req.session.user;
    con.query(`select user_id from userprofile where user_email='${eml.username}'`,function(error,result){
                    if (error){
                        res.sendFile(__dirname+"/signin.html");
                    }else{
                        var uid=result[0].user_id;
                        con.query(`select * from orders where user_id='${uid}' and item_id='${itemid}'`,function(erro,res){
                            if(Object.keys(res).length>0){
                                con.query(`UPDATE orders SET units=units+1 WHERE user_id='${uid}' and item_id='${itemid}'`,function(err,res){
                                    res.sendFile(__dirname+"/cart.html");
                                });
                            }else{
                                con.query(`INSERT INTO orders(DOO,DOD,user_id,item_id,units,status) VALUES(curdate(),curdate()+1,${uid},${itemid},1,0)`,function(err,res){
                                    res.sendFile(__dirname+"/cart.html");
                                });
                            }
                        });
                        
                    };
                });
    
    
});

app.get("/checkout",(req,res)=>{
    res.sendFile(__dirname+"/checkout.html");
});

app.listen(4000,()=>{
    console.log("Server running on port 4000");
});

// app.post("/contact",(req,res)=>{
//     var name = req.body.name;
//     var email = req.body.email;
//     var subject = req.body.subject;
//     var message = req.body.message;

// });


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
