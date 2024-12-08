module.exports = [
	{
		"inputs": [
			{
				"internalType": "string",
				"name": "_id",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "reward",
				"type": "string"
			}
		],
		"name": "addRewardHistory",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "string",
				"name": "_id",
				"type": "string"
			}
		],
		"name": "getUserAdditional",
		"outputs": [
			{
				"internalType": "string",
				"name": "lastLogin",
				"type": "string"
			},
			{
				"internalType": "uint256",
				"name": "streakCount",
				"type": "uint256"
			},
			{
				"internalType": "bool",
				"name": "profileCompletedRewardGiven",
				"type": "bool"
			},
			{
				"internalType": "string",
				"name": "dateOfBirth",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "gender",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "mobile",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "addressDetails",
				"type": "string"
			},
			{
				"internalType": "uint256",
				"name": "otp",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "otpExpiration",
				"type": "uint256"
			},
			{
				"internalType": "string[]",
				"name": "rewardHistory",
				"type": "string[]"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "string",
				"name": "_id",
				"type": "string"
			}
		],
		"name": "getUserBasic",
		"outputs": [
			{
				"internalType": "string",
				"name": "name",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "email",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "password",
				"type": "string"
			},
			{
				"internalType": "uint256",
				"name": "points",
				"type": "uint256"
			},
			{
				"internalType": "bool",
				"name": "isVerified",
				"type": "bool"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "string",
				"name": "_id",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "_lastLogin",
				"type": "string"
			},
			{
				"internalType": "uint256",
				"name": "_streakCount",
				"type": "uint256"
			},
			{
				"internalType": "string",
				"name": "_dateOfBirth",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "_gender",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "_mobile",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "_addressDetails",
				"type": "string"
			}
		],
		"name": "storeUserAdditional",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "string",
				"name": "_id",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "_name",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "_email",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "_password",
				"type": "string"
			},
			{
				"internalType": "uint256",
				"name": "_points",
				"type": "uint256"
			},
			{
				"internalType": "bool",
				"name": "_isVerified",
				"type": "bool"
			}
		],
		"name": "storeUserBasic",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "string",
				"name": "_id",
				"type": "string"
			},
			{
				"internalType": "uint256",
				"name": "_otp",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "_otpExpiration",
				"type": "uint256"
			}
		],
		"name": "updateUserOtp",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	}
];
