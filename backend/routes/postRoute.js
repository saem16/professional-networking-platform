import express from 'express';
import multer from 'multer';
import path from 'path';
import Post from '../models/Post.js';
import User from '../models/User.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import NotificationService from '../services/notificationService.js';

const router = express.Router();

const getBaseURL = req => {
  return process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;
};

const upload = multer({ dest: 'uploads/' });

router.post('/upload', authMiddleware, (req, res) => {
  res.redirect(307, '/upload/posts/single');
});

router.post('/', authMiddleware, async (req, res) => {
  try {
    const content = req.body.content;
    const postId = req.body.postId;
    const banner = req.body.banner;

    if (!content || !content.trim()) {
      return res.status(400).json({ message: 'Content is required' });
    }

    const baseURL = getBaseURL(req);
    let post;
    let isNewPost = false;

    if (postId) {
      post = await Post.findById(postId);
      if (!post) {
        return res.status(404).json({ message: 'Post not found' });
      }

      if (post.user.toString() !== req.userId) {
        return res
          .status(403)
          .json({ message: 'Not authorized to edit this post' });
      }

      post.content = content;

      if (req.file) {
        post.banner = `${baseURL}/uploads/${req.file.filename}`;
      } else if (banner) {
        post.banner = banner;
      }

      post.publishedAt = new Date();
    } else {
      isNewPost = true;
      let bannerUrl = null;

      if (req.file) {
        bannerUrl = `${baseURL}/uploads/${req.file.filename}`;
      } else if (banner) {
        bannerUrl = banner;
      } else {
        const imgMatch = content.match(/<img[^>]+src="([^">]+)"/);
        if (imgMatch && imgMatch[1]) {
          bannerUrl = imgMatch[1];
        }
      }

      post = new Post({
        user: req.userId,
        content,
        banner: bannerUrl,
        publishedAt: new Date(),
      });
    }

    await post.save();

    const populatedPost = await post.populate(
      'user',
      'name username profilePicture'
    );

    if (isNewPost) {
      try {
        let title = content.substring(0, 50);

        const headingMatch = content.match(/<h[1-6][^>]*>([^<]+)<\/h[1-6]>/i);
        if (headingMatch && headingMatch[1]) {
          title = headingMatch[1].trim();
        } else {
          title = content
            .replace(/<[^>]*>/g, '')
            .trim()
            .substring(0, 50);
          if (title.length === 50) {
            title += '...';
          }
        }

        await NotificationService.createPostPublishedNotification(
          req.userId,
          populatedPost._id,
          title
        );
      } catch (notificationError) {
        console.error('Failed to create post notification:', notificationError);
      }
    }

    res.status(postId ? 200 : 201).json({
      message: 'Post published successfully',
      post: populatedPost,
    });
  } catch (error) {
    console.error('Error saving post:', error);
    res.status(500).json({ message: 'Error saving post' });
  }
});


