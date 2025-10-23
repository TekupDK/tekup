// Image Optimization Service for RendetaljeOS Frontend
// Handles image compression, lazy loading, and responsive images

export interface ImageOptimizationOptions {
  quality?: number; // 0-1, default 0.8
  maxWidth?: number;
  maxHeight?: number;
  format?: 'jpeg' | 'png' | 'webp';
  progressive?: boolean;
}

export interface ResponsiveImageConfig {
  breakpoints: number[];
  sizes: string[];
  quality?: number;
}

export interface LazyImageOptions {
  rootMargin?: string;
  threshold?: number;
  placeholder?: string;
  blurDataURL?: string;
}

class ImageOptimizationService {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private imageCache = new Map<string, string>();
  private loadingImages = new Map<string, Promise<string>>();

  constructor() {
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d')!;
  }

  // Compress and optimize image
  async optimizeImage(
    file: File | Blob,
    options: ImageOptimizationOptions = {}
  ): Promise<Blob> {
    const {
      quality = 0.8,
      maxWidth = 1920,
      maxHeight = 1080,
      format = 'jpeg',
      progressive = true
    } = options;

    return new Promise((resolve, reject) => {
      const img = new Image();
      
      img.onload = () => {
        try {
          // Calculate new dimensions
          const { width, height } = this.calculateDimensions(
            img.width,
            img.height,
            maxWidth,
            maxHeight
          );

          // Set canvas size
          this.canvas.width = width;
          this.canvas.height = height;

          // Draw and compress image
          this.ctx.drawImage(img, 0, 0, width, height);

          // Convert to blob with specified format and quality
          this.canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve(blob);
              } else {
                reject(new Error('Failed to compress image'));
              }
            },
            `image/${format}`,
            quality
          );
        } catch (error) {
          reject(error);
        }
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  }

  // Generate responsive image sizes
  async generateResponsiveImages(
    file: File,
    config: ResponsiveImageConfig
  ): Promise<{ size: number; blob: Blob; url: string }[]> {
    const results: { size: number; blob: Blob; url: string }[] = [];

    for (const breakpoint of config.breakpoints) {
      try {
        const optimizedBlob = await this.optimizeImage(file, {
          maxWidth: breakpoint,
          quality: config.quality || 0.8,
          format: 'webp'
        });

        const url = URL.createObjectURL(optimizedBlob);
        results.push({
          size: breakpoint,
          blob: optimizedBlob,
          url
        });
      } catch (error) {
        console.error(`Failed to generate ${breakpoint}px image:`, error);
      }
    }

    return results;
  }

