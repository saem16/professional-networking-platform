import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../models/User.js';
import Post from '../models/Post.js';
import Message from '../models/Message.js';
import JobApplication from '../models/JobApplication.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class FileCleanupService {
  static async cleanupUnusedFiles() {
    try {
      const uploadsDir = path.join(__dirname, '../uploads');
      const usedFiles = new Set();

      // Get all files referenced in database
      await Promise.all([
        this.getUserFiles(usedFiles),
        this.getPostFiles(usedFiles),
        this.getMessageFiles(usedFiles),
        this.getResumeFiles(usedFiles)
      ]);

      // Get all files in uploads directory
      const allFiles = this.getAllUploadedFiles(uploadsDir);
      
      // Delete unused files
      let deletedCount = 0;
      for (const filePath of allFiles) {
        const fileName = path.basename(filePath);
        if (!usedFiles.has(fileName)) {
          try {
            fs.unlinkSync(filePath);
            deletedCount++;
            console.log(`Deleted unused file: ${fileName}`);
          } catch (error) {
            console.error(`Failed to delete ${fileName}:`, error.message);
          }
        }
      }

      console.log(`Cleanup completed. Deleted ${deletedCount} unused files.`);
      return deletedCount;
    } catch (error) {
      console.error('File cleanup error:', error);
      throw error;
    }
  }

  static async getUserFiles(usedFiles) {
    const users = await User.find({}).select('profilePicture coverPhoto');
    users.forEach(user => {
      if (user.profilePicture) this.extractFileName(user.profilePicture, usedFiles);
      if (user.coverPhoto) this.extractFileName(user.coverPhoto, usedFiles);
    });
  }

  static async getPostFiles(usedFiles) {
    const posts = await Post.find({}).select('banner');
    posts.forEach(post => {
      if (post.banner) this.extractFileName(post.banner, usedFiles);
    });
  }

  static async getMessageFiles(usedFiles) {
    const messages = await Message.find({ 'attachments.0': { $exists: true } }).select('attachments');
    messages.forEach(message => {
      message.attachments?.forEach(attachment => {
        if (attachment.fileName) usedFiles.add(attachment.fileName);
      });
    });
  }

  static async getResumeFiles(usedFiles) {
    const applications = await JobApplication.find({}).select('resume');
    applications.forEach(app => {
      if (app.resume) usedFiles.add(app.resume);
    });
  }

  static extractFileName(url, usedFiles) {
    if (!url) return;
    const fileName = url.split('/').pop();
    if (fileName) usedFiles.add(fileName);
  }

  static getAllUploadedFiles(dir) {
    const files = [];
    
    const scanDirectory = (currentDir) => {
      try {
        const items = fs.readdirSync(currentDir);
        items.forEach(item => {
          const fullPath = path.join(currentDir, item);
          const stat = fs.statSync(fullPath);
          
          if (stat.isDirectory()) {
            scanDirectory(fullPath);
          } else {
            files.push(fullPath);
          }
        });
      } catch (error) {
        console.error(`Error scanning directory ${currentDir}:`, error.message);
      }
    };

    scanDirectory(dir);
    return files;
  }
}

export default FileCleanupService;