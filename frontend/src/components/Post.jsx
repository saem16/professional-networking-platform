const Post = ({ post }) => {
  return (
    <div className="border-b py-4">
      <div className="flex items-center space-x-3">
        <img
          src={post.user.profilePicture}
          alt={post.user.name}
          className="w-10 h-10 rounded-full"
        />
        <div>
          <p className="font-semibold">{post.user.name}</p>
          <p className="text-sm text-gray-500">@{post.user.username}</p>
        </div>
      </div>
      <p className="mt-2">{post.content}</p>
      {post.image && (
        <img src={post.image} alt="" className="mt-2 rounded-lg" />
      )}
    </div>
  );
};

export default Post;