  // Create blur placeholder
  async createBlurPlaceholder(file: File): Promise<string> {
    const tinyBlob = await this.optimizeImage(file, {
      maxWidth: 20,
      maxHeight: 20,
      quality: 0.1,
      format: 'jpeg'
    });

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(tinyBlob);
    });
  }

  // Lazy load image with intersection observer
  createLazyImage(
    src: string,
    options: LazyImageOptions = {}
  ): {
    ref: (element: HTMLImageElement | null) => void;
    isLoaded: boolean;
    error: string | null;
  } {
    let isLoaded = false;
    let error: string | null = null;
    let imageElement: HTMLImageElement | null = null;

    const {
      rootMargin = '50px',
      threshold = 0.1,
      placeholder = '',
      blurDataURL = ''
    } = options;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && imageElement) {
            this.loadImage(src)
              .then((optimizedSrc) => {
                if (imageElement) {
                  imageElement.src = optimizedSrc;
                  imageElement.classList.add('loaded');
                  isLoaded = true;
                }
              })
              .catch((err) => {
                error = err.message;
                console.error('Failed to load image:', err);
              });

            observer.unobserve(imageElement);
          }
        });
      },
      { rootMargin, threshold }
    );

    const ref = (element: HTMLImageElement | null) => {
      if (imageElement) {
        observer.unobserve(imageElement);
      }

      imageElement = element;

      if (element) {
        // Set placeholder
        if (blurDataURL) {
          element.src = blurDataURL;
          element.style.filter = 'blur(10px)';
          element.style.transition = 'filter 0.3s ease';
        } else if (placeholder) {
          element.src = placeholder;
        }

        observer.observe(element);
      }
    };

    return { ref, isLoaded, error };
  }

  // Progressive image loading
  async loadProgressiveImage(
    src: string,
    onProgress?: (progress: number) => void
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('GET', src, true);
      xhr.responseType = 'blob';

      xhr.onprogress = (event) => {
        if (event.lengthComputable && onProgress) {
          const progress = (event.loaded / event.total) * 100;
          onProgress(progress);
        }
      };

      xhr.onload = () => {
        if (xhr.status === 200) {
          const blob = xhr.response;
          const url = URL.createObjectURL(blob);
          resolve(url);
        } else {
          reject(new Error(`Failed to load image: ${xhr.status}`));
        }
      };

      xhr.onerror = () => reject(new Error('Network error'));
      xhr.send();
    });
  }

  // Image caching
  private async loadImage(src: string): Promise<string> {
    // Check cache first
    if (this.imageCache.has(src)) {
      return this.imageCache.get(src)!;
    }

    // Check if already loading
    if (this.loadingImages.has(src)) {
      return this.loadingImages.get(src)!;
    }

    // Start loading
    const loadPromise = this.fetchAndOptimizeImage(src);
    this.loadingImages.set(src, loadPromise);

    try {
      const optimizedSrc = await loadPromise;
      this.imageCache.set(src, optimizedSrc);
      this.loadingImages.delete(src);
      return optimizedSrc;
    } catch (error) {
      this.loadingImages.delete(src);
      throw error;
    }
  }

  private async fetchAndOptimizeImage(src: string): Promise<string> {
    const response = await fetch(src);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status}`);
    }

    const blob = await response.blob();
    
    // Only optimize if it's a large image
    if (blob.size > 100 * 1024) { // 100KB threshold
      const optimizedBlob = await this.optimizeImage(blob, {
        quality: 0.85,
        maxWidth: 1200,
        format: 'webp'
      });
      return URL.createObjectURL(optimizedBlob);
    }

    return URL.createObjectURL(blob);
  }

  // Calculate optimal dimensions
  private calculateDimensions(
    originalWidth: number,
    originalHeight: number,
    maxWidth: number,
    maxHeight: number
  ): { width: number; height: number } {
    let { width, height } = { width: originalWidth, height: originalHeight };

    // Scale down if necessary
    if (width > maxWidth) {
      height = (height * maxWidth) / width;
      width = maxWidth;
    }

    if (height > maxHeight) {
      width = (width * maxHeight) / height;
      height = maxHeight;
    }

    return { width: Math.round(width), height: Math.round(height) };
  }

  // WebP support detection
  supportsWebP(): Promise<boolean> {
    return new Promise((resolve) => {
      const webP = new Image();
      webP.onload = webP.onerror = () => {
        resolve(webP.height === 2);
      };
      webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
    });
  }

  // AVIF support detection
  supportsAVIF(): Promise<boolean> {
    return new Promise((resolve) => {
      const avif = new Image();
      avif.onload = avif.onerror = () => {
        resolve(avif.height === 2);
      };
      avif.src = 'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgABogQEAwgMg8f8D///8WfhwB8+ErK42A=';
    });
  }

  // Get optimal image format
  async getOptimalFormat(): Promise<'avif' | 'webp' | 'jpeg'> {
    if (await this.supportsAVIF()) {
      return 'avif';
    }
    if (await this.supportsWebP()) {
      return 'webp';
    }
    return 'jpeg';
  }

  // Preload critical images
  preloadImages(urls: string[]): Promise<void[]> {
    const preloadPromises = urls.map((url) => {
      return new Promise<void>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve();
        img.onerror = () => reject(new Error(`Failed to preload ${url}`));
        img.src = url;
      });
    });

    return Promise.all(preloadPromises);
  }

  // Clean up cached images
  clearCache(): void {
    // Revoke object URLs to free memory
    for (const url of this.imageCache.values()) {
      if (url.startsWith('blob:')) {
        URL.revokeObjectURL(url);
      }
    }
    this.imageCache.clear();
  }

  // Get cache statistics
  getCacheStats(): { size: number; urls: string[] } {
    return {
      size: this.imageCache.size,
      urls: Array.from(this.imageCache.keys())
    };
  }
}

// Export singleton instance
export const imageOptimization = new ImageOptimizationService();

// React hook for image optimization
export function useImageOptimization() {
  return {
    optimizeImage: imageOptimization.optimizeImage.bind(imageOptimization),
    generateResponsiveImages: imageOptimization.generateResponsiveImages.bind(imageOptimization),
    createBlurPlaceholder: imageOptimization.createBlurPlaceholder.bind(imageOptimization),
    createLazyImage: imageOptimization.createLazyImage.bind(imageOptimization),
    loadProgressiveImage: imageOptimization.loadProgressiveImage.bind(imageOptimization),
    preloadImages: imageOptimization.preloadImages.bind(imageOptimization),
    getOptimalFormat: imageOptimization.getOptimalFormat.bind(imageOptimization),
    clearCache: imageOptimization.clearCache.bind(imageOptimization),
    getCacheStats: imageOptimization.getCacheStats.bind(imageOptimization)
  };
}

// Utility function for responsive image srcSet
export function generateSrcSet(
  baseUrl: string,
  sizes: number[],
  format: string = 'webp'
): string {
  return sizes
    .map(size => `${baseUrl}?w=${size}&f=${format} ${size}w`)
    .join(', ');
}

// Utility function for responsive image sizes attribute
export function generateSizes(breakpoints: { size: number; vw: number }[]): string {
  return breakpoints
    .map(bp => `(max-width: ${bp.size}px) ${bp.vw}vw`)
    .join(', ');
}