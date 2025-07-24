'use client';

import { useState, useEffect } from 'react';
import { FiEdit2, FiLogOut } from 'react-icons/fi';
import { updateProfile } from 'firebase/auth';
import { auth } from '@/app/firebase/firebaseConfig';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { storage } from '@/app/firebase/firebaseConfig'; // ✅ Make sure you initialized this

export default function AccountSettings({ onSignOut, onProfileUpdate }) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [name, setName] = useState('');
  const [preview, setPreview] = useState(null);
  const [file, setFile] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((u) => {
      if (u) {
        setUser(u);
        setName(u.displayName || '');
        setPreview(u.photoURL || null);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      setFile(selected);
      setPreview(URL.createObjectURL(selected));
    }
  };

  const handleSaveProfile = async () => {
    try {
      let photoURL = user.photoURL;

      if (file) {
        const fileRef = ref(storage, `profileImages/${user.uid}`);
        await uploadBytes(fileRef, file);
        photoURL = await getDownloadURL(fileRef);
      }

      await updateProfile(auth.currentUser, {
        displayName: name,
        photoURL,
      });

      if (onProfileUpdate) {
        onProfileUpdate({ displayName: name, photoURL });
      }

      setShowEdit(false);
      alert('Profile updated successfully!');
    } catch (err) {
      console.error('Failed to update profile:', err);
      alert('Failed to update profile. Please try again.');
    }
  };

  return (
    <div>
      <p className="font-semibold text-gray-600 mb-2">Account</p>

      <div className="bg-gray-100 rounded-xl p-4 mb-3">
        <button
          onClick={() => setShowEdit(true)}
          className="w-full flex items-center gap-4 text-left font-medium text-gray-800 cursor-pointer"
        >
          <div className="min-w-[40px] h-10 w-10 flex items-center justify-center rounded-full bg-gray-200">
            <FiEdit2 size={20} className="text-[var(--color-primary)]" />
          </div>
          <span className="text-base font-medium">Edit Profile</span>
        </button>
      </div>

      <div className="bg-gray-100 rounded-xl p-4">
        <button
          onClick={() => setShowConfirm(true)}
          className="w-full flex items-center gap-4 text-left font-medium text-gray-800 cursor-pointer"
        >
          <div className="min-w-[40px] h-10 w-10 flex items-center justify-center rounded-full bg-red-100">
            <FiLogOut size={20} className="text-red-600" />
          </div>
          <span className="text-base font-medium">Sign Out</span>
        </button>
      </div>

      {/* Sign Out Confirm Modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
          <div className="bg-white rounded-xl p-6 w-11/12 max-w-sm text-center space-y-4">
            <h2 className="text-lg font-semibold text-gray-800">Confirm Sign Out</h2>
            <p className="text-sm text-gray-500">Are you sure you want to sign out?</p>
            <div className="flex justify-center gap-4 mt-4">
              <button
                onClick={() => setShowConfirm(false)}
                className="px-4 py-2 rounded-full border border-gray-300 text-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={onSignOut}
                className="px-4 py-2 rounded-full bg-red-500 text-white font-semibold"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      {showEdit && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
          <div className="bg-white rounded-xl p-6 w-11/12 max-w-sm shadow-xl space-y-5">
            <h2 className="text-lg font-semibold text-gray-800">Edit Profile</h2>

            <div className="flex justify-center">
              <label className="relative cursor-pointer">
                <input type="file" onChange={handleFileChange} className="hidden" />
                <img
                  src={preview || '/assets/avatar-placeholder.png'}
                  alt="Profile"
                  className="w-20 h-20 rounded-full object-cover border"
                />
                <span className="absolute bottom-0 right-0 bg-[var(--color-primary)] text-white text-xs px-2 py-1 rounded-full">
                  Edit
                </span>
              </label>
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">Your Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-[var(--color-primary)] focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-4">
              <button
                onClick={() => setShowEdit(false)}
                className="px-4 py-2 rounded-full border border-gray-300 text-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveProfile}
                className="px-4 py-2 rounded-full bg-[var(--color-primary)] text-white font-semibold"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
