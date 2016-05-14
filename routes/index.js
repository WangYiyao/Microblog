var express = require('express');
var router = express.Router();
var app = express();
var crypto = require('crypto');
var User = require('../models/user.js');
var Post = require('../models/post.js');
/* GET home page. */
router.get('/', function(req, res) {
	Post.get(null,function(err,posts){
		if(err){
			posts = [];
		}
		res.render('index',{
			title:'Microblog',
			posts:posts,
			user:req.session.user,
			success:req.flash('success').toString(),
			error:req.flash('error').toString()
		});
	});
});
router.get('/blog',function(req,res){
	Post.get(null,function(err,posts){
		if(err){
			posts = [];
		}
		res.render('index',{
			title:'微博首页',
			posts:posts,
			user:req.session.user,
			success:req.flash('success').toString(),
			error:req.flash('error').toString()
		});
	});
});

//注册
router.get('/reg',checkNotLogin);
router.get('/reg',function(req,res){
	res.render('reg',{title:'用户注册'});
});

//登陆
router.get('/login',checkNotLogin);
router.get('/login',function(req,res){
	res.render('login',{title:'用户登陆'});
});

//登出
router.get('/logout',checkLogin);
router.get('/logout',function(req,res){
	// res.render('',{title:'用户注册'});
	req.session.user = null;
	req.flash('success','退出成功');
	res.redirect('/blog')
});

router.post('/login',checkNotLogin);
router.post('/login',function(req,res){
	var md5 = crypto.createHash('md5');
	var password = md5.update(req.body.password).digest('base64');

	User.get(req.body.username,function(err,user){
		if(!user){
			req.flash('error','用户不存在');
			return res.redirect('/login');
		}
		if(user.password != password){
			req.flash('error','用户名或密码错误');
			return res.redirect('/login');
		}
		req.session.user = user;
		req.flash('success',req.session.user.name + '登陆成功');
		res.redirect('/blog');
	});
});



router.post('/reg',checkNotLogin);
router.post('/reg',function(req,res){
	console.log('password-----'+req.body['password']);
	console.log('password-repeat-----'+req.body['password-repeat']);
	if(req.body['password'] != req.body['password-repeat']){
		req.flash('error','两次输入的密码不一致');
		return res.redirect('/reg');
	}
	//生成口令的散列值
	var md5 = crypto.createHash('md5');
	var password = md5.update(req.body.password).digest('base64');

	var newUser = new User({
		name: req.body.username,
		password:password
	})
	//检查用户名是否已被占用
	User.get(newUser.name, function(err,user){
		if(user){
			err = '用户名已存在';
		}
		if(err){
			req.flash('error',err);
			return res.redirect('/reg');
		}
		newUser.save(function(err){
			if(err){
				req.flash('error',err);
				return res.redirect('/reg');
			}
			req.session.user = newUser;
			req.flash('success',req.session.user.name+'注册成功');
			res.redirect('./blog');
		});
	});
});

function checkNotLogin(req,res,next){
	if(req.session.user){
		req.flash('error','用户已登录');
		return res.redirect('/blog');
	}
	next();
}
function checkLogin(req,res,next){
	if(!req.session.user){
		req.flash('error','用户尚未登录');
		return res.redirect('/login');
	}
	next();
}

//发表微博
router.post('/post',checkLogin);
router.post('/post',function(req,res){
	var currentUser = req.session.user;
	var post = new Post(currentUser.name, req.body.post);
	post.save(function(err){
		if(err){
			req.flash('error',err);
			return res.redirect('/blog');
		}
		req.flash('success','发表成功');
		res.redirect('/u/' + currentUser.name);
	});
});

//用户个人页面展示
router.get('/u/:user',function(req,res){
	User.get(req.params.user,function(err,user){
		if(!user){
			req.flash('error','用户不存在');
			return res.redirect('/blog');
		}
		Post.get(user.name,function(err,posts){
			if(err){
				req.flash('error',err);
				return res.redirect('/blog');
			}
			res.render('user',{
				title:user.name,
				posts:posts
			});
		});
	});
});

module.exports = router;
