const express = require('express')
const app = express()
const port = 5000
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const config = require('./config/key');
const { auth } = require('./middleware/auth');

const { User } = require("./models/User");

app.use(bodyParser.urlencoded({extended: true}));

app.use(bodyParser.json());
app.use(cookieParser());

const mongoose = require('mongoose')
mongoose.connect(config.mongoURI, {
	useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true, useFindAndModify: false
}).then(() => {
	console.log('MongoDB Connected...')
}).catch(err => {
	console.log(err)
})

app.get('/', (req, res) => {
	res.send('Hello World! 안녕하세요!')
})

app.post('/api/users/register', (req, res) => {

	const user = new User(req.body)

	user.save((err, userInfo) => {
		if(err) return res.json({ success: false, err})
		return res.status(200).json({
			success: true
		})
	})
})

app.post('/api/users/login', (req, res) => {
	// 요청된 이메일을 데이터베이스에서 있는지 탐색
	User.findOne({ email: req.body.email }, (err, user) => {
		if(!user) {
			return res.json({
				loginSuccess: false,
				message: "제공된 이메일에 해당하는 유저가 없습니다."
			})
		}
		// 요청된 이메일이 데이터베이스에서 있다면 비밀번호가 맞는지 확인
		user.comparePassword(req.body.password, (err, isMatch) => {

			if(!isMatch)
				return res.json({ loginSuccess: false, message: "비밀번호가 틀렸습니다." })
			// 비밀번호까지 맞다면 토큰 생성
			user.generateToken((err, user) => {
				if(err) return res.status(400).send(err);
				
				// 토큰 저장
				res.cookie("x_auth", user.token)
					.status(200)
					.json({ loginSuccess: true, userId: user._id })
			})
		})
	})
})

app.get('/api/users/auth', auth, (req,res) => {
	// 여기까지 미들웨어를 통과했다는 것은 authentication이 ture라는 말
	res.status(200).json({
		_id: req.user._id,
		isAdmin: req.user.role === 0 ? false : true,
		isAuth: true,
		email: req.user.email,
		name: req.user.name,
		lastname: req.user.lastname,
		role: req.user.role,
		image: req.user.image
	})
})

app.get('/api/users/logout', auth, (req, res) => {
	User,findOneAndUpdate(
		{ _id: req.user._id },
		{ token: "" }
		, (err, user) => {
			if(err) return res.json({ success: false, err });
			return res.status(200).send({
				success: true
			})
		}
	)
})

app.listen(port, () => {
	console.log(`Example app listening at http://localhost:${port}`)
})