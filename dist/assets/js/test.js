"use strict";var fate="fate";function stay(){return 123}var obj={name:"saber",age:"18"},proxy=new Proxy(obj,function(){console.log(obj)});console.log(stay());