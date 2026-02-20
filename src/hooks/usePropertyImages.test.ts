import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { createHookWrapper } from '@/test/helpers/render';

// Mock supabase
const mockList = vi.fn();
const mockUpload = vi.fn();
const mockRemove = vi.fn();
const mockGetPublicUrl = vi.fn();
const mockUpdate = vi.fn();
const mockEq = vi.fn();
const mockFrom = vi.fn();

vi.mock('@/lib/supabase', () => ({
  supabase: {
    storage: {
      from: () => ({
        list: mockList,
        upload: mockUpload,
        remove: mockRemove,
        getPublicUrl: mockGetPublicUrl,
      }),
    },
    from: (...args: unknown[]) => mockFrom(...args),
  },
  isSupabaseConfigured: () => true,
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'user-1' } }),
}));

const { usePropertyImages } = await import('./usePropertyImages');

beforeEach(() => {
  vi.clearAllMocks();
  mockGetPublicUrl.mockReturnValue({
    data: { publicUrl: 'https://storage.test/property-images/user-1/prop-1/image.jpg' },
  });
  mockFrom.mockReturnValue({
    update: mockUpdate.mockReturnValue({
      eq: mockEq.mockResolvedValue({ error: null }),
    }),
  });
});

describe('usePropertyImages', () => {
  describe('listImages', () => {
    it('lists images for a property', async () => {
      mockList.mockResolvedValue({
        data: [
          { name: 'photo1.jpg', created_at: '2026-01-01' },
          { name: 'photo2.png', created_at: '2026-01-02' },
        ],
        error: null,
      });

      const { result } = renderHook(() => usePropertyImages('prop-1'), {
        wrapper: createHookWrapper(),
      });

      await act(async () => {
        await result.current.listImages();
      });

      expect(result.current.images).toHaveLength(2);
      expect(result.current.images[0].name).toBe('photo1.jpg');
      expect(result.current.isLoading).toBe(false);
    });

    it('handles list errors gracefully', async () => {
      mockList.mockResolvedValue({
        data: null,
        error: { message: 'Storage error' },
      });

      const { result } = renderHook(() => usePropertyImages('prop-1'), {
        wrapper: createHookWrapper(),
      });

      await act(async () => {
        await result.current.listImages();
      });

      expect(result.current.error).toBe('Failed to load images');
      expect(result.current.images).toHaveLength(0);
    });
  });

  describe('uploadImage', () => {
    it('uploads an image successfully', async () => {
      mockUpload.mockResolvedValue({ error: null });

      const { result } = renderHook(() => usePropertyImages('prop-1'), {
        wrapper: createHookWrapper(),
      });

      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

      let uploadResult: unknown;
      await act(async () => {
        uploadResult = await result.current.uploadImage(file);
      });

      expect(uploadResult).toBeTruthy();
      expect(result.current.images).toHaveLength(1);
      expect(mockUpload).toHaveBeenCalled();
    });

    it('rejects files larger than 10MB', async () => {
      const { result } = renderHook(() => usePropertyImages('prop-1'), {
        wrapper: createHookWrapper(),
      });

      // Create a mock large file
      const largeFile = new File(['x'.repeat(100)], 'large.jpg', { type: 'image/jpeg' });
      Object.defineProperty(largeFile, 'size', { value: 11 * 1024 * 1024 });

      let uploadResult: unknown;
      await act(async () => {
        uploadResult = await result.current.uploadImage(largeFile);
      });

      expect(uploadResult).toBeNull();
      expect(result.current.error).toBe('File too large. Maximum size is 10MB.');
    });

    it('rejects non-image files', async () => {
      const { result } = renderHook(() => usePropertyImages('prop-1'), {
        wrapper: createHookWrapper(),
      });

      const pdfFile = new File(['pdf'], 'doc.pdf', { type: 'application/pdf' });

      let uploadResult: unknown;
      await act(async () => {
        uploadResult = await result.current.uploadImage(pdfFile);
      });

      expect(uploadResult).toBeNull();
      expect(result.current.error).toBe('Invalid file type. Please upload JPG, PNG, or WebP images.');
    });
  });

  describe('deleteImage', () => {
    it('deletes an image', async () => {
      mockRemove.mockResolvedValue({ error: null });
      mockList.mockResolvedValue({
        data: [{ name: 'photo1.jpg', created_at: '2026-01-01' }],
        error: null,
      });

      const { result } = renderHook(() => usePropertyImages('prop-1'), {
        wrapper: createHookWrapper(),
      });

      // Load images first
      await act(async () => {
        await result.current.listImages();
      });

      expect(result.current.images).toHaveLength(1);

      // Delete
      await act(async () => {
        await result.current.deleteImage(result.current.images[0].path);
      });

      expect(result.current.images).toHaveLength(0);
      expect(mockRemove).toHaveBeenCalled();
    });
  });

  describe('updatePropertyImages', () => {
    it('updates property images array', async () => {
      const { result } = renderHook(() => usePropertyImages('prop-1'), {
        wrapper: createHookWrapper(),
      });

      await act(async () => {
        await result.current.updatePropertyImages(['url1', 'url2']);
      });

      expect(mockFrom).toHaveBeenCalledWith('properties');
    });
  });
});
