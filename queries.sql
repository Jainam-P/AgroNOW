create database agronow;

use agronow;

create table users(user_email varchar(100) primary key,user_pass varchar(64),category boolean not null);
insert into users(user_email,user_pass,category) VALUES
('abc@xyz.com','7c0186c5c75fc3b4434a31302f44c22ea222ae35e34dcd26a1b19ee16dcc1a51',0),
('jainam.purushotam@btech.christuniversity.in','7e9439014fdad34f49b054f383d382bba9806b9228064bc0b1b8d956eceb6911',1),
('def@abc.xyz','d9ede7c2ece01b059ec3af2f8b47836a6feda626cf0a76e49c6c9be2b151456d',0),
('jainampatel999@gmail.com','e5857b335afdf35ca81a110bc81f38682f8a89892cc597f5398dfef82d42b513',1);

create table userprofile(user_id int primary key AUTO_INCREMENT,user_email varchar(100),foreign key(user_email)references users(user_email),firstname varchar(50) not null,lastname varchar(50) not null,phone_no bigint(10) not null,address varchar(100) not null,city varchar(20) not null,state varchar(20) not null,pincode int(6) not null);

insert into userprofile(user_email,firstname,lastname,phone_no,address,city,state,pincode) VALUES
('abc@xyz.com','abc','xyz',9876543210,'Kengeri','Bengaluru','Karnataka',560074),
('jainampatel999@gmail.com','jainam','Patel',9513578524,'Sangeeta wadi','Dombivali','Maharashtra',421201),
('def@abc.xyz','def','abc',7531596542,'Hennur','Bengaluru','karnataka',560054);

create table stock(item_id int primary key AUTO_INCREMENT,item_name varchar(50),img BLOB,rate bigint(10),unit_av int(3),DOM date not null,DOE date not null,user_id int,foreign key(user_id)references userprofile(user_id));

insert into stock(item_name,img,rate,unit_av,DOM,DOE,user_id) VALUES
('Carrot',LOAD_FILE('C:/Users/jaina/Downloads/AgroNOW/public/images/Carrot.jpg'),10,15,'2023-1-1','2023-1-15',1),
('Tomato',LOAD_FILE('C:/Users/jaina/Downloads/AgroNOW/public/images/Tomato.jpg'),30,16,'2023-1-5','2023-1-15',2),
('Pea',LOAD_FILE('C:/Users/jaina/Downloads/AgroNOW/public/images/Pea.jpg'),27,48,'2023-1-1','2023-1-15',1),
('Grapes',LOAD_FILE('C:/Users/jaina/Downloads/AgroNOW/public/images/Grapes.jpg'),31,30,'2023-1-1','2023-1-15',3),
('Orange',LOAD_FILE('C:/Users/jaina/Downloads/AgroNOW/public/images/Orange.jpg'),10,10,'2023-1-1','2023-1-15',2),
('Papaya',LOAD_FILE('C:/Users/jaina/Downloads/AgroNOW/public/images/Papaya.jpg'),15,10,'2023-1-1','2023-1-15',1),
('Cherry',LOAD_FILE('C:/Users/jaina/Downloads/AgroNOW/public/images/Cherry.jpg'),50,55,'2023-1-1','2023-1-15',1),
('Pumpkin',LOAD_FILE('C:/Users/jaina/Downloads/AgroNOW/public/images/Pumpkin.jpg'),35,60,'2023-1-1','2023-1-15',3),
('Strawberry',LOAD_FILE('C:/Users/jaina/Downloads/AgroNOW/public/images/Strawberry.jpg'),10,15,'2023-1-1','2023-1-15',3),
('Mung',LOAD_FILE('C:/Users/jaina/Downloads/AgroNOW/public/images/Mung.jpg'),10,15,'2023-1-1','2023-1-15',3),
('Beatroot',LOAD_FILE('C:/Users/jaina/Downloads/AgroNOW/public/images/Beatroot.jpg'),10,15,'2023-1-1','2023-1-15',1),
('Chilli',LOAD_FILE('C:/Users/jaina/Downloads/AgroNOW/public/images/Chilli.jpg'),10,15,'2023-1-1','2023-1-15',2);

create table orders(order_id int primary key AUTO_INCREMENT,DOD date,DOO date,user_id int,foreign key(user_id)references userprofile(user_id),item_id int,foreign key(item_id)references stock(item_id),units int(3),status boolean not null);
