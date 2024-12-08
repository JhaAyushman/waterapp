const mongoose = require('mongoose');

const rewardEntrySchema = new mongoose.Schema({
  points: Number,
  reason: String,
  date: { type: Date, default: Date.now },
});

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  points: { type: Number, default: 0 },
  lastLogin: { type: Date, default: null }, 
  streakCount: { type: Number, default: 0 },
  profileCompletedRewardGiven: { type: Boolean, default: false },
  dateOfBirth: String,
  gender: String,
  mobile: String,
  address: String,
  otp: String,
  otpExpiration: Date,
  isVerified: { type: Boolean, default: false },
  rewardHistory: [
    {
      date: { type: Date, default: Date.now },
      points: Number,
      reason: String,
    },
  ]
});

const postSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, required: true },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  createdAt: { type: Date, default: Date.now },
});

const Post = mongoose.model('Post', postSchema);
const User = mongoose.models.User || mongoose.model('User', userSchema);

module.exports = { User, Post };