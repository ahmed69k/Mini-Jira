import React, { useState } from 'react';
import toast from 'react-hot-toast';

const ImageUpload = ({ taskId, imageUrl, imageKey, onImageUpdate, onImageDelete }) => {
  const [currentImageUrl, setCurrentImageUrl] = useState(imageUrl);
  const [currentImageKey, setCurrentImageKey] = useState(imageKey);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Vite uses import.meta.env instead of process.env
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

  const getAuthToken = () => {
    return localStorage.getItem('idToken');
  };

  const handleFileSelect = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Reset input
    event.target.value = '';

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      toast.error('File too large');
      return;
    }

    // Validate file type
    if (!file.type.match(/^image\/(jpeg|jpg|png)$/)) {
      toast.error('Only JPG and PNG files are allowed');
      return;
    }

    setLoading(true);

    try {
      const token = getAuthToken();
      if (!token) {
        toast.error('Authentication required');
        setLoading(false);
        return;
      }

      // Step 1: Get presigned URL
      const presignedResponse = await fetch(`${API_URL}/api/uploads/presigned-url`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          taskId,
          filename: file.name,
          contentType: file.type
        })
      });

      if (!presignedResponse.ok) {
        const errorData = await presignedResponse.json();
        throw new Error(errorData.error || 'Failed to get upload URL');
      }

      const { presignedUrl, key } = await presignedResponse.json();

      // Step 2: Upload to S3
      const uploadResponse = await fetch(presignedUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': file.type
        },
        body: file
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload image to S3');
      }

      // Step 3: Link image to task
      const linkResponse = await fetch(`${API_URL}/api/uploads/link`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          taskId,
          key
        })
      });

      if (!linkResponse.ok) {
        const errorData = await linkResponse.json();
        throw new Error(errorData.error || 'Failed to link image');
      }

      const { imageUrl: newImageUrl, imageKey: newImageKey } = await linkResponse.json();

      // Step 4: Show success
      toast.success('Image uploaded successfully');

      // Step 5: Update UI
      setCurrentImageUrl(newImageUrl);
      setCurrentImageKey(newImageKey);

      // Notify parent component
      if (onImageUpdate) {
        onImageUpdate(newImageUrl, newImageKey);
      }

    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error.message || 'Failed to upload image');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!currentImageKey) return;

    setDeleting(true);

    try {
      const token = getAuthToken();
      if (!token) {
        toast.error('Authentication required');
        setDeleting(false);
        return;
      }

      const response = await fetch(`${API_URL}/api/uploads/delete`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          key: currentImageKey
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete image');
      }

      toast.success('Image deleted');

      // Clear UI
      setCurrentImageUrl(null);
      setCurrentImageKey(null);

      // Notify parent component
      if (onImageDelete) {
        onImageDelete();
      }

    } catch (error) {
      console.error('Delete error:', error);
      toast.error(error.message || 'Failed to delete image');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="mt-4 border-t pt-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-2">Task Image</h3>

      {/* Current Image Display */}
      {currentImageUrl && (
        <div className="mb-3" style={{ maxWidth: '350px', maxHeight: '250px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
          <img
            src={currentImageUrl}
            alt="Task attachment"
            style={{ maxWidth: '100%', maxHeight: '250px', width: 'auto', height: 'auto', display: 'block', objectFit: 'contain' }}
          />
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2">
        {/* Upload Button */}
        <label className={`
          px-4 py-2 rounded-lg font-medium text-sm cursor-pointer
          ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}
          text-white transition-colors inline-flex items-center gap-2
        `}>
          {loading ? (
            <>
              <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Uploading...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              Upload Image
            </>
          )}
          <input
            type="file"
            accept="image/jpeg,image/jpg,image/png"
            onChange={handleFileSelect}
            disabled={loading}
            className="hidden"
          />
        </label>

        {/* Delete Button */}
        {currentImageUrl && (
          <button
            onClick={handleDelete}
            disabled={deleting}
            className={`
              px-4 py-2 rounded-lg font-medium text-sm
              ${deleting ? 'bg-gray-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'}
              text-white transition-colors inline-flex items-center gap-2
            `}
          >
            {deleting ? (
              <>
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Deleting...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete Image
              </>
            )}
          </button>
        )}
      </div>

      {/* File size limit info */}
      <p className="text-xs text-gray-500 mt-2">
        JPG or PNG only. Max size: 5MB
      </p>
    </div>
  );
};

export default ImageUpload;
