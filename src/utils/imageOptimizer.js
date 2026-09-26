/**
 * Image Optimization Utility
 * Handles Cloudinary transformations and responsive image sizing
 */

// Check if URL is from Cloudinary
export const isCloudinaryUrl = (url) => {
  if (!url) return false;
  return url.includes('cloudinary.com');
};

// Get optimized Cloudinary URL for product thumbnails
export const getOptimizedProductImageUrl = (url, width = 400, quality = 80) => {
  if (!url || !isCloudinaryUrl(url)) return url;
  
  try {
    const urlObj = new URL(url);
    
    // Remove existing transformations to avoid conflicts
    const pathParts = urlObj.pathname.split('/');
    const uploadIndex = pathParts.indexOf('upload');
    
    if (uploadIndex !== -1) {
      // Insert transformations after 'upload'
      const transformations = `c_fill,w_${width},q_${quality},f_auto`;
      pathParts.splice(uploadIndex + 1, 0, transformations);
      urlObj.pathname = pathParts.join('/');
    }
    
    return urlObj.toString();
  } catch (e) {
    console.warn('Failed to optimize image URL:', url, e);
    return url;
  }
};

// Get optimized Cloudinary URL for hero images
export const getOptimizedHeroImageUrl = (url, width = 1920, quality = 85) => {
  if (!url || !isCloudinaryUrl(url)) return url;
  
  try {
    const urlObj = new URL(url);
    
    const pathParts = urlObj.pathname.split('/');
    const uploadIndex = pathParts.indexOf('upload');
    
    if (uploadIndex !== -1) {
      const transformations = `c_fill,w_${width},q_${quality},f_auto`;
      pathParts.splice(uploadIndex + 1, 0, transformations);
      urlObj.pathname = pathParts.join('/');
    }
    
    return urlObj.toString();
  } catch (e) {
    console.warn('Failed to optimize hero image URL:', url, e);
    return url;
  }
};

// Get responsive image URLs for <picture> element
export const getResponsiveImageUrls = (url) => {
  if (!url) return { mobile: url, tablet: url, desktop: url };
  
  return {
    mobile: isCloudinaryUrl(url) ? getOptimizedHeroImageUrl(url, 640, 80) : url,
    tablet: isCloudinaryUrl(url) ? getOptimizedHeroImageUrl(url, 1024, 82) : url,
    desktop: isCloudinaryUrl(url) ? getOptimizedHeroImageUrl(url, 1920, 85) : url
  };
};

// Get optimized video thumbnail from Cloudinary
export const getVideoThumbnailUrl = (videoUrl, width = 400, height = 300) => {
  if (!videoUrl || !isCloudinaryUrl(videoUrl)) return null;
  
  try {
    const urlObj = new URL(videoUrl);
    const pathParts = urlObj.pathname.split('/');
    const filename = pathParts[pathParts.length - 1];
    const nameWithoutExt = filename.substring(0, filename.lastIndexOf('.'));
    const folderPath = pathParts.slice(0, pathParts.length - 1).join('/');
    
    urlObj.pathname = `${folderPath}/${nameWithoutExt}.jpg`;
    urlObj.searchParams.set('so', '0'); // Get first frame
    urlObj.searchParams.set('w', width);
    urlObj.searchParams.set('h', height);
    urlObj.searchParams.set('c', 'fill');
    urlObj.searchParams.set('q', '80');
    urlObj.searchParams.set('f', 'jpg');
    
    return urlObj.toString();
  } catch (e) {
    console.warn('Failed to generate video thumbnail:', videoUrl, e);
    return null;
  }
};

// Generate dimensions string for img element to prevent layout shift
export const getImageDimensions = (aspectRatio = '16/9', maxWidth = 1920) => {
  const [width, height] = aspectRatio.split('/').map(Number);
  const scaledHeight = Math.round((maxWidth * height) / width);
  return `${maxWidth} / ${scaledHeight}`;
};
