import React, { useState, useRef, useCallback, useEffect } from 'react';
import axios from 'axios';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { showToast } from '../utils/toast';
import {
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  Link,
  Image,
  Undo,
  Redo,
  Eye,
  Save,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
} from 'lucide-react';
import { getSession } from '../utils/Session';

const CreatePost = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const editPostId = searchParams.get('edit');
  const [content, setContent] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [banner, setBanner] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [expandedToolbar, setExpandedToolbar] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const editorRef = useRef(null);
  const fileInputRef = useRef(null);

  const token = getSession('token');

  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.style.color = '#FFFFFF';
      document.execCommand('styleWithCSS', false, true);
      document.execCommand('foreColor', false, '#FFFFFF');
    }
    
    if (editPostId) {
      fetchPostForEdit();
    }
  }, [editPostId]);

  const fetchPostForEdit = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/posts/${editPostId}/edit`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const post = response.data;
      setContent(post.content || '');
      setBanner(post.banner || null);
      setIsEditing(true);
      
      if (editorRef.current) {
        editorRef.current.innerHTML = post.content || '';
      }
    } catch (error) {
      showToast.error('Failed to load post for editing');
    }
  };

  const executeCommand = useCallback((command, value = null) => {
    if (editorRef.current) {
      editorRef.current.focus();
      document.execCommand('styleWithCSS', false, true);
      document.execCommand(command, false, value);

      if (command !== 'foreColor') {
        setTimeout(() => {
          const selection = window.getSelection();
          if (selection.rangeCount > 0) {
            document.execCommand('foreColor', false, '#FFFFFF');
          }
        }, 10);
      }
    }
  }, []);

  const uploadImageToServer = async file => {
    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/posts/upload`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        return response.data.file.url;
      }
      throw new Error('Upload failed');
    } catch (error) {
      showToast.error('Failed to upload image. Please try again.');
      return null;
    }
  };

  const extractFirstImageFromContent = htmlContent => {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;
    const firstImg = tempDiv.querySelector('img');
    return firstImg ? firstImg.src : null;
  };

  const handleImageUpload = useCallback(
    async event => {
      const files = Array.from(event.target.files || []);
      if (files.length === 0) return;

      setIsUploading(true);

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file && file.type.startsWith('image/')) {
          const uploadedUrl = await uploadImageToServer(file);
          if (!uploadedUrl) continue;

          if (!banner && i === 0) {
            setBanner(uploadedUrl);
          }

          const wrapper = document.createElement('div');
          wrapper.className = 'resize-wrapper';
          wrapper.setAttribute('contenteditable', 'false');
          wrapper.setAttribute('draggable', 'false');
          wrapper.style.cssText = `
            display: inline-block;
            max-width: 100%;
            width: min(300px, 90vw);
            margin: 5px;
            border-radius: 4px;
            vertical-align: top;
            resize: both;
            overflow: auto;
            border: 2px solid transparent;
          `;

          const img = document.createElement('img');
          img.src = uploadedUrl;
          img.style.cssText = `
            width: 100%;
            height: auto;
            display: block;
            border-radius: 4px;
            user-select: none;
            -webkit-user-drag: none;
          `;
          img.setAttribute('contenteditable', 'false');
          img.setAttribute('draggable', 'false');
          wrapper.appendChild(img);

          if (editorRef.current) {
            editorRef.current.focus();
            const selection = window.getSelection();
            if (selection && selection.rangeCount > 0) {
              const range = selection.getRangeAt(0);
              range.deleteContents();
              range.insertNode(wrapper);

              const space = document.createTextNode(' ');
              range.collapse(false);
              range.insertNode(space);
              range.setStartAfter(space);
              range.collapse(true);
              selection.removeAllRanges();
              selection.addRange(range);
            } else {

              editorRef.current.appendChild(wrapper);
              const space = document.createTextNode(' ');
              editorRef.current.appendChild(space);
            }

            setContent(editorRef.current.innerHTML);
          }
        }
      }

      setIsUploading(false);
      event.target.value = '';
    },
    [banner]
  );

  const handleContentChange = useCallback(() => {
    if (editorRef.current) {
      const newContent = editorRef.current.innerHTML;
      setContent(newContent);

      if (!banner) {
        const firstImageUrl = extractFirstImageFromContent(newContent);
        if (firstImageUrl && firstImageUrl.includes(window.location.origin)) {
          setBanner(firstImageUrl);
        }
      }
    }
  }, [banner]);

  const handleKeyDown = useCallback(e => {
    setTimeout(() => {
      document.execCommand('styleWithCSS', false, true);
      document.execCommand('foreColor', false, '#FFFFFF');
    }, 10);
  }, []);

  const fontSizes = ['1', '2', '3', '4', '5', '6', '7'];
  const colors = [
    '#FFFFFF',
    '#000000',
    '#EF4444',
    '#10B981',
    '#3B82F6',
    '#F59E0B',
    '#8B5CF6',
    '#06B6D4',
    '#F97316',
    '#EC4899',
  ];

  const ToolbarButton = ({
    onClick,
    children,
    title,
    active = false,
    disabled = false,
  }) => (
    <button
      onClick={onClick}
      title={title}
      disabled={disabled}
      className={`p-2 rounded border transition-all duration-200 ${disabled
          ? 'bg-gray-500 text-gray-300 border-gray-400 cursor-not-allowed'
          : active
            ? 'bg-white text-black border-white'
            : 'bg-black text-white border-white hover:bg-white hover:text-black'
        }`}
    >
      {children}
    </button>
  );

  const handlePublishPost = async () => {
    if (!content.trim()) {
      showToast.error('Please add some content to your post');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('content', content);

      if (banner) {
        formData.append('banner', banner);
      }

      if (isEditing && editPostId) {
        formData.append('postId', editPostId);
      }

      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/posts`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`,
          },
        }
      );

      showToast.success(res.data.message || (isEditing ? 'Post updated!' : 'Post published!'));
      navigate('/');
    } catch (err) {
      showToast.error(err.response?.data?.message || 'Error saving post');
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-2 sm:p-4 md:p-6 lg:p-8 bg-black min-h-screen">
      <div className="flex items-center gap-4 mb-4 sm:mb-6">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-neutral-800 rounded-lg transition-colors"
        >
          <ArrowLeft size={20} className="text-white" />
        </button>
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white">
          {isEditing ? 'Edit Post' : 'Create Post'}
        </h1>
      </div>
      {banner && (
        <div className="mb-3 sm:mb-4 md:mb-6 border border-white rounded-lg overflow-hidden">
          <div className="flex justify-between items-center p-2 sm:p-3 bg-white/10">
            <span className="text-white text-xs sm:text-sm md:text-base">Banner Image</span>
            <button
              onClick={() => setBanner(null)}
              className="text-white hover:text-red-400 text-xs sm:text-sm md:text-base transition-colors duration-200"
            >
              Remove Banner
            </button>
          </div>
          <img src={banner} alt="Banner" className="w-full h-24 sm:h-32 md:h-40 lg:h-48 xl:h-56 object-cover" />
        </div>
      )}

      <div className="border border-white rounded-lg p-2 sm:p-3 lg:p-4 mb-3 sm:mb-4 lg:mb-6 bg-black">

        <div className="flex flex-wrap gap-1 sm:gap-2 items-center pb-2">

          <div className="flex gap-1 border-r border-white pr-2 mr-2">
            <ToolbarButton onClick={() => executeCommand('bold')} title="Bold">
              <Bold size={16} className="w-3 h-3 sm:w-4 sm:h-4" />
            </ToolbarButton>
            <ToolbarButton onClick={() => executeCommand('italic')} title="Italic">
              <Italic size={16} className="w-3 h-3 sm:w-4 sm:h-4" />
            </ToolbarButton>
            <ToolbarButton onClick={() => executeCommand('underline')} title="Underline">
              <Underline size={16} className="w-3 h-3 sm:w-4 sm:h-4" />
            </ToolbarButton>
          </div>


          <div className="flex gap-1 border-r border-white pr-2 mr-2">
            <ToolbarButton
              onClick={() => fileInputRef.current?.click()}
              title={`Insert Images${isUploading ? ' - Uploading...' : ''}`}
              disabled={isUploading}
            >
              <Image size={16} className="w-3 h-3 sm:w-4 sm:h-4" />
            </ToolbarButton>
          </div>


          <div className="flex gap-1 border-r border-white pr-2 mr-2">
            <ToolbarButton
              onClick={() => setShowPreview(!showPreview)}
              title="Toggle Preview"
              active={showPreview}
            >
              <Eye size={16} className="w-3 h-3 sm:w-4 sm:h-4" />
            </ToolbarButton>
          </div>


          <div className="md:hidden">
            <ToolbarButton
              onClick={() => setExpandedToolbar(!expandedToolbar)}
              title={expandedToolbar ? "Collapse Toolbar" : "Expand Toolbar"}
            >
              {expandedToolbar ? (
                <ChevronUp size={16} className="w-3 h-3" />
              ) : (
                <ChevronDown size={16} className="w-3 h-3" />
              )}
            </ToolbarButton>
          </div>
        </div>


        <div className={`${expandedToolbar ? 'block' : 'hidden'} md:block`}>
          <div className="flex flex-wrap gap-1 sm:gap-2 items-center border-t border-white/20 pt-2 md:border-t-0 md:pt-0">

            <div className="flex gap-1 border-r border-white pr-2 mr-2">
              <select
                onChange={e => executeCommand('fontSize', e.target.value)}
                className="p-1 border border-white rounded bg-black text-white text-xs sm:text-sm min-w-0"
                defaultValue="3"
              >
                {fontSizes.map(size => (
                  <option key={size} value={size} className="bg-black text-white">
                    {size === '1'
                      ? 'Tiny'
                      : size === '2'
                        ? 'Small'
                        : size === '3'
                          ? 'Normal'
                          : size === '4'
                            ? 'Medium'
                            : size === '5'
                              ? 'Large'
                              : size === '6'
                                ? 'XL'
                                : 'XXL'}
                  </option>
                ))}
              </select>
            </div>


            <div className="flex gap-1 border-r border-white pr-2 mr-2">
              <div className="flex gap-1 flex-wrap">
                {colors.slice(0, expandedToolbar ? 10 : 5).map(color => (
                  <button
                    key={color}
                    onClick={() => executeCommand('foreColor', color)}
                    className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 rounded border border-white hover:scale-110 transition-transform"
                    style={{ backgroundColor: color }}
                    title={`Text Color: ${color}`}
                  />
                ))}
              </div>
            </div>


            <div className="flex gap-1 border-r border-white pr-2 mr-2">
              <ToolbarButton onClick={() => executeCommand('justifyLeft')} title="Align Left">
                <AlignLeft size={16} className="w-3 h-3 sm:w-4 sm:h-4" />
              </ToolbarButton>
              <ToolbarButton onClick={() => executeCommand('justifyCenter')} title="Align Center">
                <AlignCenter size={16} className="w-3 h-3 sm:w-4 sm:h-4" />
              </ToolbarButton>
              <ToolbarButton onClick={() => executeCommand('justifyRight')} title="Align Right">
                <AlignRight size={16} className="w-3 h-3 sm:w-4 sm:h-4" />
              </ToolbarButton>
              <ToolbarButton onClick={() => executeCommand('justifyFull')} title="Justify">
                <AlignJustify size={16} className="w-3 h-3 sm:w-4 sm:h-4" />
              </ToolbarButton>
            </div>


            <div className="flex gap-1 border-r border-white pr-2 mr-2">
              <ToolbarButton onClick={() => executeCommand('insertUnorderedList')} title="Bullet List">
                <List size={16} className="w-3 h-3 sm:w-4 sm:h-4" />
              </ToolbarButton>
              <ToolbarButton onClick={() => executeCommand('insertOrderedList')} title="Numbered List">
                <ListOrdered size={16} className="w-3 h-3 sm:w-4 sm:h-4" />
              </ToolbarButton>
            </div>


            <div className="flex gap-1 border-r border-white pr-2 mr-2">
              <ToolbarButton
                onClick={() => {
                  const url = window.prompt('Enter URL:');
                  if (url) executeCommand('createLink', url);
                }}
                title="Insert Link"
              >
                <Link size={16} className="w-3 h-3 sm:w-4 sm:h-4" />
              </ToolbarButton>
            </div>


            <div className="flex gap-1">
              <ToolbarButton onClick={() => executeCommand('undo')} title="Undo">
                <Undo size={16} className="w-3 h-3 sm:w-4 sm:h-4" />
              </ToolbarButton>
              <ToolbarButton onClick={() => executeCommand('redo')} title="Redo">
                <Redo size={16} className="w-3 h-3 sm:w-4 sm:h-4" />
              </ToolbarButton>
            </div>
          </div>
        </div>

        {isUploading && (
          <div className="mt-2 text-center text-white/70 text-xs sm:text-sm">
            Uploading images...
          </div>
        )}
      </div>

      <div className="min-h-64 sm:min-h-80 md:min-h-96 lg:min-h-[32rem] xl:min-h-[36rem] border border-white rounded bg-black">
        {showPreview ? (
          <div className="p-3 sm:p-4 md:p-5 lg:p-6">
            {banner && (
              <img
                src={banner}
                alt="Banner"
                className="w-full h-32 sm:h-40 md:h-48 lg:h-64 object-cover rounded mb-4 lg:mb-6"
              />
            )}
            <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold mb-4 lg:mb-6 text-white">
              {title || 'Untitled Post'}
            </h1>
            <div
              className="max-w-none text-white text-sm sm:text-base"
              dangerouslySetInnerHTML={{ __html: content }}
            />
          </div>
        ) : (
          <div
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            onInput={handleContentChange}
            onKeyDown={handleKeyDown}
            className="p-3 sm:p-4 md:p-5 lg:p-6 min-h-64 sm:min-h-80 md:min-h-96 lg:min-h-[32rem] xl:min-h-[36rem] outline-none text-white focus:ring-2 focus:ring-white/30 focus:border-white/50 transition-all duration-200"
            style={{
              fontSize: '14px',
              lineHeight: '1.6',
              color: '#FFFFFF',
            }}
            placeholder="Start writing your post... Add images anywhere, resize them by clicking, type text inline with images!"
          ></div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleImageUpload}
        className="hidden"
      />

      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mt-4 lg:mt-6 gap-3">
        <div className="text-xs sm:text-sm lg:text-sm text-white/50">
          {content.replace(/<[^>]*>/g, '').length} characters
          {banner && <span className="ml-2 lg:ml-4">✓ Banner set</span>}
        </div>
        <div className="flex gap-2 sm:gap-3">
          <button
            onClick={() => navigate(-1)}
            className="px-3 sm:px-4 lg:px-6 py-2 border border-white text-white rounded hover:bg-white hover:text-black transition-all duration-200 text-xs sm:text-sm lg:text-base"
          >
            Cancel
          </button>
          <button
            className="px-3 sm:px-4 lg:px-6 py-2 bg-white text-black rounded hover:bg-white/90 transition-all duration-200 flex items-center gap-1 sm:gap-2 disabled:bg-gray-500 disabled:cursor-not-allowed text-xs sm:text-sm lg:text-base"
            onClick={handlePublishPost}
            disabled={isUploading}
          >
            <Save size={12} className="sm:w-3.5 sm:h-3.5 lg:w-4 lg:h-4" />
            {isUploading ? 'Uploading...' : isEditing ? 'Update Post' : 'Publish Post'}
          </button>
        </div>
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
          .resize-wrapper {
            display: inline-block;
            resize: both;
            overflow: auto;
            max-width: 100%;
            width: 300px;
            border-radius: 4px;
            position: relative;
          }
          
          @media (max-width: 640px) {
            .resize-wrapper {
              width: 250px;
              max-width: 90vw;
            }
          }
          
          @media (max-width: 480px) {
            .resize-wrapper {
              width: 200px;
              max-width: 85vw;
            }
          }
          
          .resize-wrapper img {
            width: 100%;
            height: auto;
            display: block;
            border-radius: 4px;
          }
          .resize-wrapper::-webkit-resizer {
            background: rgba(255,255,255,0.6);
          }
          
          [contenteditable]:empty:before {
            content: attr(placeholder);
            color: #FFFFFF80;
            font-style: italic;
            pointer-events: none;
          }
          
          [contenteditable] {
            color: #FFFFFF !important;
          }
          
          [contenteditable] * {
            color: inherit;
          }
          
          [contenteditable] img {
            transition: all 0.2s ease;
            user-select: none;
            -webkit-user-drag: none;
          }
          
          [contenteditable] img:hover {
            opacity: 0.9;
          }
          
          [contenteditable]:focus {
            border-color: #FFFFFF !important;
            box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.2);
          }
          
          [contenteditable] img + * {
            display: inline;
          }
          
          .resize-wrapper {
            background: transparent;
            border-radius: 4px;
          }
          
          .resize-wrapper:hover {
            border-color: #FFFFFF !important;
          }
          
          .resize-wrapper::after {
            content: '';
            position: absolute;
            bottom: 2px;
            right: 2px;
            width: 12px;
            height: 12px;
            background: linear-gradient(-45deg, transparent 30%, #FFFFFF 30%, #FFFFFF 40%, transparent 40%, transparent 60%, #FFFFFF 60%, #FFFFFF 70%, transparent 70%);
            pointer-events: none;
          }
          
          @media (max-width: 640px) {
            .resize-wrapper::after {
              width: 10px;
              height: 10px;
              bottom: 1px;
              right: 1px;
            }
          }
          
          [contenteditable] img + br {
            display: none;
          }
          
          .resize-wrapper::-webkit-resizer {
            background: #FFFFFF;
            border: 1px solid #000000;
          }
          
          @media (max-width: 640px) {
            [contenteditable] {
              font-size: 13px !important;
            }
          }
          
          @media (max-width: 480px) {
            [contenteditable] {
              font-size: 12px !important;
            }
          }
        `,
        }}
      />
    </div>
  );
};

export default CreatePost;
