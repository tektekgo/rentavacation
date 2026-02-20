import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

const BUCKET = 'property-images';
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export interface PropertyImage {
  path: string;
  url: string;
  name: string;
}

export function usePropertyImages(propertyId: string | undefined) {
  const { user } = useAuth();
  const [images, setImages] = useState<PropertyImage[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const folder = user && propertyId ? `${user.id}/${propertyId}` : null;

  const listImages = useCallback(async () => {
    if (!folder) return;
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: listError } = await supabase.storage
        .from(BUCKET)
        .list(folder, { sortBy: { column: 'created_at', order: 'asc' } });

      if (listError) throw listError;

      const imageList: PropertyImage[] = (data || [])
        .filter((f) => !f.name.startsWith('.'))
        .map((f) => {
          const path = `${folder}/${f.name}`;
          const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(path);
          return {
            path,
            url: urlData.publicUrl,
            name: f.name,
          };
        });

      setImages(imageList);
    } catch (err) {
      console.error('Error listing images:', err);
      setError('Failed to load images');
    } finally {
      setIsLoading(false);
    }
  }, [folder]);

  const uploadImage = useCallback(
    async (file: File): Promise<PropertyImage | null> => {
      if (!folder || !user) {
        setError('Must be logged in');
        return null;
      }

      if (file.size > MAX_FILE_SIZE) {
        setError('File too large. Maximum size is 10MB.');
        return null;
      }

      if (!ALLOWED_TYPES.includes(file.type)) {
        setError('Invalid file type. Please upload JPG, PNG, or WebP images.');
        return null;
      }

      setIsUploading(true);
      setError(null);

      try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = `${folder}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from(BUCKET)
          .upload(filePath, file, { upsert: false });

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(filePath);

        const newImage: PropertyImage = {
          path: filePath,
          url: urlData.publicUrl,
          name: fileName,
        };

        setImages((prev) => [...prev, newImage]);
        return newImage;
      } catch (err) {
        console.error('Error uploading image:', err);
        setError('Failed to upload image');
        return null;
      } finally {
        setIsUploading(false);
      }
    },
    [folder, user]
  );

  const deleteImage = useCallback(
    async (path: string) => {
      setError(null);
      try {
        const { error: deleteError } = await supabase.storage
          .from(BUCKET)
          .remove([path]);

        if (deleteError) throw deleteError;

        setImages((prev) => prev.filter((img) => img.path !== path));
      } catch (err) {
        console.error('Error deleting image:', err);
        setError('Failed to delete image');
      }
    },
    []
  );

  const updatePropertyImages = useCallback(
    async (imageUrls: string[]) => {
      if (!propertyId) return;

      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error: updateError } = await (supabase as any)
          .from('properties')
          .update({ images: imageUrls })
          .eq('id', propertyId);

        if (updateError) throw updateError;
      } catch (err) {
        console.error('Error updating property images:', err);
        setError('Failed to save image order');
      }
    },
    [propertyId]
  );

  return {
    images,
    isUploading,
    isLoading,
    error,
    listImages,
    uploadImage,
    deleteImage,
    updatePropertyImages,
  };
}
