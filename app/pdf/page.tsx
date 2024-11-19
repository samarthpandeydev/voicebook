'use client';

import { useState, useCallback } from 'react';
import { FiUpload, FiFile, FiX, FiLoader } from 'react-icons/fi';
import Navbar from '../components/Navbar';
import PodcastGenerator from '../components/PodcastGenerator';
import PodcastChat from '../components/PodcastChat';

export default function PDFPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [isUploaded, setIsUploaded] = useState(false);
  const [podcastScript, setPodcastScript] = useState('');

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type === 'application/pdf') {
        setFile(droppedFile);
      }
    }
  }, []);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    setMessage('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        if (data.alreadyExists) {
          setMessage('This PDF is already in the database!');
          setIsUploaded(true);
        } else {
          setMessage('PDF successfully processed and stored in Pinecone!');
          setIsUploaded(true);
        }
        setFile(null);
      } else {
        setMessage('Error: ' + data.error);
      }
    } catch (error) {
      setMessage('Error uploading file');
    } finally {
      setLoading(false);
    }
  };

  const handleScriptGenerated = (script: string) => {
    setPodcastScript(script);
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      <main className="pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {!isUploaded ? (
          <div className="max-w-xl mx-auto">
            <div className="bg-white rounded-3xl shadow-sm p-10 border border-gray-100">
              <div className="text-center mb-10">
                <h2 className="text-3xl font-normal text-gray-900 mb-3">
                  Upload Your PDF
                </h2>
                <p className="text-gray-600">
                  We'll process your document and prepare it for podcast conversion
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-8">
                <div
                  className={`relative border-2 border-dashed rounded-2xl p-10 transition-all
                    ${dragActive ? 'border-gray-400 bg-gray-50' : 'border-gray-200'}
                    ${file ? 'border-gray-400 bg-gray-50' : 'hover:border-gray-300'}`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  
                  <div className="text-center">
                    {file ? (
                      <div className="flex items-center justify-center space-x-3">
                        <FiFile className="w-8 h-8 text-gray-500" />
                        <span className="text-gray-600 font-medium">{file.name}</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setFile(null);
                          }}
                          className="p-1 rounded-full hover:bg-gray-100"
                        >
                          <FiX className="w-5 h-5 text-gray-500" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <FiUpload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                        <p className="text-gray-600 mb-2">
                          Drag and drop your PDF here, or click to browse
                        </p>
                        <p className="text-sm text-gray-500">
                          Only PDF files are supported
                        </p>
                      </>
                    )}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={!file || loading}
                  className={`w-full py-4 px-6 rounded-xl text-white font-medium
                    transition-all transform hover:scale-[1.02] active:scale-[0.98]
                    ${!file || loading
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-gray-900 hover:bg-gray-800 shadow-sm hover:shadow'
                    }`}
                >
                  <div className="flex items-center justify-center space-x-2">
                    {loading ? (
                      <>
                        <FiLoader className="w-5 h-5 animate-spin" />
                        <span>Processing...</span>
                      </>
                    ) : (
                      <>
                        <FiUpload className="w-5 h-5" />
                        <span>Upload and Process PDF</span>
                      </>
                    )}
                  </div>
                </button>
              </form>

              {message && (
                <div className="mt-6 p-4 rounded-xl flex items-center space-x-2 bg-gray-50 text-gray-600 border border-gray-200">
                  {message.includes('Error') ? (
                    <FiX className="w-5 h-5 flex-shrink-0 text-gray-500" />
                  ) : (
                    <FiFile className="w-5 h-5 flex-shrink-0 text-gray-500" />
                  )}
                  <p>{message}</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-16rem)]">
            <PodcastGenerator onScriptGenerated={handleScriptGenerated} />
            {podcastScript && <PodcastChat script={podcastScript} />}
          </div>
        )}
      </main>
    </div>
  );
}
