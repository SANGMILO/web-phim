'use client';

import React, { useEffect, useRef, useCallback } from 'react';
import { X } from 'lucide-react';

interface TrailerModalProps {
  url: string;
  title: string;
  onClose: () => void;
}

export function TrailerModal({ url, title, onClose }: TrailerModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose],
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    // Focus the modal
    modalRef.current?.focus();
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [handleKeyDown]);

  return (
    <div
      className="overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label={`Trailer: ${title}`}
    >
      <div
        ref={modalRef}
        className="modal"
        tabIndex={-1}
        style={{
          width: '90vw',
          maxWidth: '1000px',
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Đóng"
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            zIndex: 10,
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background 0.2s',
          }}
        >
          <X size={20} />
        </button>

        {/* Video */}
        <div style={{ aspectRatio: '16/9', width: '100%' }}>
          <iframe
            src={`${url}?autoplay=1&mute=1`}
            title={`Trailer: ${title}`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
              borderRadius: 'var(--radius-xl)',
            }}
          />
        </div>
      </div>
    </div>
  );
}
