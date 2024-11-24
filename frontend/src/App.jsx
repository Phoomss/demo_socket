import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';

const socket = io('http://localhost:4000');

function App() {
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState({ title: '', content: '' });
  const [editingPost, setEditingPost] = useState(null); // Track the post being edited
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchPosts();

    // Socket.IO event handlers
    const handlePostCreated = (post) => {
      setPosts((prev) => [...prev, post]);
    };
    const handlePostUpdated = (updatedPost) => {
      setPosts((prev) =>
        prev.map((post) => (post.id === updatedPost.id ? updatedPost : post))
      );
    };
    const handlePostDeleted = (deletedId) => {
      setPosts((prev) => prev.filter((post) => post.id !== parseInt(deletedId)));
    };

    socket.on('postCreated', handlePostCreated);
    socket.on('postUpdated', handlePostUpdated);
    socket.on('postDeleted', handlePostDeleted);

    return () => {
      socket.off('postCreated', handlePostCreated);
      socket.off('postUpdated', handlePostUpdated);
      socket.off('postDeleted', handlePostDeleted);
    };
  }, []);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get('http://localhost:4000/posts');
      setPosts(data);
    } catch (error) {
      console.error('Error fetching posts:', error);
      alert('Failed to fetch posts.');
    } finally {
      setLoading(false);
    }
  };

  const createPost = async () => {
    try {
      await axios.post('http://localhost:4000/posts', newPost);
      setNewPost({ title: '', content: '' });
    } catch (error) {
      console.error('Error creating post:', error);
      alert('Failed to create post.');
    }
  };

  const updatePost = async () => {
    try {
      await axios.put(`http://localhost:4000/posts/${editingPost.id}`, editingPost);
      setEditingPost(null); // Reset editing state
    } catch (error) {
      console.error('Error updating post:', error);
      alert('Failed to update post.');
    }
  };

  const deletePost = async (id) => {
    try {
      await axios.delete(`http://localhost:4000/posts/${id}`);
    } catch (error) {
      console.error('Error deleting post:', error);
      alert('Failed to delete post.');
    }
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div>
      <h1>CRUD with Prisma, React, and Socket.IO</h1>

      {editingPost ? (
        // Edit form
        <div>
          <h2>Edit Post</h2>
          <input
            type="text"
            placeholder="Title"
            value={editingPost.title}
            onChange={(e) =>
              setEditingPost({ ...editingPost, title: e.target.value })
            }
          />
          <input
            type="text"
            placeholder="Content"
            value={editingPost.content}
            onChange={(e) =>
              setEditingPost({ ...editingPost, content: e.target.value })
            }
          />
          <button onClick={updatePost}>Save Changes</button>
          <button onClick={() => setEditingPost(null)}>Cancel</button>
        </div>
      ) : (
        // Create form
        <div>
          <input
            type="text"
            placeholder="Title"
            value={newPost.title}
            onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
          />
          <input
            type="text"
            placeholder="Content"
            value={newPost.content}
            onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
          />
          <button onClick={createPost}>Create Post</button>
        </div>
      )}

      <ul>
        {posts.map((post) => (
          <li key={post.id}>
            <h2>{post.title}</h2>
            <p>{post.content}</p>
            <button onClick={() => setEditingPost(post)}>Edit</button>
            <button onClick={() => deletePost(post.id)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;
