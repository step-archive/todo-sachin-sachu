const fs=require('fs');
const Resource=require('./resourceMetaData.js');
const ModifyPage=require('./modifyPage.js').ModifyPage;
const querystring=require('querystring');
const TodoApp = require('./models/todoApp.js');
const Handlers={};

const todoApp = new TodoApp();

Handlers.loadUser=function(req,res){
  let sessionid = req.cookies.sessionid;
  let user = todoApp.getUserBySessionId(sessionid);
  if(sessionid && user){
    req.user = user;
  }
};

Handlers.redirectLoggedOutUserToIndex= function(req,res){
  let requests=['/index.html','/','/login'];
  if(!req.urlIsOneOf(requests) && !req.user) res.redirect('/index.html');
};

Handlers.redirectLoggedInUserToHome= function(req, res){
  let requests=['/','/index.html'];
  if(req.urlIsOneOf(requests) && req.user) res.redirect('/home.html');
};

Handlers.getStatic=function(req,res){
  if (fs.existsSync(`./public${req.url}`)) {
    let resource=new Resource(req.url);
    res.setHeader('Content-type',resource.getContentType());
    let content=fs.readFileSync(`./public${req.url}`);
    res.write(content);
    res.end();
  }
};

Handlers.handleSlash = (req,res)=>{
  if (req.url == "/") {
    req.url = "/index.html";
  }
}

Handlers.handleLogin=function(req,res){
  if(!todoApp.isValidUser(req.body.userId,req.body.password)) {
    res.setHeader('Set-Cookie',`logInFailed=true; Max-Age=5`);
    res.redirect('/index.html');
    return;
  }
  let sessionid = new Date().getTime();
  res.setHeader('Set-Cookie',`sessionid=${sessionid}`);
  todoApp.addSessionIdTo(req.body.userId,sessionid)
  res.redirect('/home.html');
};

Handlers.getHome=function(req,res){
  res.setHeader('Content-type','text/html');
  let homeTemplate=fs.readFileSync('./webapp/public/template/home.html.template','utf8');
  let homePageSrc=ModifyPage.addUserName(homeTemplate,'${USER_NAME}',req.user.userName);
  let todoContent='[]';
  if(fs.existsSync(`./webapp/data/userData/${req.user.userName}.json`))
    todoContent =fs.readFileSync(`./webapp/data/userData/${req.user.userName}.json`,'utf8');
  if(!Object.keys(todoContent).length)
    homePageSrc=ModifyPage.removeText(homePageSrc,'${TODO}');
  else homePageSrc=ModifyPage.addTodoToHomePage(homePageSrc,'${TODO}',todoContent);
  res.write(homePageSrc);
  res.end();
};

Handlers.handleLogout=function(req,res){
  res.setHeader('Set-Cookie',[`sessionid=0;Max-Age=-1`]);
  delete req.user.sessionid;
  res.redirect('/index.html');
};

Handlers.getAddTodoPage=function(req,res){
  res.setHeader('Content-type','text/html');
  let addTodoTemplate=fs.readFileSync('./webapp/public/template/addTodo.html.template','utf8');
  let addTodoPageSrc=ModifyPage.addUserName(addTodoTemplate,'${USER_NAME}',req.user.userName);
  res.write(addTodoPageSrc);
  res.end();
};

Handlers.saveTodo=function(req,res){
  let todo=querystring.parse(req.queryString);
  let allTodo='[]';
  if(fs.existsSync(`./webapp/data/userData/${req.user.userName}.json`))
    allTodo=fs.readFileSync(`./webapp/data/userData/${req.user.userName}.json`,'utf8');
  let allTodoArray=JSON.parse(allTodo);
  allTodoArray.push(todo);
  fs.writeFileSync(`./webapp/data/userData/${req.user.userName}.json`,JSON.stringify(allTodoArray),'utf8');
  res.redirect('/home');
};

Handlers.viewTodo=function(req,res){
  let todoTitle=querystring.parse(req.queryString).viewTodo;
  let allTodo=fs.readFileSync(`./webapp/data/userData/${req.user.userName}.json`,'utf8');
  let allTodoArray=JSON.parse(allTodo);
  let requiredTodo=allTodoArray.filter(todo=>todo.title==todoTitle)[0];
  let viewTemplate=fs.readFileSync('./webapp/public/template/viewAndEditTodo.html.template','utf8');
  let viewPageSrc=viewTemplate.replace('${TODO_NAME}',requiredTodo.title);
  viewPageSrc=ModifyPage.addUserName(viewPageSrc,'${USER_NAME}',req.user.userName);
  viewPageSrc=ModifyPage.addTodoToViewPage(viewPageSrc,requiredTodo);
  res.write(viewPageSrc);
  res.end();
};

Handlers.deleteTodo=function(req,res){
  let todoName=querystring.parse(req.queryString);
  let allTodo=fs.readFileSync(`./webapp/data/userData/${req.user.userName}.json`,'utf8');
  let allTodoArray=JSON.parse(allTodo);
  let newArray=removeFromArray(allTodoArray,todoName.todoName);
  fs.writeFileSync(`./webapp/data/userData/${req.user.userName}.json`,JSON.stringify(newArray),'utf8');
  res.redirect('/home');
};

Handlers.fileNotFound = function(req,res){
  if (!res.finished) {
    res.statusCode = 404;
    let errorMessage=`Oops... File not found!!\nYou tried to access "${req.url}"`;
    res.write(errorMessage);
    res.end();
  }
}

let removeFromArray=function(array,itemToRemove){
  let finalArray=array;
  let index= array.findIndex(item=>item.title==itemToRemove);
  finalArray.splice(index,1);
  return finalArray;
};

exports.Handlers=Handlers;