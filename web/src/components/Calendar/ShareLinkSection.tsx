/**
 * ShareLinkSection 컴포넌트
 * 
 * 캘린더 공유 링크를 생성하고 관리하는 컴포넌트
 * 
 * 주요 기능:
 * 1. 공유 링크 조회 및 표시
 * 2. 공유 링크 생성/재생성
 * 3. 공유 링크 복사
 */

import React, { useState, useEffect } from 'react';
import { calendarAPI } from '../../services/calendarApi';
import { toast } from 'react-toastify';
import styles from './ShareLinkSection.module.css';

interface ShareLinkSectionProps {
  calendarId: string;
  isAdmin: boolean;
}

const ShareLinkSection: React.FC<ShareLinkSectionProps> = ({ calendarId, isAdmin }) => {
  const [shareUrl, setShareUrl] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // 공유 링크 조회
  useEffect(() => {
    if (isAdmin && calendarId) {
      fetchShareLink();
    }
  }, [calendarId, isAdmin]);

  const fetchShareLink = async () => {
    try {
      setLoading(true);
      const response = await calendarAPI.getShareLink(calendarId);
      setShareUrl(response.data.share_url);
    } catch (error: any) {
      console.error('Failed to fetch share link:', error);
      if (error.response?.status !== 403) {
        toast.error('공유 링크를 불러오는데 실패했습니다.');
      }
    } finally {
      setLoading(false);
    }
  };

  // 공유 링크 생성/재생성
  const handleGenerateLink = async () => {
    try {
      setLoading(true);
      const response = await calendarAPI.generateShareLink(calendarId);
      setShareUrl(response.data.share_url);
      toast.success(response.data.message || '새로운 공유 링크가 생성되었습니다.');
    } catch (error: any) {
      console.error('Failed to generate share link:', error);
      toast.error(
        error.response?.data?.error || 
        '공유 링크 생성에 실패했습니다.'
      );
    } finally {
      setLoading(false);
    }
  };

  // 링크 복사
  const handleCopyLink = async () => {
    if (!shareUrl) {
      toast.error('공유 링크가 없습니다.');
      return;
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success('공유 링크가 클립보드에 복사되었습니다.');
      
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (error) {
      console.error('Failed to copy link:', error);
      toast.error('링크 복사에 실패했습니다.');
    }
  };

  if (!isAdmin) {
    return null;
  }

  return (
    <div className={styles.shareSection}>
      <div className={styles.sectionHeader}>
        <h3 className={styles.title}>공유 링크</h3>
        <p className={styles.description}>
          이 링크를 다른 사람에게 공유하면 캘린더에 참여할 수 있습니다.
        </p>
      </div>

      <div className={styles.linkContainer}>
        <div className={styles.linkInputGroup}>
          <input
            type="text"
            value={shareUrl}
            readOnly
            className={styles.linkInput}
            placeholder={loading ? '불러오는 중...' : '공유 링크를 생성해주세요'}
          />
          <button
            type="button"
            onClick={handleCopyLink}
            disabled={!shareUrl || loading}
            className={`${styles.copyButton} ${copied ? styles.copied : ''}`}
          >
            {copied ? (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                복사됨
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" stroke="currentColor" strokeWidth="2"/>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" stroke="currentColor" strokeWidth="2"/>
                </svg>
                복사
              </>
            )}
          </button>
        </div>

        <button
          type="button"
          onClick={handleGenerateLink}
          disabled={loading}
          className={styles.generateButton}
        >
          {shareUrl ? (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              링크 재생성
            </>
          ) : (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              링크 생성
            </>
          )}
        </button>
      </div>

      <div className={styles.infoBox}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
          <path d="M12 16V12M12 8h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
        <p>
          링크를 재생성하면 기존 링크는 더 이상 사용할 수 없습니다.
        </p>
      </div>
    </div>
  );
};

export default ShareLinkSection;