router.get('/', async (req, res) => {
  try {
    const posts = await Post.find({}).sort({ createdAt: -1 })
      .populate('user', 'name username profilePicture')
      .populate({
        path: 'comments.user',
        select: 'name username profilePicture',
      })
      .populate({
        path: 'comments.replies.user',
        select: 'name username profilePicture',
      })
      .sort({ publishedAt: -1 });

    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/network', authMiddleware, async (req, res) => {
  try {
    const currentUser = await User.findById(req.userId);
    if (!currentUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    const connectionIds = currentUser.connections || [];
    
    const posts = await Post.find({ 
      user: { $in: [...connectionIds, req.userId] } 
    })
      .populate('user', 'name username profilePicture')
      .populate({
        path: 'comments.user',
        select: 'name username profilePicture',
      })
      .populate({
        path: 'comments.replies.user',
        select: 'name username profilePicture',
      })
      .sort({ publishedAt: -1 });

    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


router.get('/user-posts', authMiddleware, async (req, res) => {
  try {
    const { username } = req.query;
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    const posts = await Post.find({
      user: user._id,
    })
      .populate('user', 'name username profilePicture')
      .sort({ publishedAt: -1 });

    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).populate(
      'user',
      'name username profilePicture'
    );

    if (!post) return res.status(404).json({ message: 'Post not found' });

    res.json(post);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/:id/edit', authMiddleware, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).populate(
      'user',
      'name username profilePicture'
    );

    if (!post) return res.status(404).json({ message: 'Post not found' });

    if (post.user._id.toString() !== req.userId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    res.json(post);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/:id/comments', authMiddleware, async (req, res) => {
  try {
    const { text, parentCommentId } = req.body;
    const postId = req.params.id;
    
    const post = await Post.findById(postId).populate('user', 'name username profilePicture');

    if (!post) return res.status(404).json({ message: 'Post not found' });

    if (!text || !text.trim()) {
      return res.status(400).json({ message: 'Comment text is required' });
    }

    const newComment = {
      user: req.userId,
      text: text.trim(),
      replies: [],
      createdAt: new Date(),
    };

    if (parentCommentId) {
      const addReply = comments => {
        for (let comment of comments) {
          if (comment._id.toString() === parentCommentId) {
            comment.replies.push(newComment);
            return true;
          }
          if (addReply(comment.replies)) return true;
        }
        return false;
      };
      
      const replyAdded = addReply(post.comments);
      if (!replyAdded) {
        return res.status(404).json({ message: 'Parent comment not found' });
      }
    } else {
      post.comments.push(newComment);
    }

    await post.save();
    
    const populated = await post.populate([
      {
        path: 'comments.user',
        select: 'name username profilePicture'
      },
      {
        path: 'comments.replies.user',
        select: 'name username profilePicture'
      }
    ]);

    if (post.user._id.toString() !== req.userId) {
      try {
        let postTitle = post.title || post.content?.replace(/<[^>]*>/g, '').trim().substring(0, 50);
        if (postTitle && postTitle.length === 50) {
          postTitle += '...';
        }

        await NotificationService.createPostCommentNotification(
          req.userId,
          post.user._id,
          postId,
          text.trim(),
          postTitle || 'Untitled Post'
        );
      } catch (notificationError) {
        console.error('Failed to create comment notification:', notificationError);
      }
    }

    res.status(201).json({
      message: 'Comment added successfully',
      comments: populated.comments
    });
  } catch (err) {
    console.error('Error adding comment:', err);
    res.status(500).json({ message: 'Error adding comment' });
  }
});

router.delete('/:id/comments/:commentId', authMiddleware, async (req, res) => {
  try {
    const { id, commentId } = req.params;
    const post = await Post.findById(id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const deleteCommentRecursive = comments => {
      return comments.filter(comment => {
        if (comment._id.toString() === commentId) {
          return false;
        }
        comment.replies = deleteCommentRecursive(comment.replies);
        return true;
      });
    };

    post.comments = deleteCommentRecursive(post.comments);
    await post.save();

    res.json({ message: 'Comment deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/:id/like', authMiddleware, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).populate('user', 'name username profilePicture');
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const userId = req.userId;
    const isLiked = post.likes.includes(userId);

    if (isLiked) {
      post.likes = post.likes.filter(id => id.toString() !== userId);
    } else {
      post.likes.push(userId);
      
      if (post.user._id.toString() !== userId) {
        try {
          let postTitle = post.content?.replace(/<[^>]*>/g, '').trim().substring(0, 50);
          if (postTitle && postTitle.length === 50) {
            postTitle += '...';
          }

          await NotificationService.createPostLikeNotification(
            userId,
            post.user._id,
            post._id,
            postTitle || 'Untitled Post'
          );
        } catch (notificationError) {
          console.error('Failed to create like notification:', notificationError);
        }
      }
    }

    await post.save();

    res.json({
      likes: post.likes,
      isLiked: !isLiked
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    if (post.user.toString() !== req.userId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await Post.findByIdAndDelete(req.params.id);

    res.json({ message: 'Post deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;