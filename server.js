const express = require('express');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const bodyParser = require('body-parser');
const cors = require('cors');
const dotenv = require('dotenv');
const crypto = require('crypto');
const SibApiV3Sdk = require('sib-api-v3-sdk');
const { Post, User } = require('./models/User');
const { Web3 } = require('web3');

dotenv.config();

const app = express();
const cropDataPath = path.join(__dirname, 'cropdata.json');

app.use(bodyParser.json());
app.use(cors());

// Web3 and Blockchain contract setup
const web3 = new Web3(new Web3.providers.HttpProvider(process.env.GANACHE_URL));
const contractABI = require('./contractABI'); 
const contractAddress = process.env.CONTRACT_ADDRESS;
const contract = new web3.eth.Contract(contractABI, contractAddress);

// Waterfootprint-api
app.get("/api/crops/:name", (req, res) => {
  const cropName = req.params.name;

  try {
    // Read crop data from file
    const data = JSON.parse(fs.readFileSync(cropDataPath, "utf-8"));
    
    // Find crop using case-insensitive search
    const crop = data.find((item) => 
      item["Crop Name"].toLowerCase() === cropName.toLowerCase()
    );

    if (crop) {
      res.status(200).json(crop);
    } else {
      res.status(404).json({ message: "Crop not found" });
    }
  } catch (error) {
    console.error("Error reading crop data:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

//add product
app.post("/api/add-product", async (req, res) => {
  const { userId, cropName } = req.body;

  try {
    // Read crop data from file
    const data = JSON.parse(fs.readFileSync(cropDataPath, "utf-8"));

    // Find the crop using a case-insensitive search
    const crop = data.find((item) =>
      item["Crop Name"].toLowerCase() === cropName.toLowerCase()
    );

    if (!crop) {
      return res.status(404).json({ message: "Crop not found" });
    }

    // Find the user by userId
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Add the crop's water footprint to the user's consumed water footprint
    user.consumedWaterFootprint += crop["Total WF (m\u00b3/ton)"]; // Assuming "Water Footprint" is a key in your crop data

    // Save the updated user data
    await user.save();

    // Return the updated consumed water footprint
    res.status(200).json({
      message: "Product added successfully!",
      consumedWaterFootprint: user.consumedWaterFootprint,
    });
  } catch (error) {
    console.error("Error adding product:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

//mongodbconnection
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1); 
  });

// Session configuration
app.use(
  session({
    secret: process.env.SESSION_SECRET, 
    resave: false, 
    saveUninitialized: false, 
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000 
    }
  })
);

// Helper function to generate OTP
const generateOtp = () => {
  return crypto.randomInt(100000, 999999).toString(); 
};

// Initialize Brevo client
const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
const defaultClient = SibApiV3Sdk.ApiClient.instance;
const apiKey = defaultClient.authentications['api-key'];
apiKey.apiKey = process.env.BREVO_API_KEY; 

// Helper function to send OTP email using Brevo
const sendOtpEmail = async (email, otp) => {
  const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
  sendSmtpEmail.subject = 'Email Verification OTP';
  sendSmtpEmail.sender = { email: 'metricsaqua@gmail.com' }; 
  sendSmtpEmail.to = [{ email }];  
  sendSmtpEmail.htmlContent = `
  <html>
    <body style="font-family: Arial, sans-serif; background-color: #f4f6f9; padding: 20px;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);">
        <h2 style="color: #4CAF50; text-align: center;">Welcome to AquaMetrics!</h2>
        <p style="font-size: 16px; color: #333333;">Thank you for signing up with AquaMetrics. We are excited to have you on board!</p>
        <p style="font-size: 16px; color: #333333;">To complete your email verification, please use the following One-Time Password (OTP):</p>
        <div style="text-align: center; margin: 20px 0;">
          <h3 style="font-size: 24px; color: #4CAF50; font-weight: bold; background-color: #f1f1f1; padding: 15px; border-radius: 8px;">${otp}</h3>
        </div>
        <p style="font-size: 16px; color: #333333;">This OTP is valid for 10 minutes. Please use it promptly to complete your verification process.</p>
        <p style="font-size: 16px; color: #333333;">If you did not request this verification, please ignore this email.</p>
        <div style="text-align: center; margin-top: 30px;">
          <p style="font-size: 14px; color: #888888;">Thank you for choosing AquaMetrics.</p>
        </div>
      </div>
    </body>
  </html>
`;

  try {
    const response = await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log('OTP sent to email:', response);
  } catch (error) {
    console.error('Error sending OTP email:', error);
  }
};


app.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Email validation
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        message: 'Invalid email format. Please provide a valid email address.'
      });
    }

    // Password validation
    const isValidPassword = (password) => {
      const passwordRegex = /^(?=.*[A-Z])(?=.*[@$!%?&#])[A-Za-z\d@$!%?&#]{8,}$/;
      return passwordRegex.test(password);
    };
    
    if (!isValidPassword(password)) {
      return res.status(400).json({
        message: 'Password must be at least 8 characters long, with one uppercase letter and one special character.'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: 'User already exists' });

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate OTP
    const otp = generateOtp();
    const otpExpiration = new Date(Date.now() + 10 * 60 * 1000); 

    // Create new user
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      otp,  
      otpExpiration 
    });

    await newUser.save();

    // Send OTP email using Brevo
    await sendOtpEmail(email, otp);

    // Store basic user info on blockchain
    const tx = contract.methods.storeUserBasic(String(name), String(email), String(password));
    const gas = await tx.estimateGas({ from: process.env.WALLET_ADDRESS });
    const gasPrice = await web3.eth.getGasPrice();

    const signedTx = await web3.eth.accounts.signTransaction(
      {
        from: process.env.WALLET_ADDRESS,
        to: contractAddress,
        data: tx.encodeABI(),
        gas,
        gasPrice,
      },
      process.env.PRIVATE_KEY
    );

    const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
    console.log('Blockchain transaction successful:', receipt);

    // Return response indicating OTP is sent
    res.status(201).json({ message: 'User registered successfully. OTP sent to email for verification.' });
  } catch (error) {
    console.error('Error during registration:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Login Route
app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'No user found. Please SignUp' });

    // Validate password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid password' });

    const now = new Date();
    const lastLogin = user.lastLogin ? new Date(user.lastLogin) : null;

    if (lastLogin && now.toDateString() === lastLogin.toDateString()) {
      // Already logged in today
    } else {
      // First login today
      if (lastLogin && (now - lastLogin) / (1000 * 60 * 60 * 24) === 1) {
        // Consecutive day login
        user.streakCount += 1;
      } else {
        // Streak reset
        user.streakCount = 1;
      }

      const rewardPoints = user.streakCount * 1; 
      user.points += rewardPoints;
      user.lastLogin = now;
      await user.save();
    }

    // Store user info in session
    req.session.userId = user._id;
    req.session.userEmail = user.email;

    res.status(200).json({ message: 'Login successful' });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Middleware to authenticate session
const authenticateSession = (req, res, next) => {
  if (!req.session.userId) {
    return res.status(401).json({ message: 'Access denied, please login' });
  }
  next();
};

// Forgot Password Route
app.post('/forgot-password', async (req, res) => {
  const { email } = req.body;

  try {
    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'User not found' });

    // Generate OTP
    const otp = crypto.randomInt(100000, 999999).toString(); // 6-digit OTP

    // Set OTP expiration time (10 minutes)
    const otpExpiration = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

    // Save OTP and expiration time to the user
    user.otp = otp;
    user.otpExpiration = otpExpiration;
    await user.save();

    // Send OTP to user's email
    await sendOtpEmail(email, otp);
    res.status(200).json({ message: 'OTP sent to email' });
  } catch (error) {
    console.error('Error during forgot password process:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Verify OTP Route
app.post('/verify-otp', async (req, res) => {
  const { email, otp } = req.body;

  try {
    // Find user by email
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'User not found' });

    // Check if OTP matches
    if (user.otp !== otp) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    // Check if OTP has expired
    if (new Date() > user.otpExpiration) {
      return res.status(400).json({ message: 'OTP expired' });
    }

    // Mark user as verified (could be a new field like isVerified)
    user.isVerified = true;
    user.otp = null; // Clear OTP after verification
    user.otpExpiration = null; // Clear OTP expiration
    await user.save();

    res.status(200).json({ message: 'OTP verified successfully. Account activated.' });
  } catch (error) {
    console.error('Error during OTP verification:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Reset Password Route
app.post('/reset-password', async (req, res) => {
  const { email, newPassword } = req.body;

  try {
    // Check if password is valid
    const isValidPassword = (password) => {
      const passwordRegex = /^(?=.*[A-Z])(?=.*[@$!%?&#])[A-Za-z\d@$!%?&#]{8,}$/;
      return passwordRegex.test(password);
    };
    if (!isValidPassword(newPassword)) {
      return res.status(400).json({
        message: 'Password must be at least 8 characters long, with one uppercase letter and one special character.'
      });
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'User not found' });

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    user.password = hashedPassword;
    user.otp = null;  // Clear OTP after successful reset
    user.otpExpiration = null;  // Clear OTP expiration
    await user.save();

    res.status(200).json({ message: 'Password reset successful' });
  } catch (error) {
    console.error('Error during password reset:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Logout Route
app.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ message: 'Failed to logout' });
    }
    res.clearCookie('connect.sid'); 
    res.status(200).json({ message: 'Logout successful' });
  });
});

// Utility function to calculate profile rewards and completion
const calculateProfileRewards = async (user, profileUpdates) => {
  let rewardPoints = 0;
  const requiredFields = ['name', 'dateOfBirth', 'gender', 'mobile', 'address'];
  const rewardEntries = [];

  // Check and reward points for new field updates
  requiredFields.forEach((field) => {
    if (!user[field] && profileUpdates[field]) {
      rewardPoints += 5; // 5 points for each field filled
      rewardEntries.push({
        points: 5,
        reason: `Filled missing field: ${field}`,
      });
    }
  });

  // Check if profile is complete
  const isProfileComplete = requiredFields.every((field) => user[field] || profileUpdates[field]);

  if (isProfileComplete && !user.profileCompletedRewardGiven) {
    rewardPoints += 30; // One-time reward for completing profile
    user.profileCompletedRewardGiven = true; // Mark as rewarded
    rewardEntries.push({
      points: 30,
      reason: 'Completed profile',
    });
  }

  user.points += rewardPoints;

  // Append new entries to reward history
  if (rewardEntries.length > 0) {
    user.rewardHistory = [...user.rewardHistory, ...rewardEntries];
  }

  return { rewardPoints, isProfileComplete };
};

// Profile Edit Route (Authenticated)
app.post('/profile/edit', authenticateSession, async (req, res) => {
  const { name, dateOfBirth, gender, mobile, address } = req.body;

  try {
    // Allow editing of other users' profiles if the request comes from the same user
    const user = await User.findOne({ _id: req.body.userId });
    if (!user) return res.status(400).json({ message: 'User not found' });

    // Prepare profile updates from the request
    const profileUpdates = { name, dateOfBirth, gender, mobile, address };

    // Call the utility function to calculate rewards and profile completion
    const { rewardPoints, isProfileComplete } = await calculateProfileRewards(user, profileUpdates);

    // Apply the updates to the user's profile
    Object.keys(profileUpdates).forEach((key) => {
      if (profileUpdates[key]) user[key] = profileUpdates[key];
    });

    await user.save(); // Save the updated user data

    // Send the response
    res.status(200).json({
      message: `Profile updated successfully. ${rewardPoints} points awarded.`,
      isProfileComplete,
    });
  } catch (error) {
    console.error('Error during profile update:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

//API route to fetch the user's points and streak details
app.get('/rewards', authenticateSession, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.status(200).json({
      points: user.points,
      streak: user.streakCount,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

//Reward History
app.post('/history', authenticateSession, async (req, res) => {
  try {
      const userId = req.session.userId;

      // Fetch user details from the database
      const user = await User.findOne({ userId });

      // Ensure rewardHistory exists or assign an empty array
      const rewardHistory = user?.rewardHistory || [];

      // Respond with the reward history
      return res.status(200).json({ rewardHistory });
  } catch (error) {
      // Handle any errors
      console.error('Error fetching reward history:', error);
      return res.status(500).send({ error: 'Failed to fetch reward history.' });
  }
});

// Get the leaderboard (top 10 users by points)
app.get('/top', async (req, res) => {
  try {
    const topUsers = await User.find().sort({ points: -1 }).limit(10); 
    res.json(topUsers);
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update points for a user
app.post('/update', async (req, res) => {
  try {
    const { email, points } = req.body;  

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.points += points;  
    await user.save(); 

    res.status(200).json({ message: 'Points updated successfully', user });
  } catch (error) {
    console.error('Error updating points:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Fetch the username of a given user ID
app.get('/username/:userId', async (req, res) => {
  const { userId } = req.params;

  try {
    // Fetch user by ID from session
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Send username as response
    res.status(200).json({ username: user.name });
  } catch (error) {
    console.error('Error fetching current user:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a new text post
app.post('/community/create', authenticateSession, async (req, res) => {
  const { text } = req.body;
  const userId = req.session.userId;

  if (!text) {
    return res.status(400).json({ message: 'Text content is required' });
  }

  try {
    // Ensure userId is valid
    const userExists = await User.findById(userId);
    if (!userExists) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Create the post
    const post = new Post({
      user: userId,  // Just reference the existing user
      text: text,    // Content of the post
    });

    // Populate user details for the created post
    const populatedPost = await Post.findById(post._id).populate('user', 'name').populate('likes', 'name');

    // Save the post to the database
    await post.save();

    res.status(201).json({ message: 'Post created successfully', post });
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({ message: 'Error creating post' });
  }
});

// Get all posts
app.get('/community/all', async (req, res) => {
  try {
    const posts = await Post.find()
      .populate('user', 'name') // Populate user details for each post
      .populate('likes', 'name') // Populate liked users if needed
      .sort({ createdAt: -1 });
    const postsWithUsernames = posts.map(post => ({
      ...post.toObject(),
      name: post.user ? post.user.name : 'Anonymous'
    }));

    res.status(200).json({ posts });
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ message: 'Error fetching posts' });
  }
});

// Delete Account Route (Authenticated)
app.delete('/profile/delete', authenticateSession, async (req, res) => {
  try {
    // Find and delete the user from the database
    const user = await User.findByIdAndDelete(req.session.userId);
    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }

    // Destroy the user's session
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: 'Failed to logout after deletion' });
      }
      res.clearCookie('connect.sid'); // Clear session cookie
      res.status(200).json({ message: 'Account deleted successfully and logged out' });
    });
  } catch (error) {
    console.error('Error during account deletion:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Shutdown Logic (Graceful)
const server = app.listen(process.env.PORT || 8000, () => {
  console.log(`Server running on port ${process.env.PORT || 8000}`);
});

const shutdown = () => {
  console.log('Received shutdown signal, gracefully shutting down...');
  server.close((err) => {
    if (err) {
      console.error('Error during shutdown:', err);
      process.exit(1); 
    } else {
      console.log('Server shutdown completed');
      process.exit(0); 
    }
  });

  setTimeout(() => {
    console.error('Forced shutdown after 10 seconds');
    process.exit(1);
  }, 10000);
};

process.on('SIGINT', shutdown); 
process.on('SIGTERM', shutdown);

