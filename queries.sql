create database agronow;

use agronow;

create table users(user_email varchar(20) primary key,user_pass varchar(64),category boolean not null);

create table userprofile(user_id int primary key,user_email varchar(20),foreign key(user_email)references users(user_email),firstname varchar(50) not null,lastname varchar(50) not null,phone_no int(10) not null,address varchar(100) not null,city varchar(20) not null,state varchar(20) not null,pincode int(6) not null);

create table stock(item_id varchar(10) primary key,unit_av int(3),unit_sold int(3),DOM date not null,DOE date not null,user_id int,foreign key(user_id)references userprofile(user_id));

create table orders(order_id varchar(10) primary key,DOD date,DOO date,user_id int,foreign key(user_id)references userprofile(user_id),item_id varchar(10),foreign key(item_id)references stock(item_id),units int(3));
