const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const passport = require('passport');
const Post = require('../../models/Post')
const validatePostInput = require('../../validation/post')
const Profile = require('../../models/Profile')


// @route get api/posts/test
// @desc tests profile route
// @access public

router.get('/test', (req, res) => res.json({msg: "Posts Works"}));


// @route get api/posts
// @desc get posts
// @access public

router.get('/', (req, res) => {
  Post.find()
    .sort({ date: -1})
    .then(posts => res.json(posts))
    .catch(err => res.status(404).json({ nopostsfound: "No posts found"}));
});


// @route get api/posts/:id
// @desc get post by id
// @access public

router.get('/:id', (req, res) => {
  Post.findById(req.params.id)
    .then(post => res.json(post))
    .catch(err => res.status(404).json({nopostfound: "No post found with that id"}));
});

// @route post api/posts
// @desc create post
// @access private

router.post('/', passport.authenticate('jwt', { session: false }), (req, res) => {
  const { errors, isValid} = validatePostInput(req.body);

  if (!isValid){
    return res.status(400).json(errors)
  }

  const newPost = new Post({
    text: req.body.text,
    name: req.body.name,
    avatar: req.body.avatar,
    user: req.user.id
  })

  newPost.save().then(post => res.json(post));
});

// @route Delete api/posts/:id
// @desc delete the post
// @access private

router.delete('/:id', passport.authenticate('jwt', { session: false }), (req, res) => {
  Profile.findOne({ user: req.user.id })
  .then(profile => {
    Post.findById(req.params.id)
      .then(post => {
        // Check for post owner
        if(post.user.toString() !== req.user.id) {
          return res.status(401).json({ notauthorized: "user not authorized" });
        }
        post.remove().then(() => res.json({ success: true }))
      })
      .catch(err => res.status(404).json({ postnotfound: 'No post found' }))
  })
})

// @route post api/posts/like/:id
// @desc like post
// @access private

router.post('/like/:id', passport.authenticate('jwt', { session: false }), (req, res) => {
  Profile.findOne({ user: req.user.id })
  .then(profile => {
    Post.findById(req.params.id)
      .then(post => {
        if(post.likes.filter(like => like.user.toString() === req.user.id).length > 0) {
          return res.status(400).json({ alreadyliked: 'User already liked this post'});
        }
        // add user id to likes array
        post.likes.unshift({ user: req.user.id });

        post.save().then(post => res.json(post));
      })
      .catch(err => res.status(404).json({ postnotfound: 'No post found' }))
  })
})


// @route post api/posts/unlike/:id
// @desc unlike
// @access private

router.post('/unlike/:id', passport.authenticate('jwt', { session: false }), (req, res) => {
  Profile.findOne({ user: req.user.id })
  .then(profile => {
    Post.findById(req.params.id)
      .then(post => {
        if(post.likes.filter(like => like.user.toString() === req.user.id).length === 0) {
          return res.status(400).json({ notliked: 'You have not yet liked this post'});
        }
        // get remove index
        const removeIndex = post.likes
          .map(item => item.user.toString())
          .indexOf(req.user.id);

        // slice out of array
        post.likes.splice(removeIndex, 1);
        // save
        post.save().then(post => res.json(post))
      })
      .catch(err => res.status(404).json({ postnotfound: 'No post found' }))
  })
})

// @route post api/posts/comment/:id
// @desc comment on a post
// @access private

router.post('/comment/:id', passport.authenticate('jwt', { session: false }), (req, res) => {
  const { errors, isValid} = validatePostInput(req.body);

  if (!isValid){
    return res.status(400).json(errors)
  }
  Post.findById(req.params.id)
    .then(post => {
      const newComment = {
        text: req.body.text,
        name: req.body.name,
        avatar: req.body.avatar,
        user: req.user.id
      }
      // Add to comments array
      post.comments.unshift(newComment)
      // save
      post.save().then(post => res.json(post))
    })
    .catch(err => res.status(404).json({ postnotfound: 'No post found'}))
})


// @route delete api/posts/comment/:id/:comment_id
// @desc delete comment
// @access private

router.delete('/comment/:id/:comment_id', passport.authenticate('jwt', { session: false }), (req, res) => {

  Post.findById(req.params.id)
    .then(post => {
      // Check to see if the comment exists
      if(post.comments.filter(comment => comment._id.toString() === req.params.comment_id).length === 0) {
        return res.status(404).json({ commentnotexists: 'Comment does not exist'})
      }

      // get remove index
      const removeIndex = post.comments
        .map(item => item._id.toString())
        .indexOf(req.params.comment_id);

      // splice out of array
      post.comments.splice(removeIndex, 1);

      post.save().then(post => res.json(post));
    })
    .catch(err => res.status(404).json({ postnotfound: 'No post found'}))
})
















module.exports = router;
