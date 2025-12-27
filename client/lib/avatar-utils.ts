/**
 * Generates a colored avatar with user initials
 * @param name - User's name
 * @param size - Size of the avatar (default: 150)
 * @returns Data URL for the generated avatar
 */
export function generateAvatarDataUrl(name: string | null | undefined, size: number = 150): string {
    if (!name) {
        name = 'User';
    }

    // Get initials (first letter of first two words)
    const initials = name
        .split(' ')
        .slice(0, 2)
        .map(word => word[0])
        .join('')
        .toUpperCase();

    // Generate a consistent color based on the name
    const colors = [
        '#10b981', // green
        '#3b82f6', // blue
        '#8b5cf6', // purple
        '#f59e0b', // amber
        '#ef4444', // red
        '#06b6d4', // cyan
        '#ec4899', // pink
        '#14b8a6', // teal
    ];

    const colorIndex = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
    const bgColor = colors[colorIndex];

    // Create canvas
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
        return '';
    }

    // Draw circle background
    ctx.fillStyle = bgColor;
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
    ctx.fill();

    // Draw initials
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${size * 0.4}px Inter, system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(initials, size / 2, size / 2);

    return canvas.toDataURL('image/png');
}

/**
 * Gets the appropriate avatar URL - either the user's profile picture or a generated avatar
 * @param profilePicture - User's profile picture URL
 * @param name - User's name for generating initials
 * @param size - Size of the generated avatar
 * @returns Avatar URL
 */
export function getAvatarUrl(
    profilePicture: string | null | undefined,
    name: string | null | undefined,
    size: number = 150
): string {
    if (profilePicture) {
        return profilePicture;
    }
    return generateAvatarDataUrl(name, size);
}
