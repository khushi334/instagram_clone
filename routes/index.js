const express = require('express');
const router = express.Router();

// Import your models here (Only ONCE each)
const User = require('./users'); 
const Post = require('../models/Post');
const Comment = require('../models/Comment');

// Your routes below (router.get, router.post, etc...)
// TEMPORARY: Run this once to create a valid user with passport hashing
router.get('/setup-user', async (req, res) => {
    try {
        const existingUser = await User.findOne({ username: 'sanskriti_codes' });
        if (existingUser) {
            return res.send(`User already exists! Use this ID in your routes: <strong>${existingUser._id}</strong>`);
        }

        // 1. Define user details without password here
        const userInstance = new User({
            username: 'sanskriti_codes',
            email: 'sanskriti@example.com',
            fullname: 'Sanskriti',
            dp: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150'
        });

        // 2. Use passport-local-mongoose .register() to handle hashing & saving the password safely
        const registeredUser = await User.register(userInstance, 'testpassword123');

        res.send(`User created successfully! Copy this ID and paste it into your routes: <strong>${registeredUser._id}</strong>`);
    } catch (err) {
        res.status(500).send("Error creating user: " + err.message);
    }
});
// GET Home Feed
// GET Home Feed
router.get('/', async (req, res) => {
    try {
        // Point .populate() explicitly to your lowercase 'user' model name
        const posts = await Post.find()
            .populate({ path: 'user', model: 'user' }) 
            .populate({
                path: 'comments',
                populate: { path: 'user', model: 'user' }
            })
            .sort({ createdAt: -1 });

        res.render('index', { posts: posts || [] });
    } catch (err) {
        console.error("Feed Query Error:", err);
        res.status(500).send("Error loading feed");
    }
});

// 1. CREATE A NEW POST
router.post('/create-post', async (req, res) => {
    try {
        const { image, caption } = req.body;
        await Post.create({
            user: "6a2ce755806c2f6cfce224e7", // Temporary Mock User ID
            image: image,
            caption: caption
        });
        res.redirect('/');
    } catch (err) {
        res.status(500).send("Error creating post");
    }
});

// 2. TOGGLE LIKE / UNLIKE
router.post('/like/:postId', async (req, res) => {
    try {
        const post = await Post.findById(req.params.postId);
        const userId = "6a2ce755806c2f6cfce224e7"; // Temporary Mock User ID

        // If user already liked it, remove like (Unlike). Else, add it.
        if (post.likes.includes(userId)) {
            post.likes.pull(userId);
        } else {
            post.likes.push(userId);
        }
        await post.save();
        res.redirect('/');
    } catch (err) {
        res.status(500).send("Error updating like");
    }
});

// 3. ADD A COMMENT
router.post('/comment/:postId', async (req, res) => {
    try {
        const newComment = await Comment.create({
            post: req.params.postId,
            user: "6a2ce755806c2f6cfce224e7", // Temporary Mock User ID
            text: req.body.commentText
        });

        // Push comment reference to the target Post document
        await Post.findByIdAndUpdate(req.params.postId, {
            $push: { comments: newComment._id }
        });

        res.redirect('/');
    } catch (err) {
        res.status(500).send("Error posting comment");
    }
});

module.exports = router;