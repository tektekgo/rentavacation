import { useCallback, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { usePropertyImages, type PropertyImage } from '@/hooks/usePropertyImages';
import { Camera, Upload, X, Loader2, ImageIcon } from 'lucide-react';
import { toast } from 'sonner';

interface PropertyImageUploadProps {
  propertyId: string | undefined;
  onImagesChange?: (urls: string[]) => void;
}

export function PropertyImageUpload({ propertyId, onImagesChange }: PropertyImageUploadProps) {
  const {
    images,
    isUploading,
    isLoading,
    error,
    listImages,
    uploadImage,
    deleteImage,
  } = usePropertyImages(propertyId);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (propertyId) {
      listImages();
    }
  }, [propertyId, listImages]);

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  useEffect(() => {
    onImagesChange?.(images.map((img) => img.url));
  }, [images, onImagesChange]);

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files) return;

      for (const file of Array.from(files)) {
        const result = await uploadImage(file);
        if (result) {
          toast.success(`Uploaded ${file.name}`);
        }
      }

      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    [uploadImage]
  );

  const handleDelete = useCallback(
    async (img: PropertyImage) => {
      await deleteImage(img.path);
      toast.success('Image removed');
    },
    [deleteImage]
  );

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      const files = e.dataTransfer.files;
      for (const file of Array.from(files)) {
        if (file.type.startsWith('image/')) {
          const result = await uploadImage(file);
          if (result) {
            toast.success(`Uploaded ${file.name}`);
          }
        }
      }
    },
    [uploadImage]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  if (!propertyId) {
    return (
      <div className="border-2 border-dashed border-border rounded-xl p-8 text-center">
        <ImageIcon className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
        <p className="text-muted-foreground text-sm">
          Save your property first to upload images
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onClick={() => fileInputRef.current?.click()}
      >
        {isUploading ? (
          <Loader2 className="w-10 h-10 mx-auto text-primary animate-spin mb-3" />
        ) : (
          <Upload className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
        )}
        <p className="text-muted-foreground mb-1">
          {isUploading ? 'Uploading...' : 'Drag & drop photos here, or click to browse'}
        </p>
        <p className="text-sm text-muted-foreground">
          JPG, PNG, or WebP. Max 10MB each.
        </p>
        <Button
          variant="outline"
          className="mt-3"
          disabled={isUploading}
          onClick={(e) => {
            e.stopPropagation();
            fileInputRef.current?.click();
          }}
        >
          <Camera className="w-4 h-4 mr-2" />
          Select Photos
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="hidden"
          onChange={handleFileSelect}
        />
      </div>

      {/* Image Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : images.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {images.map((img, index) => (
            <div
              key={img.path}
              className="relative group rounded-lg overflow-hidden aspect-square"
            >
              <img
                src={img.url}
                alt={`Property image ${index + 1}`}
                className="w-full h-full object-cover"
              />
              {index === 0 && (
                <span className="absolute top-2 left-2 px-2 py-0.5 text-xs font-medium bg-primary text-primary-foreground rounded">
                  Cover
                </span>
              )}
              <button
                onClick={() => handleDelete(img)}
                className="absolute top-2 right-2 w-7 h-7 rounded-full bg-destructive/90 text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground text-center py-4">
          No images uploaded yet. High quality photos get more bookings!
        </p>
      )}
    </div>
  );
}
